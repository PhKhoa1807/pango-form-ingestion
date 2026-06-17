import ConfigCard from '../components/ConfigCard.jsx'

// Phần "Thiết lập": cấu hình kết nối Pango.
export default function Settings({ cfg, setCfg, onSave }) {
  return (
    <div className="grid gap-[18px]">
      <div>
        <h1 className="mb-1 text-xl font-bold">⚙️ Thiết lập</h1>
        <p className="m-0 text-[13px] text-muted">Cấu hình kết nối Pango</p>
      </div>
      <ConfigCard cfg={cfg} setCfg={setCfg} onSave={onSave} flat />
    </div>
  )
}
