// Danh sách các phần (module) của ứng dụng — dùng cho sidebar và điều hướng.

// Nhóm "Menu" chính.
export const MENU = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: '🏠',
    desc: 'Tổng quan & lối tắt vào các phần',
    ready: true,
  },
  {
    key: 'create-order',
    title: 'Tạo đơn hàng',
    icon: '🧾',
    desc: 'Nhập đơn tay → đẩy dữ liệu lên Pango',
    ready: true,
  },
  {
    key: 'manage-orders',
    title: 'Quản lý đơn hàng',
    icon: '📋',
    desc: 'Xem & tra cứu các đơn đã tạo',
    ready: false,
  },
  {
    key: 'manage-products',
    title: 'Quản lý sản phẩm',
    icon: '📦',
    desc: 'Danh mục sản phẩm theo thương hiệu',
    ready: false,
  },
  {
    key: 'create-product-code',
    title: 'Tạo mã sản phẩm',
    icon: '🏷️',
    desc: 'Sinh mã / SKU cho sản phẩm mới',
    ready: false,
  },
  {
    key: 'manage-customers',
    title: 'Quản lý khách hàng',
    icon: '👥',
    desc: 'Danh sách & thông tin khách hàng',
    ready: false,
  },
]

// Nhóm "Preference" (dưới cùng sidebar).
export const PREFERENCE = [
  {
    key: 'settings',
    title: 'Thiết lập',
    icon: '⚙️',
    desc: 'Cấu hình kết nối Pango',
    ready: true,
  },
]
