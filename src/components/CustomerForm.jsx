import { useState } from 'react'
import { Card, Field, TextInput } from './ui.jsx'
import { findCustomerByPhone, supabaseEnabled } from '../lib/supabase.js'

// Form thông tin khách hàng & đơn.
export default function CustomerForm({ customer, setCustomer }) {
  const upd = (k) => (e) => setCustomer((c) => ({ ...c, [k]: e.target.value }))
  const [lookup, setLookup] = useState(null) // { type: 'loading'|'found'|'new'|'error', msg }

  // Rời ô SĐT -> tra trong DB: có thì tự điền name/email/cusid, chưa có thì báo khách mới.
  const onPhoneBlur = async () => {
    const phone = customer.phone?.trim()
    if (!phone) return setLookup(null)
    if (!supabaseEnabled) return // chưa cấu hình Supabase thì bỏ qua tra cứu

    setLookup({ type: 'loading', msg: '⏳ Đang kiểm tra số điện thoại...' })
    try {
      const found = await findCustomerByPhone(phone)
      if (found) {
        setCustomer((c) => ({
          ...c,
          name: found.name || '',
          email: found.email || '',
          cusid: found.customer_code || '',
        }))
        setLookup({ type: 'found', msg: `✅ Đã có khách: ${found.name} — tự điền thông tin.` })
      } else {
        setLookup({ type: 'new', msg: '🆕 Khách mới — sẽ tạo khi gửi đơn.' })
      }
    } catch (e) {
      setLookup({ type: 'error', msg: '⚠️ ' + e.message })
    }
  }

  const lookupColor =
    lookup?.type === 'found'
      ? 'text-ok'
      : lookup?.type === 'error'
        ? 'text-err'
        : 'text-muted'

  return (
    <Card>
      <h2 className="mb-3 text-[15px] text-accent2">👤 Thông tin khách hàng &amp; đơn</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Số điện thoại" required>
          <TextInput
            value={customer.phone}
            onChange={upd('phone')}
            onBlur={onPhoneBlur}
            placeholder="0901234567"
          />
          {lookup && <div className={`mt-1 text-[11px] ${lookupColor}`}>{lookup.msg}</div>}
        </Field>
        <Field label="Tên khách hàng" required>
          <TextInput value={customer.name} onChange={upd('name')} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Mã khách hàng">
          <TextInput value={customer.cusid} onChange={upd('cusid')} placeholder="KH001" />
        </Field>
        <Field label="Email khách hàng">
          <TextInput value={customer.email} onChange={upd('email')} placeholder="a@example.com" />
        </Field>
        <Field label="Mã đơn" required>
          <TextInput value={customer.orderId} onChange={upd('orderId')} placeholder="DH-0001" />
        </Field>
        <Field label="Trạng thái đơn">
          <TextInput
            value={customer.orderStatus}
            onChange={upd('orderStatus')}
            placeholder="Mới / Đã giao..."
          />
        </Field>
      </div>
    </Card>
  )
}
