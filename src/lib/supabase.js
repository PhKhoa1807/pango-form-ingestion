// ============================================================
//  Kết nối Supabase + lưu đơn vào DB customer_data_db.
//  Schema tương ứng: supabase/schema.sql
//
//  Cấu hình qua biến môi trường (file .env, xem .env.example):
//    VITE_SUPABASE_URL       = https://xxxx.supabase.co
//    VITE_SUPABASE_ANON_KEY  = eyJhbGci...
// ============================================================
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Chỉ tạo client khi đã cấu hình -> app vẫn chạy push Pango được dù chưa set env.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const supabaseEnabled = Boolean(supabase)

// ---- Tra cứu khách hàng theo số điện thoại ----
// Trả về bản ghi khách { id, name, email, customer_code, phone } nếu có, ngược lại null.
export async function findCustomerByPhone(phone) {
  if (!supabase) return null
  const p = phone?.trim()
  if (!p) return null
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, customer_code, phone, address, province, district, ward')
    .eq('phone', p)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error('Tra cứu khách hàng lỗi: ' + error.message)
  return data || null
}

// ---- Sinh mã kế tiếp dạng PREFIX + số (vd KH001, DH001) ----
// Quét các mã hiện có khớp prefix, lấy số lớn nhất rồi +1. DB rỗng -> số 1.
async function nextCode(table, column, prefix, pad = 3) {
  const first = `${prefix}${String(1).padStart(pad, '0')}`
  if (!supabase) return first // chưa cấu hình Supabase -> trả mã mặc định
  const { data, error } = await supabase.from(table).select(column).ilike(column, `${prefix}%`)
  if (error) throw new Error(`Sinh mã ${prefix} lỗi: ` + error.message)
  const re = new RegExp(`^${prefix}(\\d+)$`, 'i')
  let max = 0
  for (const row of data || []) {
    const m = String(row[column] ?? '').match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}${String(max + 1).padStart(pad, '0')}`
}

// Mã khách hàng kế tiếp (KH001, KH002, ...)
export const nextCustomerCode = () => nextCode('customers', 'customer_code', 'KH')
// Mã đơn hàng kế tiếp (DH001, DH002, ...)
export const nextOrderCode = () => nextCode('orders', 'order_code', 'DH')

// ---- Lưu 1 đơn (khách + đơn + sản phẩm) vào Supabase ----
// Trả về { order_id } khi thành công, ném lỗi khi thất bại.
export async function saveOrderToSupabase(customer, products) {
  if (!supabase) throw new Error('Chưa cấu hình Supabase (thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')

  // 1) Khách hàng: nhận diện theo số điện thoại để không tạo trùng.
  //    Chỉ ghi các trường có giá trị -> tránh xóa trắng dữ liệu cũ khi để trống.
  const phone = customer.phone?.trim() || null
  const cusRow = { name: customer.name.trim(), phone }
  const email = customer.email?.trim()
  const cusCode = customer.cusid?.trim()
  const address = customer.address?.trim()
  const province = customer.province?.trim()
  const district = customer.district?.trim()
  const ward = customer.ward?.trim()
  if (email) cusRow.email = email
  if (cusCode) cusRow.customer_code = cusCode
  if (address) cusRow.address = address
  if (province) cusRow.province = province
  if (district) cusRow.district = district
  if (ward) cusRow.ward = ward

  let customerId
  const existing = phone ? await findCustomerByPhone(phone) : null
  if (existing) {
    // Đã có khách với SĐT này -> cập nhật thông tin mới nhất, dùng lại id.
    const { error } = await supabase.from('customers').update(cusRow).eq('id', existing.id)
    if (error) throw new Error('Cập nhật khách hàng lỗi: ' + error.message)
    customerId = existing.id
  } else {
    const { data, error } = await supabase
      .from('customers')
      .insert(cusRow)
      .select('id')
      .single()
    if (error) throw new Error('Lưu khách hàng lỗi: ' + error.message)
    customerId = data.id
  }

  // 2) Đơn hàng: upsert theo order_code (gửi lại cùng mã đơn sẽ ghi đè, không nhân bản).
  const orderRow = {
    customer_id: customerId,
    order_code: customer.orderId.trim(),
    status: customer.orderStatus?.trim() || null,
    order_date: new Date().toISOString(), // tự lấy giờ hiện tại lúc lưu/đẩy
  }
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .upsert(orderRow, { onConflict: 'order_code' })
    .select('id')
    .single()
  if (orderErr) throw new Error('Lưu đơn lỗi: ' + orderErr.message)

  // 3) Sản phẩm: xóa item cũ của đơn (nếu gửi lại) rồi insert lại danh sách mới.
  const { error: delErr } = await supabase.from('order_items').delete().eq('order_id', order.id)
  if (delErr) throw new Error('Dọn sản phẩm cũ lỗi: ' + delErr.message)

  const items = products.map((p) => ({
    order_id: order.id,
    product_code: p.pid?.trim() || null,
    product_name: p.pname?.trim() || null,
    price: Number(p.price) || 0,
    qty: Number(p.qty) || 0,
    // line_total do DB tự tính (generated column) — không gửi
  }))
  if (items.length) {
    const { error: itemErr } = await supabase.from('order_items').insert(items)
    if (itemErr) throw new Error('Lưu sản phẩm lỗi: ' + itemErr.message)
  }

  return { order_id: order.id }
}
