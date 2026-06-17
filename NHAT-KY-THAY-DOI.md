# Nhật ký thay đổi — App Nhập Thông Tin (VSON)

Ghi lại những gì đã làm ở nhánh `dev` (chưa commit), tính đến 2026-06-17.

## Tóm tắt

Tái cấu trúc app từ một trang đơn (single form) thành **kiến trúc nhiều trang có Dashboard điều hướng**, đồng thời **đổi giao diện từ dark theme sang light theme khớp logo VSON** (xanh lá chủ đạo + cam điểm nhấn).

---

## 1. Điều hướng & cấu trúc trang mới

### `src/nav.js` (mới)
- Khai báo `MENU` — danh sách 6 module của app, mỗi mục có `key`, `title`, `icon`, `desc`, `ready`:
  1. `create-order` — Tạo đơn hàng *(ready)*
  2. `manage-orders` — Quản lý đơn hàng *(chưa làm)*
  3. `manage-products` — Quản lý sản phẩm *(chưa làm)*
  4. `create-product-code` — Tạo mã sản phẩm *(chưa làm)*
  5. `manage-customers` — Quản lý khách hàng *(chưa làm)*
  6. `settings` — Thiết lập *(ready)*

### `src/App.jsx` (sửa)
- Bỏ toàn bộ state/logic của form đơn hàng ra khỏi `App` (chuyển sang `CreateOrder`).
- `App` giờ chỉ giữ `cfg` (config) + `view` (trang đang xem), và làm **router đơn giản** bằng `switch`:
  - `dashboard` → `Dashboard`
  - `create-order` → `CreateOrder`
  - `settings` → `Settings`
  - còn lại → `Placeholder` (tra trong `MENU`)
- Thêm nút **"← Trang chủ"** hiển thị khi không ở Dashboard.
- Nới khung nội dung từ `max-w-[920px]` lên `max-w-[90%]`.

### `src/pages/Dashboard.jsx` (mới)
- Màn hình chính: header có **logo VSON**, lưới **3 cột** các ô vuông (`aspect-square`) lấy từ `MENU`.
- Bấm ô → `onNavigate(key)`. Ô chưa làm hiện badge **"Sắp có"** (màu cam).
- Hiệu ứng hover: nhấc ô lên, đổi viền theo accent, phóng to icon.

### `src/pages/CreateOrder.jsx` (mới)
- Chứa toàn bộ logic tạo đơn (tách từ `App.jsx` cũ): nhập khách hàng + sản phẩm → **xem trước payload** → **gửi lên Pango** (kèm lưu Supabase nếu bật).
- Giữ nguyên luồng: validate → lưu Supabase (không chặn) → push Pango → gửi OK thì xóa form.

### `src/pages/Settings.jsx` (mới)
- Trang thiết lập, dùng `ConfigCard` ở chế độ `flat` (mở sẵn, không thu gọn).

### `src/pages/Placeholder.jsx` (mới)
- Trang tạm "🚧 Đang phát triển" cho các module chưa làm.

---

## 2. Giao diện — đổi sang Light theme khớp logo VSON

### `src/index.css` (sửa)
Đổi bảng màu design token từ dark → light:

| Token | Cũ (dark) | Mới (light) |
|---|---|---|
| `--color-bg` | `#0f1115` | `#f4f6f8` |
| `--color-card` | `#1a1d24` | `#ffffff` |
| `--color-card2` | `#232730` | `#eef1f4` |
| `--color-line` | `#2e333d` | `#dde2e8` |
| `--color-txt` | `#e6e8ec` | `#1f2933` |
| `--color-muted` | `#9aa1ac` | `#6b7480` |
| `--color-accent` | `#6c5ce7` (tím) | `#2fa84f` (xanh lá) |
| `--color-accent2` | `#8b7bff` | `#248f42` |
| `--color-orange` | *(không có)* | `#f0822e` (mới) |
| `--color-ok` | `#2ecc71` | `#2fa84f` |
| `--color-err` | `#ff5c5c` | `#e53935` |
| `--color-warn` | `#ffb84d` | `#f0822e` |

### `src/components/ui.jsx` (sửa)
- `Card`: thêm `shadow-sm`.
- `Button` primary: thêm `shadow-sm` + `hover:shadow-md`.

### `src/components/ConfigCard.jsx` (sửa)
- Thêm prop **`flat`**: `false` (mặc định) = dạng `<details>` thu gọn; `true` = card mở sẵn (dùng cho trang Thiết lập).
- Tách phần input thành biến `fields` dùng chung cho cả 2 chế độ.
- Thêm `shadow-sm`.

### `src/components/ResultPanel.jsx` (sửa)
- Đổi nền khối `<pre>` từ màu hardcode `#0c0e12` sang token `bg-card2`.

### `src/components/ProductsTable.jsx` (sửa)
- Nút xóa: bỏ màu hover hardcode `#ff8888`, dùng `hover:opacity-70`.

---

## 3. Tài nguyên

### `src/access/image/Logo-Images-04.jpg` (mới)
- Logo VSON, import vào `Dashboard.jsx`.

---

## Việc còn lại (gợi ý)
- 4 module đang là Placeholder: Quản lý đơn hàng, Quản lý sản phẩm, Tạo mã sản phẩm, Quản lý khách hàng.
- Lưu ý: `src/nav.js` đang lưu **không đúng encoding UTF-8** (tiếng Việt bị lỗi khi xem bằng git) — nên lưu lại đúng UTF-8.
