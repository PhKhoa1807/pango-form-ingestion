# Nhật ký thay đổi — VSON App Nhập Thông Tin

Ghi lại các thay đổi đáng chú ý của ứng dụng (React + Vite + Tailwind v4 + Supabase → PangoCDP).

---

## 2026-06-19

### Danh mục sản phẩm — gộp 2 bảng thành 1 bảng `products`
- **DB**: Drop `product_torayvino` + `product_kingbag`, tạo bảng `products` có thêm cột `category`
  (`'Torayvino'` / `'Kingbag'`), giữ nguyên 29 SP Torayvino + 58 SP Kingbag. Xem `supabase/setup_full.sql`.
- **`src/lib/supabase.js`**:
  - `getAllProducts()` query 1 bảng `products` (kèm `category`).
  - Thêm `getAllCategories()` — lấy danh sách danh mục duy nhất.
  - `searchProductsByCode/ByName(q, category)` — lọc theo danh mục (rỗng = tất cả).

### Tạo đơn hàng — dropdown Danh mục + search sản phẩm
- Thêm dropdown **Danh mục** trước ô Mã SP; chọn danh mục → reset dòng nhập + 2 ô Mã SP / Tên SP
  chỉ tìm trong danh mục đó (chưa chọn = tìm tất cả).
- Dropdown Danh mục tự dựng **`src/components/SelectMenu.jsx`** (bỏ Dropdown của HeroUI cho ô này),
  style giống ô Mã SP, đóng khi click ra ngoài bằng `pointerdown` capture.
- **`ProductPicker`**: click vào ô là **tự sổ danh sách** (giống Tỉnh/Thành); đóng khi click ra ngoài
  (sửa lỗi click Danh mục mà list SP vẫn mở — dùng `pointerdown` ở capture phase).

### Địa chỉ 3 cấp → 2 cấp (theo địa giới VN mới 01/07/2025)
- Dùng **Province Open API v2** (`/api/v2`, 34 tỉnh, bỏ cấp Quận/Huyện).
- **`src/lib/provinces.js`**: bỏ `getDistricts`; `getWards(provinceCode)` lấy thẳng từ `/p/{code}?depth=2`.
- **`CustomerForm.jsx`**: bỏ dropdown Quận/Huyện, cascade Tỉnh → Phường/Xã.
- **`pango.js`**: bỏ hẳn `customField11` (Quận/Huyện) khỏi payload.
- **`CreateOrder.jsx`**: bỏ `district` khỏi danh sách trường bắt buộc.
- Cột `district` trong bảng `customers` vẫn còn nhưng không dùng nữa.

### Hiển thị & định dạng
- Ẩn thanh cuộn toàn app (`src/index.css`), vẫn cuộn được bình thường.
- Đơn giá hiển thị theo nghìn (`490.000` thay vì `490000`); popover Giảm giá tổng đơn (VND) cũng vậy.

### Trang Quản lý đơn hàng (mới) — `src/pages/ManageOrders.jsx`
- Bật menu `manage-orders` (`src/nav.js`), wire vào `App.jsx`.
- Ô **search** (`SearchField` HeroUI) tìm theo Mã đơn / Tên KH / Mã KH (bỏ dấu); nút **+ Tạo đơn hàng**
  cùng hàng với ô search.
- Bảng đơn (HTML thuần) các cột: Mã đơn hàng, Thời gian, Mã KH, Tên KH, Tổng hóa đơn, Trạng thái.
  Lấy dữ liệu từ view `order_summary` (`listOrders()`).
- Ô **tick chọn** từng dòng + ô tick **chọn tất cả** ở header (có trạng thái indeterminate).
- Khi có chọn → hiện nút **⋯** (Dropdown HeroUI) với option **Xóa đơn hàng** (đỏ) → confirm →
  `deleteOrders()` (xóa nhiều đơn, `order_items` tự xóa theo cascade).
- **Phân trang 10 đơn/trang** (`Pagination` HeroUI): nút Trước/Sau + số trang + `…`, tự về trang 1 khi
  đổi search, tự lùi trang khi xóa hết đơn ở trang cuối.

### Dialog chi tiết đơn hàng — `src/components/OrderDetailDialog.jsx`
- Bấm vào 1 dòng đơn ở Quản lý đơn hàng → mở dialog **Thông tin đơn hàng** (đóng bằng ✕ / click nền / Esc).
- Hiển thị: Tên KH, Số điện thoại, Mã KH, Mã đơn, **Trạng thái đơn hàng**, Địa chỉ, Tỉnh/TP, Phường/Xã
  + danh sách sản phẩm (Mã hàng, Tên hàng, SL, Đơn giá, **Giảm giá**, Thành tiền) + Tổng tiền hàng.
- Dữ liệu: `getOrderDetail()` join `customers` + `order_items`.

### Validate & nhập liệu (`CustomerForm.jsx`, `CreateOrder.jsx`)
- Bỏ dòng chữ "⚠️ Các trường bắt buộc nhập"; thay bằng `toast.danger("Vui lòng nhập đầy đủ thông tin")`,
  vẫn bôi đỏ các trường thiếu.
- **Số điện thoại**: chỉ cho nhập số. Chặn ở native `beforeinput` + chặn cả backspace "sửa lỗi" của bộ gõ
  tiếng Việt (Telex/VNI) trong ~60ms để **không xóa lẹm số** đã nhập.
- **Tên khách hàng**: không cho nhập số (`[0-9]`).

### Giảm giá theo từng sản phẩm
- **DB** (`order_items`): thêm `product_discount numeric(12,2) default 0` và
  `product_discount_type text default 'amount'` (`'amount'` = VND, `'percent'` = %).
- **Tạo đơn** (`ProductsTable.jsx`): thêm cột **Giảm giá** bên trái Thành tiền; mỗi SP mặc định 0; bấm vào
  số → popover (VND/%) giống giảm giá tổng đơn; Thành tiền mỗi dòng = `Đơn giá × SL − giảm giá`, tổng đơn
  cập nhật theo.
- **`pango.js`**: thêm `lineDiscount` / `lineNet`; tổng đơn tính trên thành tiền đã trừ giảm giá SP.
- **`saveOrderToSupabase`**: lưu `product_discount` + `product_discount_type` theo từng SP.
- **Dialog**: cột Giảm giá / Thành tiền / Tổng tiền hàng tính đúng theo amount/percent đã lưu.
- *(Không đẩy giảm giá per-SP lên Pango — chỉ gửi tổng đơn đã trừ giảm giá.)*
