import { useState } from 'react'
import { CFG_KEYS, DEFAULT_CFG, CFG_STORAGE_KEY, EMPTY_CUSTOMER } from './config.js'
import { buildPayload, pushToPango } from './lib/pango.js'
import { saveOrderToSupabase, supabaseEnabled } from './lib/supabase.js'
import ConfigCard from './components/ConfigCard.jsx'
import CustomerForm from './components/CustomerForm.jsx'
import ProductsTable from './components/ProductsTable.jsx'
import { PreviewCard, ResponseCard } from './components/ResultPanel.jsx'
import { Card, Button } from './components/ui.jsx'

function loadCfg() {
  try {
    const saved = JSON.parse(localStorage.getItem(CFG_STORAGE_KEY) || '{}')
    const merged = { ...DEFAULT_CFG }
    CFG_KEYS.forEach((k) => {
      if (saved[k] != null) merged[k] = saved[k]
    })
    return merged
  } catch {
    return { ...DEFAULT_CFG }
  }
}

export default function App() {
  const [cfg, setCfg] = useState(loadCfg)
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [products, setProducts] = useState([])
  const [payload, setPayload] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const saveCfg = () => {
    const obj = {}
    CFG_KEYS.forEach((k) => (obj[k] = cfg[k]))
    localStorage.setItem(CFG_STORAGE_KEY, JSON.stringify(obj))
  }

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
    <div className="p-6">
      <div className="mx-auto grid max-w-[920px] gap-[18px]">
        <div>
          <h1 className="mb-1 text-xl font-bold">📥 Nhập đơn → Pango Data Ingestion</h1>
          <p className="m-0 text-[13px] text-muted">
            Form nhập tay → gọi API Pango ingest vào Model{' '}
            <code className="rounded bg-card2 px-[6px] py-px text-xs">{cfg.momCode}</code>
          </p>
        </div>

        <ConfigCard cfg={cfg} setCfg={setCfg} onSave={saveCfg} />
        <CustomerForm customer={customer} setCustomer={setCustomer} />
        <ProductsTable products={products} setProducts={setProducts} />

        <Card className="!p-0 !border-0 !bg-transparent">
          <div className="flex flex-wrap items-center gap-[10px]">
            <Button onClick={handleExecute} disabled={busy}>
              {busy ? 'Đang push...' : '🚀 Gửi lên Pango'}
            </Button>
            <Button variant="ghost" onClick={handlePreview}>
              👁 Xem trước Payload
            </Button>
            <Button variant="ghost" onClick={handleClear}>
              Xóa hết
            </Button>
          </div>
        </Card>

        <PreviewCard payload={payload} />
        <ResponseCard result={result} />
      </div>
    </div>
  )
}
