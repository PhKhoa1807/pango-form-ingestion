import { Card, Field, TextInput } from './ui.jsx'

// Form thông tin khách hàng & đơn.
export default function CustomerForm({ customer, setCustomer }) {
  const upd = (k) => (e) => setCustomer((c) => ({ ...c, [k]: e.target.value }))

  return (
    <Card>
      <h2 className="mb-3 text-[15px] text-accent2">👤 Thông tin khách hàng &amp; đơn</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên khách hàng" required>
          <TextInput value={customer.name} onChange={upd('name')} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Mã khách hàng">
          <TextInput value={customer.cusid} onChange={upd('cusid')} placeholder="KH001" />
        </Field>
        <Field label="Email khách hàng">
          <TextInput value={customer.email} onChange={upd('email')} placeholder="a@example.com" />
        </Field>
        <Field label="Số điện thoại">
          <TextInput value={customer.phone} onChange={upd('phone')} placeholder="0901234567" />
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
        <Field label="Ngày đặt đơn">
          <TextInput
            type="datetime-local"
            value={customer.orderDate}
            onChange={upd('orderDate')}
          />
        </Field>
      </div>
    </Card>
  )
}
