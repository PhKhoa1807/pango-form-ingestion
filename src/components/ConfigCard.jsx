import { useState } from 'react'
import { Field, TextInput, Button } from './ui.jsx'

// Card cấu hình kết nối Pango (dạng <details> thu gọn được).
export default function ConfigCard({ cfg, setCfg, onSave }) {
  const [savedMsg, setSavedMsg] = useState('')

  const upd = (k) => (e) => setCfg((c) => ({ ...c, [k]: e.target.value }))

  const handleSave = () => {
    onSave()
    setSavedMsg('✓ Đã lưu lúc ' + new Date().toLocaleTimeString())
    setTimeout(() => setSavedMsg(''), 3000)
  }

  return (
    <details className="rounded-xl border border-line bg-card p-[18px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none font-semibold text-[15px] text-accent2 before:content-['▸_'] [details[open]_&]:before:content-['▾_']">
        ⚙️ Cấu hình kết nối Pango
      </summary>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="OrgId" required>
            <TextInput value={cfg.orgId} onChange={upd('orgId')} />
          </Field>
          <Field label="AppId" required>
            <TextInput value={cfg.appId} onChange={upd('appId')} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account" required>
            <TextInput value={cfg.account} onChange={upd('account')} />
          </Field>
          <Field label="MOM Code" required>
            <TextInput value={cfg.momCode} onChange={upd('momCode')} />
          </Field>
        </div>
        <Field label="Refresh Token" required>
          <TextInput value={cfg.refreshToken} onChange={upd('refreshToken')} />
        </Field>
        <Field label="Source" required>
          <TextInput value={cfg.source} onChange={upd('source')} />
        </Field>
        <div className="flex flex-wrap items-center gap-[10px]">
          <Button variant="ghost" onClick={handleSave}>
            💾 Lưu cấu hình
          </Button>
          <span className="text-[11px] text-muted">{savedMsg}</span>
        </div>
      </div>
    </details>
  )
}
