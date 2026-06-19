// ============================================================
//  Logic gọi Pango Data Ingestion (port từ index.html cũ).
//  Request đi qua proxy tích hợp của Vite (xem vite.config.js)
//  nên dùng đường dẫn tương đối, KHÔNG dính CORS.
// ============================================================

// Giá trị kỹ thuật cố định (không hiển thị trong UI)
const TOKEN_HEADER = 'AccessToken' // Pango v2.0: AccessToken: Bearer <token>
const OBJECT_TYPE = 'custom-model'

// Mã hệ thống các field list bên Pango (KHÔNG phải tên hiển thị).
const FIELD_PRODUCT_NAME_LIST = 'customFieldList01' // productNameList
const FIELD_PRODUCT_ID_LIST = 'customFieldList02' // productIdList

// Đường dẫn qua proxy Vite -> Pango
const AUTH_PATH = '/api-auth/api/v1.0/auth-app' // + /{orgId}/authen
const INGEST_PATH = '/api-ingest/dhub-i/api/v2.0/ingest'

export const lineTotal = (p) => (Number(p.price) || 0) * (Number(p.qty) || 0)
export const money = (n) => (Number(n) || 0).toLocaleString('vi-VN')

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

// Quy đổi giảm giá -> số tiền giảm (đồng), không vượt quá tổng tiền hàng.
export function discountAmount(discount, grand) {
  const v = Number(discount?.value) || 0
  if (discount?.mode === 'percent') return Math.round((grand * clamp(v, 0, 100)) / 100)
  return clamp(v, 0, grand)
}

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

// ---- Build payload: 1 đơn = 1 record (tên/mã SP gom thành list) ----
export function buildPayload(cfg, customer, products, discount = {}) {
  const now = Date.now()
  const orderId = customer.orderId.trim()
  const orderTs = now // ngày giờ đặt đơn = thời điểm bấm đẩy lên Pango

  // Tổng đơn = tổng tiền hàng - giảm giá (số khách cần trả).
  const grand = products.reduce((s, p) => s + lineTotal(p), 0)
  const orderTotal = grand - discountAmount(discount, grand)

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
  addT('customField11', customer.district) // quận/huyện
  addT('customField12', customer.ward) // phường/xã
  addT('customField13', customer.province) // tỉnh/thành phố

  // Danh sách tất cả SP trong đơn -> field list multi-value.
  const productNameList = products.map((p) => p.pname?.trim()).filter(Boolean)
  const productIdList = products.map((p) => p.pid?.trim()).filter(Boolean)
  const listTexts = {}
  if (productNameList.length) listTexts[FIELD_PRODUCT_NAME_LIST] = productNameList
  if (productIdList.length) listTexts[FIELD_PRODUCT_ID_LIST] = productIdList

  // 1 record cho cả đơn. refId = mã đơn -> trùng mã đơn thì ghi đè, không tạo bản trùng.
  const entry = {
    momCode: cfg.momCode.trim(),
    refId: orderId,
    customFieldTexts: { ...baseTexts, customField09: String(orderTotal) }, // cf09 = tổng đơn
    customFieldTimestamps: { customFieldTimestamp01: orderTs },
    ...(Object.keys(listTexts).length && { customFieldListTexts: listTexts }),
    createdAt: now,
    updatedAt: now,
    recordStatus: 'Active',
  }

  return { objectType: OBJECT_TYPE, source: cfg.source.trim(), entries: [entry] }
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
