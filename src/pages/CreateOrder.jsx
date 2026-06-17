import { useState } from 'react'
import { EMPTY_CUSTOMER } from '../config.js'
import { buildPayload, pushToPango } from '../lib/pango.js'
import { saveOrderToSupabase, supabaseEnabled } from '../lib/supabase.js'
import CustomerForm from '../components/CustomerForm.jsx'
import ProductsTable from '../components/ProductsTable.jsx'
import { PreviewCard, ResponseCard } from '../components/ResultPanel.jsx'
import { Card, Button } from '../components/ui.jsx'

// Phần "Tạo đơn hàng": nhập tay → đẩy lên Pango (+ lưu Supabase).
export default function CreateOrder({ cfg }) {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [products, setProducts] = useState([])
  const [payload, setPayload] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const handlePreview = () => {
    setPayload(buildPayload(cfg, customer, products))
  }

  const handleExecute = async () => {
    if (!customer.name.trim()) return alert('Tên khách hàng là bắt buộc.')
    if (!customer.orderId.trim())
      return alert('Mã đơn (orderId) là bắt buộc — dùng làm gốc refId.')
    if (!products.length) return alert('Đơn phải có ít nhất 1 sản phẩm.')

    const p = buildPayload(cfg, customer, products)
    setPayload(p)
    setBusy(true)
    setResult({ statusMsg: '⏳ Đang lấy token & gửi dữ liệu...' })

    try {
      // Lưu vào Supabase (sổ lưu trữ nội bộ) — không chặn việc push Pango nếu lỗi.
      let dbMsg = ''
      if (supabaseEnabled) {
        try {
          setResult({ statusMsg: '⏳ Đang lưu vào Supabase...' })
          await saveOrderToSupabase(customer, products)
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
        setPayload(null)
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

      <CustomerForm customer={customer} setCustomer={setCustomer} />
      <ProductsTable products={products} setProducts={setProducts} />

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
      </Card>

      <PreviewCard payload={payload} />
      <ResponseCard result={result} />
    </div>
  )
}
