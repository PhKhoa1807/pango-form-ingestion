import { Card, Field, TextInput } from './ui.jsx'

// Form thông tin khách hàng & đơn.
export default function CustomerForm({ customer, setCustomer }) {
  const upd = (k) => (e) => setCustomer((c) => ({ ...c, [k]: e.target.value }))

  return (
    <Card>
      <h2 className="mb-3 text-[15px] text-accent2">👤 Thông tin khách hàng &amp; đơn</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên khách hàng (customerName)" required>
          <TextInput value={customer.name} onChange={upd('name')} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Mã khách hàng (customerId)">
          <TextInput value={customer.cusid} onChange={upd('cusid')} placeholder="KH001" />
        </Field>
        <Field label="Email khách hàng (customerEmail)">
          <TextInput value={customer.email} onChange={upd('email')} placeholder="a@example.com" />
        </Field>
        <Field label="Số điện thoại (customerPhone)">
          <TextInput value={customer.phone} onChange={upd('phone')} placeholder="0901234567" />
        </Field>
        <Field label="Mã đơn (orderId)" required hint="Dùng làm gốc refId (mỗi SP: orderId-mãSP)">
          <TextInput value={customer.orderId} onChange={upd('orderId')} placeholder="DH-0001" />
        </Field>
        <Field label="Trạng thái đơn (orderStatus)">
          <TextInput
            value={customer.orderStatus}
            onChange={upd('orderStatus')}
            placeholder="Mới / Đã giao..."
          />
        </Field>
        <Field label="Ngày đặt đơn (orderDate)" hint="Để trống = thời điểm hiện tại">
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
