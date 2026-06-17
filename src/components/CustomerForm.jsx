import { useEffect, useState } from 'react'
import { Card, Field, TextInput, Select } from './ui.jsx'
import {
  findCustomerByPhone,
  nextCustomerCode,
  nextOrderCode,
  supabaseEnabled,
} from '../lib/supabase.js'
import { getProvinces, getDistricts, getWards } from '../lib/provinces.js'

// Form thông tin khách hàng & đơn.
export default function CustomerForm({ customer, setCustomer }) {
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

  // Form bị reset từ ngoài (gửi xong / xóa form) -> dọn dropdown địa chỉ.
  useEffect(() => {
    if (!customer.province && !customer.district && !customer.ward) {
      setGeo({ provinceCode: '', districtCode: '', wardCode: '' })
      setDistricts([])
      setWards([])
    }
  }, [customer.province, customer.district, customer.ward])

  const onProvinceChange = async (e) => {
    const code = e.target.value
    const name = provinces.find((p) => String(p.code) === code)?.name || ''
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

  const onDistrictChange = async (e) => {
    const code = e.target.value
    const name = districts.find((d) => String(d.code) === code)?.name || ''
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

  const onWardChange = (e) => {
    const code = e.target.value
    const name = wards.find((w) => String(w.code) === code)?.name || ''
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

  // Rời ô SĐT -> tra trong DB:
  //  - Khách cũ: tự điền thông tin + dùng lại Mã KH; Mã đơn luôn sinh mới (đơn mới).
  //  - Khách mới: sinh Mã KH mới (lấy mã cuối + 1); Mã đơn cũng sinh mới.
  const onPhoneBlur = async () => {
    const phone = customer.phone?.trim()
    if (!phone) return setLookup(null)
    if (!supabaseEnabled) return // chưa cấu hình Supabase thì bỏ qua tra cứu

    setLookup({ type: 'loading', msg: '⏳ Đang kiểm tra số điện thoại...' })
    try {
      const found = await findCustomerByPhone(phone)
      const orderId = await nextOrderCode() // mỗi đơn là 1 mã DH mới
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
          orderId,
        }))
        reselectGeo(found.province, found.district, found.ward) // chọn lại dropdown địa chỉ
        setLookup({ type: 'found', msg: `✅ Đã có khách: ${found.name} — tự điền thông tin.` })
      } else {
        const cusid = await nextCustomerCode() // khách mới -> mã KH kế tiếp
        // Khách mới: xóa trắng thông tin của khách cũ (nếu trước đó đã autofill),
        // chỉ giữ SĐT vừa nhập + mã KH/đơn tự sinh.
        setCustomer((c) => ({
          ...c,
          name: '',
          email: '',
          address: '',
          province: '',
          district: '',
          ward: '',
          cusid,
          orderId,
        }))
        setGeo({ provinceCode: '', districtCode: '', wardCode: '' })
        setDistricts([])
        setWards([])
        setLookup({ type: 'new', msg: `🆕 Khách mới — cấp mã ${cusid}, đơn ${orderId}.` })
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
        <Field label="Số điện thoại" required>
          <TextInput
            size="sm"
            value={customer.phone}
            onChange={upd('phone')}
            onBlur={onPhoneBlur}
            placeholder="0901234567"
          />
          {lookup && <div className={`mt-1 text-[11px] ${lookupColor}`}>{lookup.msg}</div>}
        </Field>
        <Field label="Tên khách hàng" required>
          <TextInput size="sm" value={customer.name} onChange={upd('name')} placeholder="Nguyễn Văn A" />
        </Field>
        <Field label="Mã khách hàng">
          <TextInput size="sm" value={customer.cusid} onChange={upd('cusid')} placeholder="KH001" readOnly />
        </Field>
        <Field label="Email khách hàng">
          <TextInput size="sm" value={customer.email} onChange={upd('email')} placeholder="a@example.com" />
        </Field>
        <Field label="Mã đơn hàng" required>
          <TextInput size="sm" value={customer.orderId} onChange={upd('orderId')} placeholder="DH-0001" readOnly />
        </Field>
        <Field label="Địa chỉ" required>
          <TextInput
            size="sm"
            value={customer.address}
            onChange={upd('address')}
            placeholder="Số nhà, tòa nhà, ngõ, đường"
          />
        </Field>
        <Field label="Tỉnh / Thành phố" required>
          <Select size="sm" value={geo.provinceCode} onChange={onProvinceChange}>
            <option value="">-- Chọn Tỉnh/Thành --</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quận / Huyện" required>
          <Select
            size="sm"
            value={geo.districtCode}
            onChange={onDistrictChange}
            disabled={!geo.provinceCode}
          >
            <option value="">-- Chọn Quận/Huyện --</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Phường / Xã" required>
          <Select size="sm" value={geo.wardCode} onChange={onWardChange} disabled={!geo.districtCode}>
            <option value="">-- Chọn Phường/Xã --</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {geoErr && <div className="mt-2 text-[11px] text-err">⚠️ Lỗi tải địa giới: {geoErr}</div>}
    </Card>
  )
}
