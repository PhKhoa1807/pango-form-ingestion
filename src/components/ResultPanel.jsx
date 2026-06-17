import { Card } from './ui.jsx'

// Hiển thị preview payload và kết quả response.
export function PreviewCard({ payload }) {
  if (!payload) return null
  return (
    <Card>
      <h2 className="mb-3 text-[15px] font-bold text-accent2">📦 Request Payload</h2>
      <pre className="m-0 max-h-[360px] overflow-auto rounded-lg border border-line bg-card2 p-3 font-mono text-xs">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </Card>
  )
}

export function ResponseCard({ result }) {
  if (!result) return null
  const { ok, status, json, error, statusMsg } = result
  // Đã có kết quả Pango khi có json/error; lúc đó statusMsg chỉ là dòng phụ (vd: trạng thái lưu Supabase).
  const hasResult = error != null || json != null
  const body =
    error != null
      ? error
      : typeof json === 'string'
        ? json
        : json != null
          ? JSON.stringify(json, null, 2)
          : null

  return (
    <Card>
      <h2 className="mb-3 text-[15px] font-bold text-accent2">📨 Response Result</h2>
      {statusMsg && <div className="mb-1 text-[13px] text-muted">{statusMsg}</div>}
      <div className="mb-2 text-[13px] font-semibold">
        {!hasResult ? (
          statusMsg ? null : <span className="text-muted">⏳ Đang xử lý...</span>
        ) : error != null ? (
          <span className="text-err">❌ Lỗi</span>
        ) : ok ? (
          <span className="text-ok">
            ✅ THÀNH CÔNG — {json?.message || 'success: true'}
          </span>
        ) : (
          <span className="text-err">
            ❌ THẤT BẠI — HTTP {status} /{' '}
            {json?.message || json?.errorMessage || `success: ${json?.success}`}
          </span>
        )}
      </div>
      {body != null && (
        <pre
          className={`m-0 max-h-[360px] overflow-auto rounded-lg border bg-card2 p-3 font-mono text-xs ${
            error != null || ok === false ? 'border-err' : ok ? 'border-ok' : 'border-line'
          }`}
        >
          {body}
        </pre>
      )}
      {error != null && (
        <div className="mt-1 text-[11px] text-muted">
          Nếu là lỗi "Failed to fetch": kiểm tra proxy Vite (vite.config.js) và kết nối mạng tới
          domain Pango.
        </div>
      )}
    </Card>
  )
}
