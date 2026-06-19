import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchField, Dropdown, Label, Button as HButton, Pagination } from '@heroui/react'
import { Card, Button } from '../components/ui.jsx'
import { listOrders, deleteOrders, supabaseEnabled } from '../lib/supabase.js'
import { toast } from '../components/Toast.jsx'
import { money } from '../lib/pango.js'

// Bỏ dấu + thường hóa để search "không cần đúng dấu".
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')

// Định dạng thời gian: 19/06/2026 13:05
const fmtTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// Màu badge trạng thái: hoàn thành/đã giao -> xanh, còn lại (phiếu tạm...) -> cam.
const statusStyle = (s) => {
  const t = norm(s)
  if (t.includes('hoan thanh') || t.includes('da giao') || t.includes('thanh cong'))
    return 'bg-ok/10 text-ok'
  return 'bg-orange/10 text-orange'
}

// Ô tick (hỗ trợ trạng thái indeterminate cho ô "chọn tất cả").
function Checkbox({ checked, indeterminate, onChange, ariaLabel }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer accent-accent"
    />
  )
}

// Trang Quản lý đơn hàng: search + tạo đơn + chọn nhiều + danh sách đơn.
export default function ManageOrders({ onNavigate }) {
  const PER_PAGE = 10
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set()) // order_id đã tick
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false)
      setErr('Chưa cấu hình Supabase — không tải được danh sách đơn.')
      return
    }
    let alive = true
    listOrders()
      .then((data) => alive && setOrders(data))
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  // Lọc theo Mã đơn / Tên KH / Mã KH (bỏ dấu).
  const filtered = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return orders
    return orders.filter(
      (o) =>
        norm(o.order_code).includes(q) ||
        norm(o.customer_name).includes(q) ||
        norm(o.customer_code).includes(q),
    )
  }, [orders, query])

  // Trạng thái tick: tất cả / một phần (chỉ xét các dòng đang hiển thị).
  const allChecked = filtered.length > 0 && filtered.every((o) => selected.has(o.order_id))
  const someChecked = !allChecked && filtered.some((o) => selected.has(o.order_id))

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) filtered.forEach((o) => next.delete(o.order_id))
      else filtered.forEach((o) => next.add(o.order_id))
      return next
    })

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleDelete = async () => {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (!window.confirm(`Xóa ${ids.length} đơn hàng đã chọn? Hành động không thể hoàn tác.`)) return
    try {
      await deleteOrders(ids)
      setOrders((os) => os.filter((o) => !selected.has(o.order_id)))
      setSelected(new Set())
      toast.success('Đã xóa', `Đã xóa ${ids.length} đơn hàng.`)
    } catch (e) {
      toast.danger('Xóa đơn lỗi', e.message)
    }
  }

  // ---- Phân trang (10 đơn / trang) ----
  // Đổi từ khóa search -> về trang 1.
  useEffect(() => setPage(1), [query])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  // Kết quả co lại (xóa đơn / lọc) khiến trang hiện tại vượt quá -> kéo về trang cuối.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1
  const endItem = Math.min(currentPage * PER_PAGE, filtered.length)

  // Dãy số trang hiển thị (chèn '…' khi nhiều trang).
  const pageNumbers = () => {
    const pages = [1]
    if (currentPage > 3) pages.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  const th = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted'
  const td = 'px-4 py-3 align-middle'

  return (
    <div>
      {/* Tiêu đề */}
      <div className="mb-4">
        <h1 className="mb-1 text-xl font-bold">📋 Quản lý đơn hàng</h1>
        <p className="m-0 text-[13px] text-muted">Xem &amp; tra cứu các đơn đã tạo</p>
      </div>

      {/* Thanh công cụ: search (trái) + nút Đặt hàng & menu thao tác (phải) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SearchField
          aria-label="Tìm đơn hàng"
          value={query}
          onChange={setQuery}
          className="inline-block"
        >
          <SearchField.Group className="w-[340px] max-w-full rounded-lg border border-line bg-card">
            <SearchField.SearchIcon className="text-muted" />
            <SearchField.Input placeholder="Theo mã đơn, tên / mã khách hàng..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex items-center gap-2">
          <Button variant="lime" size="sm" onClick={() => onNavigate?.('create-order')}>
            + Tạo đơn hàng
          </Button>

          {selected.size > 0 && (
            <Dropdown>
              <HButton
                aria-label="Thao tác hàng loạt"
                className="flex items-center justify-center rounded-lg border border-line bg-card px-3 py-[6px] text-base leading-none text-txt hover:border-accent hover:bg-card2"
              >
                ⋯
              </HButton>
              <Dropdown.Popover className="min-w-[180px]">
                <Dropdown.Menu onAction={(key) => key === 'delete' && handleDelete()}>
                  <Dropdown.Item id="delete" textValue="Xóa đơn hàng">
                    <Label className="cursor-pointer font-semibold text-err">Xóa đơn hàng</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Danh sách đơn */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-card2">
                <th className={`${th} w-[44px]`}>
                  <Checkbox
                    ariaLabel="Chọn tất cả"
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={toggleAll}
                  />
                </th>
                <th className={th}>Mã đơn hàng</th>
                <th className={th}>Thời gian</th>
                <th className={th}>Mã KH</th>
                <th className={th}>Tên khách hàng</th>
                <th className={`${th} text-right`}>Tổng hóa đơn</th>
                <th className={th}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted" colSpan={7}>
                    Đang tải danh sách đơn…
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td className="px-4 py-8 text-center text-err" colSpan={7}>
                    ⚠️ {err}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted" colSpan={7}>
                    {query ? 'Không tìm thấy đơn phù hợp.' : 'Chưa có đơn hàng nào.'}
                  </td>
                </tr>
              ) : (
                paged.map((o) => {
                  const checked = selected.has(o.order_id)
                  return (
                    <tr
                      key={o.order_id}
                      className={`border-b border-line last:border-0 transition-colors hover:bg-card2/60 ${
                        checked ? 'bg-accent/5' : ''
                      }`}
                    >
                      <td className={td}>
                        <Checkbox
                          ariaLabel={`Chọn đơn ${o.order_code}`}
                          checked={checked}
                          onChange={() => toggleOne(o.order_id)}
                        />
                      </td>
                      <td className={`${td} font-semibold text-accent2`}>{o.order_code || '—'}</td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{fmtTime(o.order_date)}</td>
                      <td className={`${td} whitespace-nowrap`}>{o.customer_code || '—'}</td>
                      <td className={td}>{o.customer_name || '—'}</td>
                      <td className={`${td} text-right tabular-nums font-semibold`}>
                        {money(o.total_amount)}
                      </td>
                      <td className={td}>
                        {o.status ? (
                          <span
                            className={`inline-block rounded-md px-2 py-[3px] text-[12px] font-semibold ${statusStyle(o.status)}`}
                          >
                            {o.status}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!loading && !err && filtered.length > 0 && (
        <Pagination className="mt-3 w-full">
          <Pagination.Summary>
            Hiển thị {startItem}–{endItem} / {filtered.length} đơn
            {selected.size > 0 ? ` · đã chọn ${selected.size}` : ''}
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous isDisabled={currentPage === 1} onPress={() => setPage((p) => p - 1)}>
                <Pagination.PreviousIcon />
                <span>Trước</span>
              </Pagination.Previous>
            </Pagination.Item>
            {pageNumbers().map((p, i) =>
              p === 'ellipsis' ? (
                <Pagination.Item key={`ellipsis-${i}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={p}>
                  <Pagination.Link isActive={p === currentPage} onPress={() => setPage(p)}>
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={currentPage === totalPages}
                onPress={() => setPage((p) => p + 1)}
              >
                <span>Sau</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      )}
    </div>
  )
}
