// ============================================================
//  Danh mục hành chính VN (3 cấp) từ Province Open API.
//  Nguồn miễn phí, không cần key, hỗ trợ CORS (gọi trực tiếp từ browser).
//    GET /api/v1/p/              -> danh sách Tỉnh/Thành
//    GET /api/v1/p/{code}?depth=2 -> 1 Tỉnh kèm mảng districts (Quận/Huyện)
//    GET /api/v1/d/{code}?depth=2 -> 1 Quận/Huyện kèm mảng wards (Phường/Xã)
//  Có cache trong RAM để không gọi lại nhiều lần.
// ============================================================
const BASE = 'https://provinces.open-api.vn/api/v1'

let _provinces = null
const _districtCache = new Map()
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

// Quận/Huyện theo mã tỉnh: [{ code, name, ... }]
export async function getDistricts(provinceCode) {
  if (!provinceCode) return []
  const key = String(provinceCode)
  if (_districtCache.has(key)) return _districtCache.get(key)
  const data = await getJson(`${BASE}/p/${key}?depth=2`, 'Không tải được Quận/Huyện')
  const list = data.districts || []
  _districtCache.set(key, list)
  return list
}

// Phường/Xã theo mã quận/huyện: [{ code, name, ... }]
export async function getWards(districtCode) {
  if (!districtCode) return []
  const key = String(districtCode)
  if (_wardCache.has(key)) return _wardCache.get(key)
  const data = await getJson(`${BASE}/d/${key}?depth=2`, 'Không tải được Phường/Xã')
  const list = data.wards || []
  _wardCache.set(key, list)
  return list
}
