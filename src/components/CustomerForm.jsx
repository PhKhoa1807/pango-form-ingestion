import { useEffect, useState } from 'react'
import { Card, Field, TextInput } from './ui.jsx'
import { Combobox } from './Combobox.jsx'
import {
  findCustomerByPhone,
  nextCustomerCode,
  nextOrderCode,
  supabaseEnabled,
} from '../lib/supabase.js'
import { getProvinces, getDistricts, getWards } from '../lib/provinces.js'

// Form thông tin khách hàng & đơn.
export default function CustomerForm({ customer, setCustomer, invalid = [] }) {
  const isInvalid = (k) => invalid.includes(k)
  const upd = (k) => (e) => setCustomer((c) => ({ ...c, [k]: e.target.value }))
  const [lookup, setLookup] = useState(null) // { type: 'loading'|'found'|'new'|'error', msg }

  // ---- Địa chỉ 3 cấp (Province Open API) ----
  // Mã chọn (chỉ dùng để cascade, không lưu DB) tách khỏi tên (lưu vào customer).
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [geo, setGeo] = useState({ provinceCode: '', districtCode: '', wardCode: '' })
  const [geoErr, setGeoErr] = useState('')

  // Tải danh sách Tỉnh/Thành 1 lần khi mở form.
  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch((e) => setGeoErr(e.message))
  }, [])

  // Mở form / sau khi reset (orderId rỗng) -> luôn sinh 1 Mã đơn MỚI,
  // độc lập với SĐT (không phụ thuộc khách cũ hay mới).
  useEffect(() => {
    if (!supabaseEnabled || customer.orderId) return
    let alive = true
    nextOrderCode()
      .then((code) => {
        if (alive) setCustomer((c) => (c.orderId ? c : { ...c, orderId: code }))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [customer.orderId, setCustomer])

  // Form bị reset từ ngoài (gửi xong / xóa form) -> dọn dropdown địa chỉ.
  useEffect(() => {
    if (!customer.province && !customer.district && !customer.ward) {
      setGeo({ provinceCode: '', districtCode: '', wardCode: '' })
      setDistricts([])
      setWards([])
    }
  }, [customer.province, customer.district, customer.ward])

  const onProvinceChange = async (code, name) => {
    setGeo({ provinceCode: code, districtCode: '', wardCode: '' })
    setDistricts([])
    setWards([])
    setCustomer((c) => ({ ...c, province: name, district: '', ward: '' }))
    if (code) {
      try {
        setDistricts(await getDistricts(code))
      } catch (err) {
        setGeoErr(err.message)
      }
    }
  }

  const onDistrictChange = async (code, name) => {
    setGeo((g) => ({ ...g, districtCode: code, wardCode: '' }))
    setWards([])
    setCustomer((c) => ({ ...c, district: name, ward: '' }))
    if (code) {
      try {
        setWards(await getWards(code))
      } catch (err) {
        setGeoErr(err.message)
      }
    }
  }

  const onWardChange = (code, name) => {
    setGeo((g) => ({ ...g, wardCode: code }))
    setCustomer((c) => ({ ...c, ward: name }))
  }

  // Khách cũ có sẵn tên Tỉnh/Huyện/Xã -> dò ngược ra mã để chọn lại trên dropdown.
  const reselectGeo = async (provinceName, districtName, wardName) => {
    try {
      if (!provinceName) {
        setGeo({ provinceCode: '', districtCode: '', wardCode: '' })
        setDistricts([])
        setWards([])
        return
      }
      const ps = await getProvinces()
      const p = ps.find((x) => x.name === provinceName)
      if (!p) return
      const ds = await getDistricts(p.code)
      setDistricts(ds)
      const d = ds.find((x) => x.name === districtName)
      const ws = d ? await getWards(d.code) : []
      setWards(ws)
      const w = ws.find((x) => x.name === wardName)
      setGeo({
        provinceCode: String(p.code),
        districtCode: d ? String(d.code) : '',
        wardCode: w ? String(w.code) : '',
      })
    } catch (err) {
      setGeoErr(err.message)
    }
  }

  // Rời ô SĐT -> tra trong DB (chỉ autofill thông tin khách + Mã KH).
  //  Mã đơn KHÔNG sinh ở đây — đã sinh sẵn khi mở form (luôn mới, độc lập SĐT).
  //  - Khách cũ: tự điền thông tin + dùng lại Mã KH.
  //  - Khách mới: sinh Mã KH mới (lấy mã cuối + 1).
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
          address: found.address || '',
          province: found.province || '',
          district: found.district || '',
          ward: found.ward || '',
        }))
        reselectGeo(found.province, found.district, found.ward) // chọn lại dropdown địa chỉ
        setLookup({ type: 'found', msg: `✅ Đã có khách: ${found.name} — tự điền thông tin.` })
      } else {
        const cusid = await nextCustomerCode() // khách mới -> mã KH kế tiếp
        // Khách mới: xóa trắng thông tin của khách cũ (nếu trước đó đã autofill),
        // chỉ giữ SĐT vừa nhập + mã KH tự sinh (giữ nguyên Mã đơn đã sinh sẵn).
        setCustomer((c) => ({
          ...c,
          name: '',
          email: '',
          address: '',
          province: '',
          district: '',
          ward: '',
          cusid,
        }))
        setGeo({ provinceCode: '', districtCode: '', wardCode: '' })
        setDistricts([])
        setWards([])
        setLookup({ type: 'new', msg: `🆕 Khách mới — cấp mã ${cusid}.` })
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
      <h2 className="mb-3 text-[15px] text-accent2 font-bold">👤 Thông tin khách hàng &amp; đơn</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Số điện thoại" required error={isInvalid('phone')}>
          <TextInput
            size="sm"
            value={customer.phone}
            onChange={upd('phone')}
            onBlur={onPhoneBlur}
            placeholder="0901234567"
          />
          {lookup && <div className={`mt-1 text-[11px] ${lookupColor}`}>{lookup.msg}</div>}
        </Field>
        <Field label="Tên khách hàng" required error={isInvalid('name')}>
          <TextInput size="sm" value={customer.name} onChange={upd('name')} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Mã khách hàng">
          <TextInput size="sm" value={customer.cusid} onChange={upd('cusid')} placeholder="KH001" readOnly />
        </Field>
        <Field label="Email khách hàng">
          <TextInput size="sm" value={customer.email} onChange={upd('email')} placeholder="a@example.com" />
        </Field>
        <Field label="Mã đơn hàng">
          <TextInput size="sm" value={customer.orderId} onChange={upd('orderId')} placeholder="DH-0001" readOnly />
        </Field>
        <Field label="Địa chỉ" required error={isInvalid('address')}>
          <TextInput
            size="sm"
            value={customer.address}
            onChange={upd('address')}
            placeholder="Số nhà, tòa nhà, ngõ, đường"
          />
        </Field>
        <Field label="Tỉnh / Thành phố" required error={isInvalid('province')}>
          <Combobox
            size="sm"
            value={geo.provinceCode}
            onChange={onProvinceChange}
            options={provinces}
            placeholder="Gõ hoặc chọn Tỉnh/Thành"
          />
        </Field>
        <Field label="Quận / Huyện" required error={isInvalid('district')}>
          <Combobox
            size="sm"
            value={geo.districtCode}
            onChange={onDistrictChange}
            options={districts}
            disabled={!geo.provinceCode}
            placeholder="Gõ hoặc chọn Quận/Huyện"
          />
        </Field>
        <Field label="Phường / Xã" required error={isInvalid('ward')}>
          <Combobox
            size="sm"
            value={geo.wardCode}
            onChange={onWardChange}
            options={wards}
            disabled={!geo.districtCode}
            placeholder="Gõ hoặc chọn Phường/Xã"
          />
        </Field>
      </div>
      {geoErr && <div className="mt-2 text-[11px] text-err">⚠️ Lỗi tải địa giới: {geoErr}</div>}
    </Card>
  )
}
