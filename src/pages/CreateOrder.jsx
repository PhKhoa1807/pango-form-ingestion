import { useEffect, useState } from 'react'
import { EMPTY_CUSTOMER, EMPTY_DISCOUNT } from '../config.js'
import { buildPayload, pushToPango } from '../lib/pango.js'
import { saveOrderToSupabase, supabaseEnabled } from '../lib/supabase.js'
import CustomerForm from '../components/CustomerForm.jsx'
import ProductsTable from '../components/ProductsTable.jsx'
import { PreviewCard, ResponseCard } from '../components/ResultPanel.jsx'
import { Card, Button } from '../components/ui.jsx'

// Các trường bắt buộc nhập (key trong customer + nhãn hiển thị).
const REQUIRED_FIELDS = [
  ['phone', 'Số điện thoại'],
  ['name', 'Tên khách hàng'],
  ['address', 'Địa chỉ'],
  ['province', 'Tỉnh/Thành phố'],
  ['district', 'Quận/Huyện'],
  ['ward', 'Phường/Xã'],
]
const getMissing = (c) => REQUIRED_FIELDS.filter(([k]) => !String(c[k] ?? '').trim()).map(([k]) => k)

// Phần "Tạo đơn hàng": nhập tay → đẩy lên Pango (+ lưu Supabase).
export default function CreateOrder({ cfg }) {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [products, setProducts] = useState([])
  const [discount, setDiscount] = useState(EMPTY_DISCOUNT)
  const [payload, setPayload] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [invalid, setInvalid] = useState([]) // key các trường thiếu (bôi đỏ)
  const [triedSubmit, setTriedSubmit] = useState(false)

  // Sau lần bấm Gửi đầu tiên, tự cập nhật lại danh sách lỗi khi người dùng nhập.
  useEffect(() => {
    if (triedSubmit) setInvalid(getMissing(customer))
  }, [customer, triedSubmit])

  const handlePreview = () => {
    setPayload(buildPayload(cfg, customer, products, discount))
  }

  const handleExecute = async () => {
    const missing = getMissing(customer)
    if (missing.length) {
      setInvalid(missing)
      setTriedSubmit(true)
      return // chưa đủ trường bắt buộc -> không gửi
    }
    setInvalid([])
    if (!products.length) return alert('Đơn phải có ít nhất 1 sản phẩm.')

    const p = buildPayload(cfg, customer, products, discount)
    setPayload(p)
    setBusy(true)
    setResult({ statusMsg: '⏳ Đang lấy token & gửi dữ liệu...' })

    try {
      // Lưu vào Supabase (sổ lưu trữ nội bộ) — không chặn việc push Pango nếu lỗi.
      let dbMsg = ''
      if (supabaseEnabled) {
        try {
          setResult({ statusMsg: '⏳ Đang lưu vào Supabase...' })
          await saveOrderToSupabase(customer, products, discount)
          dbMsg = '✅ Đã lưu Supabase. '
        } catch (dbErr) {
          dbMsg = '⚠️ Lưu Supabase lỗi: ' + dbErr.message + '. '
        }
      }

      setResult({ statusMsg: dbMsg + '⏳ Đang push lên Pango...' })
      const r = await pushToPango(cfg, p)
      setResult({ ...r, statusMsg: dbMsg })
      // Gửi thành công -> xóa hết data đã nhập (giữ lại Response để xem kết quả)
      if (r.ok) {
        setCustomer(EMPTY_CUSTOMER)
        setProducts([])
        setDiscount(EMPTY_DISCOUNT)
        setPayload(null)
        setInvalid([])
        setTriedSubmit(false)
      }
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setBusy(false)
    }
  }

  const handleClear = () => {
    setCustomer(EMPTY_CUSTOMER)
    setProducts([])
    setPayload(null)
    setInvalid([])
    setTriedSubmit(false)
  }

  return (
    <div className="grid gap-[18px]">
      <div>
        <h1 className="mb-1 text-xl font-bold">🧾 Tạo đơn hàng</h1>
        {/* <p className="m-0 text-[13px] text-muted">
          Form nhập tay → gọi API Pango ingest vào Model{' '}
          <code className="rounded bg-card2 px-[6px] py-px text-xs">{cfg.momCode}</code>
        </p> */}
      </div>

      <CustomerForm customer={customer} setCustomer={setCustomer} invalid={invalid} />
      <ProductsTable
        products={products}
        setProducts={setProducts}
        discount={discount}
        setDiscount={setDiscount}
      />

      <Card className="!p-0 !border-0 !bg-transparent !shadow-none">
        <div className="flex flex-wrap items-center gap-[10px]">
          <Button variant="lime" onClick={handleExecute} disabled={busy}>
            {busy ? 'Đang push...' : 'Gửi lên Pango'}
          </Button>
          <Button variant="ghost" onClick={handlePreview}>
            👁 Xem trước Payload
          </Button>
          <Button className="shadow-sm" variant="ghost" onClick={handleClear}>
            Xóa form
          </Button>
        </div>
        {invalid.length > 0 && (
          <div className="mt-2 text-[13px] font-semibold text-err">⚠️ Các trường bắt buộc nhập</div>
        )}
      </Card>

      <PreviewCard payload={payload} />
      <ResponseCard result={result} />
    </div>
  )
}
