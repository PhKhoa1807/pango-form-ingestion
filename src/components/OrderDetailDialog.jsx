import { useEffect, useState } from 'react'
import { getOrderDetail } from '../lib/supabase.js'
import { money, discountAmount } from '../lib/pango.js'

// Số tiền giảm 1 dòng SP (theo product_discount + type) và thành tiền sau giảm.
const itemGross = (it) => (Number(it.price) || 0) * (Number(it.qty) || 0)
const itemDiscount = (it) =>
  discountAmount(
    { mode: it.product_discount_type === 'percent' ? 'percent' : 'vnd', value: it.product_discount },
    itemGross(it),
  )
const itemNet = (it) => itemGross(it) - itemDiscount(it)

const statusStyle = (s) => {
  const t = String(s ?? '').toLowerCase()
  if (t.includes('hoàn thành') || t.includes('đã giao') || t.includes('thành công'))
    return 'bg-ok/10 text-ok'
  return 'bg-orange/10 text-orange'
}

// Một dòng thông tin khách (nhãn trái, giá trị phải). full -> chiếm trọn 1 hàng.
function Info({ label, value, full }) {
  return (
    <div className={`flex gap-2 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="w-[140px] shrink-0 whitespace-nowrap text-muted">{label}:</span>
      <span className="font-medium text-txt">{value || '—'}</span>
    </div>
  )
}

// Dialog xem chi tiết 1 đơn hàng (thông tin khách + danh sách sản phẩm).
export default function OrderDetailDialog({ orderId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // Đóng bằng phím Esc.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr('')
    getOrderDetail(orderId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [orderId])

  const c = data?.customers || {}
  const items = data?.order_items || []
  const th = 'border border-line bg-card2 px-[9px] py-[7px] text-left text-xs font-semibold text-muted'
  const td = 'border border-line px-[9px] py-[7px]'
  const tdNum = `${td} text-right tabular-nums`

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[920px] rounded-xl border border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-txt">Thông tin đơn hàng</h2>
            {data?.order_code && (
              <span className="text-[13px] font-semibold text-accent2">{data.order_code}</span>
            )}
            {data?.status && (
              <span
                className={`rounded-md px-2 py-[2px] text-[12px] font-semibold ${statusStyle(data.status)}`}
              >
                {data.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md px-2 py-1 text-lg leading-none text-muted hover:bg-card2 hover:text-txt"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="py-8 text-center text-muted">Đang tải chi tiết đơn…</div>
          ) : err ? (
            <div className="py-8 text-center text-err">⚠️ {err}</div>
          ) : (
            <>
              {/* Thông tin khách */}
              <div className="grid gap-2 text-[13px] sm:grid-cols-2">
                <Info label="Tên khách hàng" value={c.name} />
                <Info label="Số điện thoại" value={c.phone} />
                <Info label="Mã khách hàng" value={c.customer_code} />
                <Info label="Mã đơn hàng" value={data.order_code} />
                <Info label="Trạng thái đơn hàng" value={data.status} />
                <Info label="Địa chỉ" value={c.address} />
                <Info label="Tỉnh / Thành phố" value={c.province} />
                <Info label="Phường / Xã" value={c.ward} />
              </div>

              {/* Danh sách sản phẩm */}
              <h3 className="mb-2 mt-5 text-[14px] font-bold text-accent2">📦 Sản phẩm trong đơn</h3>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={`${th} w-[34px]`}>#</th>
                    <th className={th}>Mã hàng</th>
                    <th className={th}>Tên hàng</th>
                    <th className={`${th} text-right`}>Số lượng</th>
                    <th className={`${th} text-right`}>Đơn giá</th>
                    <th className={`${th} text-right`}>Giảm giá</th>
                    <th className={`${th} text-right`}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td className={`${td} p-4 text-center text-muted`} colSpan={7}>
                        Đơn không có sản phẩm.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, i) => (
                      <tr key={i}>
                        <td className={td}>{i + 1}</td>
                        <td className={td}>{it.product_code || '—'}</td>
                        <td className={td}>{it.product_name || '—'}</td>
                        <td className={tdNum}>{it.qty}</td>
                        <td className={tdNum}>{money(it.price)}</td>
                        <td className={tdNum}>{money(itemDiscount(it))}</td>
                        <td className={tdNum}>{money(itemNet(it))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Tổng tiền hàng */}
              <div className="mt-3 flex items-center justify-end gap-3 text-[14px]">
                <span className="text-txt">Tổng tiền hàng</span>
                <b className="text-[18px] tabular-nums text-accent">
                  {money(items.reduce((s, it) => s + itemNet(it), 0))}
                </b>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
