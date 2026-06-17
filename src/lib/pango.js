// ============================================================
//  Logic gọi Pango Data Ingestion (port từ index.html cũ).
//  Request đi qua proxy tích hợp của Vite (xem vite.config.js)
//  nên dùng đường dẫn tương đối, KHÔNG dính CORS.
// ============================================================

// Giá trị kỹ thuật cố định (không hiển thị trong UI)
const TOKEN_HEADER = 'AccessToken' // Pango v2.0: AccessToken: Bearer <token>
const OBJECT_TYPE = 'custom-model'

// Đường dẫn qua proxy Vite -> Pango
const AUTH_PATH = '/api-auth/api/v1.0/auth-app' // + /{orgId}/authen
const INGEST_PATH = '/api-ingest/dhub-i/api/v2.0/ingest'

export const lineTotal = (p) => (Number(p.price) || 0) * (Number(p.qty) || 0)
export const money = (n) => (Number(n) || 0).toLocaleString('vi-VN')

// ---- Lấy token ngầm (đổi refreshToken -> accessToken) ----
export async function fetchToken(cfg) {
  const res = await fetch(`${AUTH_PATH}/${cfg.orgId.trim()}/authen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      refreshToken: cfg.refreshToken.trim(),
    },
    body: JSON.stringify({ appId: cfg.appId.trim(), account: cfg.account.trim() }),
  })
  const json = await res.json().catch(() => ({}))
  const tok =
    json?.data?.accessToken ||
    json?.accessToken ||
    json?.data?.token ||
    json?.token ||
    json?.data?.access_token ||
    ''
  if (!tok) throw new Error('Không lấy được token từ response auth: ' + JSON.stringify(json))
  return tok
}

// ---- Build payload: mỗi sản phẩm = 1 record ----
export function buildPayload(cfg, customer, products) {
  const now = Date.now()
  const orderId = customer.orderId.trim()
  const orderTs = now // ngày giờ đặt đơn = thời điểm bấm đẩy lên Pango

  const baseTexts = {}
  const addT = (k, v) => {
    const s = (v ?? '').trim()
    if (s !== '') baseTexts[k] = s
  }
  addT('customField01', customer.name) // customerName
  addT('customField02', customer.cusid) // customerId
  addT('customField03', customer.phone) // customerPhone
  addT('customField04', customer.orderId) // orderId
  addT('customField05', customer.orderStatus) // orderStatus
  addT('customField06', customer.email) // customerEmail
  addT('customField10', customer.address) // địa chỉ (số nhà, đường...)
  addT('customField11', customer.district) // khu vực (tỉnh/TP - quận/huyện)
  addT('customField12', customer.ward) // phường/xã

  const entries = products.map((p, i) => {
    const texts = { ...baseTexts }
    if (p.pname) texts.customField07 = p.pname // productName
    if (p.pid) texts.customField08 = p.pid // productId
    texts.customField09 = String(lineTotal(p)) // TotalCost = thành tiền dòng
    return {
      momCode: cfg.momCode.trim(),
      refId: orderId + '-' + (p.pid || i + 1), // refId duy nhất mỗi SP
      customFieldTexts: texts,
      customFieldLongs: { customFieldLong01: Number(p.price), customFieldLong02: Number(p.qty) },
      customFieldTimestamps: { customFieldTimestamp01: orderTs },
      createdAt: now,
      updatedAt: now,
      recordStatus: 'Active',
    }
  })

  return { objectType: OBJECT_TYPE, source: cfg.source.trim(), entries }
}

// ---- Push lên Pango: tự lấy token rồi ingest ----
export async function pushToPango(cfg, payload) {
  const token = await fetchToken(cfg)
  const headers = {
    'Content-Type': 'application/json',
    OrgId: cfg.orgId.trim(),
    [TOKEN_HEADER]: 'Bearer ' + token,
  }
  const res = await fetch(INGEST_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  const ok =
    (json && json.success === true) || (res.ok && json && json.success !== false)
  return { ok, status: res.status, json }
}
