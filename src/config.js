// 6 trường cấu hình kết nối Pango (hiển thị trong UI, lưu localStorage)
export const CFG_KEYS = ['orgId', 'appId', 'account', 'refreshToken', 'momCode', 'source']

export const DEFAULT_CFG = {
  orgId: 'c093bd1b34a977ff1c62602749d59984',
  appId: 'GUKOZ8G4JO6WXA74D01YY8EPQQOBYALX4AG',
  account: 'KHOAVSON1',
  momCode: 'M-HY2SR-O-C6HCK-M',
  refreshToken:
    'pango-ANY1u0qExsybbCVbMtEBlnCnv-mXk7HincshmVY80G6AGtOQ5VPGjcKrnFlZQ.xSh1SanurWDBFnLV7KxluxdMWEgkI6-acn',
  source: 'VSON Partner Training',
}

export const CFG_STORAGE_KEY = 'vson_cfg_v2'

export const EMPTY_CUSTOMER = {
  name: '',
  cusid: '',
  email: '',
  phone: '',
  orderId: '',
  orderStatus: '',
  address: '',
  province: '',
  district: '',
  ward: '',
}
