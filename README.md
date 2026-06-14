# VSON · Nhập đơn → Pango Data Ingestion (React + Vite)

App nhập đơn thủ công rồi đẩy dữ liệu lên **Pango Data Ingestion** (Model `custom-model`).
Đã chuyển từ HTML thuần sang **React + Vite + Tailwind CSS v4**.

## Chạy dev

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra (mặc định http://localhost:5173).

## CORS / Proxy

Không cần `proxy.js` hay tắt CORS của Chrome nữa. Vite dev server tự proxy:

- `/api-auth/*`   → `https://account.mydatalakes.com` (đổi refreshToken → accessToken)
- `/api-ingest/*` → `https://svc.mydatalakes.com` (ingest)

Cấu hình trong [vite.config.js](vite.config.js). Request từ trình duyệt đi cùng origin với
dev server nên không dính CORS.

> ⚠️ Proxy chỉ hoạt động ở chế độ `npm run dev`. Khi `npm run build` deploy tĩnh,
> cần một backend proxy thật (ví dụ port lại `proxy.js` cũ hoặc reverse proxy của hosting).

## Cấu trúc

```
src/
  App.jsx                # State chính + điều phối
  config.js              # Khóa cấu hình + giá trị mặc định
  lib/pango.js           # fetchToken / buildPayload / pushToPango
  components/
    ui.jsx               # Card, Field, TextInput, Button (Tailwind)
    ConfigCard.jsx       # Cấu hình kết nối Pango (localStorage)
    CustomerForm.jsx     # Thông tin khách hàng & đơn
    ProductsTable.jsx    # Bảng sản phẩm + thêm dòng
    ResultPanel.jsx      # Preview payload + Response
```
