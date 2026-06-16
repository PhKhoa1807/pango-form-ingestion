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

// ---- Lưu 1 đơn (khách + đơn + sản phẩm) vào Supabase ----
// Trả về { order_id } khi thành công, ném lỗi khi thất bại.
export async function saveOrderToSupabase(customer, products) {
  if (!supabase) throw new Error('Chưa cấu hình Supabase (thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')

  // 1) Khách hàng: có mã KH thì upsert theo customer_code, không thì insert mới.
  const cusCode = customer.cusid?.trim() || null
  const cusRow = {
    name: customer.name.trim(),
    customer_code: cusCode,
    email: customer.email?.trim() || null,
    phone: customer.phone?.trim() || null,
  }

  let customerId
  if (cusCode) {
    const { data, error } = await supabase
      .from('customers')
      .upsert(cusRow, { onConflict: 'customer_code' })
      .select('id')
      .single()
    if (error) throw new Error('Lưu khách hàng lỗi: ' + error.message)
    customerId = data.id
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
    order_date: customer.orderDate ? new Date(customer.orderDate).toISOString() : new Date().toISOString(),
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
