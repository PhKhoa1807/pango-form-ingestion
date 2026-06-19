// ============================================================
//  Danh mục hành chính VN (2 cấp, từ 01/07/2025) — Province Open API v2.
//  Nguồn miễn phí, không cần key, hỗ trợ CORS (gọi trực tiếp từ browser).
//    GET /api/v2/p/              -> danh sách Tỉnh/Thành (34 đơn vị)
//    GET /api/v2/p/{code}?depth=2 -> 1 Tỉnh kèm mảng wards (Phường/Xã) — đã bỏ cấp Quận/Huyện
//  Có cache trong RAM để không gọi lại nhiều lần.
// ============================================================
const BASE = 'https://provinces.open-api.vn/api/v2'

let _provinces = null
const _wardCache = new Map()

async function getJson(url, errMsg) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${errMsg} (HTTP ${res.status})`)
  return res.json()
}

// Danh sách Tỉnh/Thành: [{ code, name, ... }]
export async function getProvinces() {
  if (_provinces) return _provinces
  _provinces = await getJson(`${BASE}/p/`, 'Không tải được danh sách Tỉnh/Thành')
  return _provinces
}

// Phường/Xã theo mã tỉnh: [{ code, name, ... }] (2 cấp -> ward nằm trực tiếp dưới tỉnh)
export async function getWards(provinceCode) {
  if (!provinceCode) return []
  const key = String(provinceCode)
  if (_wardCache.has(key)) return _wardCache.get(key)
  const data = await getJson(`${BASE}/p/${key}?depth=2`, 'Không tải được Phường/Xã')
  const list = data.wards || []
  _wardCache.set(key, list)
  return list
}
