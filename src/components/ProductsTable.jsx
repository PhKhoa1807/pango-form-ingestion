import { useState } from 'react'
import { Card, Field, TextInput, Button } from './ui.jsx'
import { money, lineTotal } from '../lib/pango.js'

const EMPTY_ROW = { pid: '', pname: '', price: '', qty: '1' }

// Bảng sản phẩm trong đơn + hàng nhập sản phẩm mới.
export default function ProductsTable({ products, setProducts }) {
  const [row, setRow] = useState(EMPTY_ROW)
  const upd = (k) => (e) => setRow((r) => ({ ...r, [k]: e.target.value }))

  const addProduct = () => {
    const pid = row.pid.trim()
    const pname = row.pname.trim()
    const price = parseInt(row.price, 10)
    const qty = parseInt(row.qty, 10)
    if (!pname && !pid) return alert('Nhập ít nhất Mã SP hoặc Tên sản phẩm.')
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
        className="mt-[14px] grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1.6fr_1fr_0.8fr_auto]"
        onKeyDown={onAddKeyDown}
      >
        <Field label="Mã SP">
          <TextInput value={row.pid} onChange={upd('pid')} placeholder="SP-001" />
        </Field>
        <Field label="Tên sản phẩm">
          <TextInput value={row.pname} onChange={upd('pname')} placeholder="Sản phẩm A" />
        </Field>
        <Field label="Đơn giá">
          <TextInput type="number" value={row.price} onChange={upd('price')} placeholder="120" />
        </Field>
        <Field label="Số lượng">
          <TextInput type="number" value={row.qty} onChange={upd('qty')} placeholder="1" />
        </Field>
        <Button variant="lime" onClick={addProduct}>
          + Thêm
        </Button>
      </div>

      <div className="mt-[14px] flex items-baseline justify-end gap-3 text-[15px]">
        <span>Tổng tiền ({products.length} SP):</span>
        <b className="text-[22px] tabular-nums text-ok">{money(grand)}</b>
      </div>
    </Card>
  )
}
