import { useEffect, useState } from 'react'
import { Popover, Dropdown, Label, Button as HButton } from '@heroui/react'
import { Card, Field, TextInput, Button } from './ui.jsx'
import { ProductPicker } from './ProductPicker.jsx'
import { toast } from './Toast.jsx'
import { searchProductsByCode, searchProductsByName, getAllCategories } from '../lib/supabase.js'
import { money, lineTotal, discountAmount } from '../lib/pango.js'

const EMPTY_ROW = { pid: '', pname: '', price: '', qty: '1' }

const round2 = (n) => Math.round(n * 100) / 100

// Bảng sản phẩm trong đơn + hàng nhập sản phẩm mới.
export default function ProductsTable({ products, setProducts, discount, setDiscount }) {
  const [row, setRow] = useState(EMPTY_ROW)
  const [category, setCategory] = useState('') // danh mục lọc Mã SP / Tên SP ('' = tất cả)
  const [categories, setCategories] = useState([])
  const upd = (k) => (e) => setRow((r) => ({ ...r, [k]: e.target.value }))

  // Nạp danh sách danh mục cho dropdown (1 lần khi mở form).
  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  // Đổi danh mục -> reset Mã SP / Tên SP / Đơn giá / Số lượng để tìm lại từ đầu.
  const onSelectCategory = (keys) => {
    const key = Array.from(keys)[0]
    setCategory(!key || key === '__all__' ? '' : String(key))
    setRow(EMPTY_ROW)
  }

  // Chọn 1 sản phẩm từ danh mục -> tự điền mã + tên + đơn giá (giữ nguyên số lượng).
  const onPickProduct = (p) =>
    setRow((r) => ({ ...r, pid: p.code, pname: p.name, price: String(p.price) }))

  const addProduct = () => {
    const pid = row.pid.trim()
    const pname = row.pname.trim()
    const price = parseInt(row.price, 10)
    const qty = parseInt(row.qty, 10)
    if (!pname && !pid)
      return toast.danger('Thiếu thông tin sản phẩm', 'Nhập ít nhất Mã SP hoặc Tên sản phẩm.')
    if (isNaN(price) || price < 0) return alert('Đơn giá không hợp lệ.')
    if (isNaN(qty) || qty <= 0) return alert('Số lượng phải > 0.')
    setProducts((p) => [...p, { pid, pname, price, qty }])
    setRow(EMPTY_ROW)
  }

  const removeProduct = (i) => setProducts((p) => p.filter((_, idx) => idx !== i))

  const onAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addProduct()
    }
  }

  const grand = products.reduce((s, p) => s + lineTotal(p), 0)
  const th = 'border border-line bg-card2 px-[9px] py-[7px] text-left text-xs font-semibold text-muted'
  const td = 'border border-line px-[9px] py-[7px]'
  const tdNum = `${td} text-right tabular-nums`

  return (
    <Card>
      <h2 className="mb-3 text-[15px] text-accent2 font-bold">📦 Sản phẩm trong đơn</h2>
      <table className="mt-[6px] w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className={`${th} w-[34px]`}>#</th>
            <th className={th}>Mã SP</th>
            <th className={th}>Tên sản phẩm</th>
            <th className={`${th} text-right`}>Đơn giá</th>
            <th className={`${th} text-right`}>Số lượng</th>
            <th className={`${th} text-right`}>Thành tiền</th>
            <th className={`${th} w-[36px]`}></th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td className={`${td} p-4 text-center text-muted`} colSpan={7}>
                Chưa có sản phẩm — thêm ở ô bên dưới.
              </td>
            </tr>
          ) : (
            products.map((p, i) => (
              <tr key={i}>
                <td className={td}>{i + 1}</td>
                <td className={td}>{p.pid || '—'}</td>
                <td className={td}>{p.pname || '—'}</td>
                <td className={tdNum}>{money(p.price)}</td>
                <td className={tdNum}>{p.qty}</td>
                <td className={tdNum}>{money(lineTotal(p))}</td>
                <td className={td}>
                  <button
                    className="cursor-pointer border-none bg-transparent px-1 text-base text-err hover:opacity-70"
                    title="Xóa"
                    onClick={() => removeProduct(i)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Hàng nhập sản phẩm mới */}
      <div
        className="mt-[14px] grid grid-cols-2 items-end gap-2 sm:grid-cols-[0.9fr_1fr_1.6fr_1fr_0.8fr_auto]"
        onKeyDown={onAddKeyDown}
      >
        <Field label="Danh mục">
          <Dropdown>
            <HButton
              aria-label="Danh mục"
              className="flex w-full items-center justify-between rounded-lg border border-line bg-card2 px-[9px] py-[6px] text-[13px] text-txt outline-none focus:border-accent"
            >
              <span className={category ? 'text-txt' : 'text-muted/70'}>{category || 'Tất cả'}</span>
              <span className="ml-2 text-muted">▾</span>
            </HButton>
            <Dropdown.Popover className="min-w-[200px]">
              <Dropdown.Menu
                selectedKeys={new Set([category || '__all__'])}
                selectionMode="single"
                onSelectionChange={onSelectCategory}
              >
                <Dropdown.Item id="__all__" textValue="Tất cả">
                  <Dropdown.ItemIndicator />
                  <Label>Tất cả</Label>
                </Dropdown.Item>
                {categories.map((c) => (
                  <Dropdown.Item key={c} id={c} textValue={c}>
                    <Dropdown.ItemIndicator />
                    <Label>{c}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </Field>
        <Field label="Mã SP">
          <ProductPicker
            size="sm"
            value={row.pid}
            onChange={(v) => setRow((r) => ({ ...r, pid: v }))}
            search={(q) => searchProductsByCode(q, category)}
            onPick={onPickProduct}
            placeholder="Gõ mã SP để tìm..."
          />
        </Field>
        <Field label="Tên sản phẩm">
          <ProductPicker
            size="sm"
            value={row.pname}
            onChange={(v) => setRow((r) => ({ ...r, pname: v }))}
            search={(q) => searchProductsByName(q, category)}
            onPick={onPickProduct}
            placeholder="Gõ tên SP để tìm..."
          />
        </Field>
        <Field label="Đơn giá">
          <TextInput size="sm" type="number" value={row.price} onChange={upd('price')} placeholder="120" />
        </Field>
        <Field label="Số lượng">
          <TextInput size="sm" type="number" value={row.qty} onChange={upd('qty')} placeholder="1" />
        </Field>
        <Button variant="lime" size="sm" onClick={addProduct}>
          + Thêm
        </Button>
      </div>

      {/* Tổng kết đơn: tổng tiền hàng → giảm giá (popover) → khách cần trả */}
      <div className="mt-[16px] ml-auto w-full max-w-[340px] text-[14px]">
        <div className="flex items-center justify-between py-[6px]">
          <span className="text-txt">
            Tổng tiền hàng <span className="text-accent">{products.length}</span>
          </span>
          <span className="tabular-nums">{money(grand)}</span>
        </div>

        <div className="flex items-center justify-between py-[6px]">
          <span className="inline-flex items-center gap-1 text-txt">
            Giảm giá
            {discount.mode === 'percent' && Number(discount.value) > 0 && (
              <span className="text-accent">({Number(discount.value).toFixed(2)}%)</span>
            )}
          </span>
          <Popover>
            <Popover.Trigger className="cursor-pointer tabular-nums text-txt underline decoration-dotted decoration-line underline-offset-4 hover:text-accent">
              {money(discountAmount(discount, grand))}
            </Popover.Trigger>
            <Popover.Content className="z-50 rounded-lg border border-line bg-card p-3 shadow-lg">
              <Popover.Dialog className="outline-none">
                <DiscountEditor discount={discount} setDiscount={setDiscount} grand={grand} />
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>

        <div className="my-1 border-t border-line" />

        <div className="flex items-center justify-between py-[6px]">
          <b className="text-txt">Khách cần trả</b>
          <b className="text-[20px] tabular-nums text-accent">
            {money(grand - discountAmount(discount, grand))}
          </b>
        </div>
      </div>
    </Card>
  )
}

// Nội dung popover chỉnh giảm giá: ô nhập số + chọn đơn vị VND / % (theo tổng tiền hàng).
// Đổi đơn vị -> tự quy đổi giá trị để số tiền giảm giữ nguyên (vd 2000đ <-> % của tổng đơn).
function DiscountEditor({ discount, setDiscount, grand }) {
  const setMode = (mode) =>
    setDiscount((d) => {
      if (d.mode === mode) return d
      const amount = discountAmount(d, grand) // số tiền giảm hiện tại
      const value =
        mode === 'percent'
          ? grand > 0 ? String(round2((amount / grand) * 100)) : ''
          : String(amount)
      return { mode, value }
    })

  // Nhập số: ở chế độ % thì chặn vượt 100.
  const onValueChange = (e) => {
    let raw = e.target.value
    if (discount.mode === 'percent' && raw !== '' && Number(raw) > 100) raw = '100'
    setDiscount((d) => ({ ...d, value: raw }))
  }

  const unitBtn = (active) =>
    `px-3 py-[5px] text-[13px] font-semibold transition-colors ${
      active ? 'bg-accent text-white' : 'bg-card2 text-txt hover:bg-line'
    }`
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-[13px] font-semibold">Giảm giá</span>
      <input
        type="number"
        min="0"
        max={discount.mode === 'percent' ? 100 : undefined}
        autoFocus
        value={discount.value}
        onChange={onValueChange}
        className="w-[90px] border-0 border-b-2 border-accent bg-transparent px-1 py-[3px] text-right tabular-nums text-txt outline-none"
        placeholder="0"
      />
      <div className="flex overflow-hidden rounded-md border border-line">
        <button type="button" className={unitBtn(discount.mode === 'vnd')} onClick={() => setMode('vnd')}>
          VND
        </button>
        <button
          type="button"
          className={`${unitBtn(discount.mode === 'percent')} border-l border-line`}
          onClick={() => setMode('percent')}
        >
          %
        </button>
      </div>
    </div>
  )
}
