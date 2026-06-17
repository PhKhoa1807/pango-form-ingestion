-- ============================================================
--  VSON - App Nhập Thông Tin  →  Schema Supabase (PostgreSQL)
--  Chạy toàn bộ file này trong DB rỗng: customer_data_db
--  (Supabase Dashboard → SQL Editor → New query → dán → Run)
--
--  Mô hình: 1 khách hàng -> nhiều đơn -> mỗi đơn nhiều sản phẩm
--      customers (1) ──< orders (1) ──< order_items (n)
--  Khớp đúng các field trong form: CustomerForm.jsx & ProductsTable.jsx
-- ============================================================

-- Cho phép sinh UUID (Supabase đã bật sẵn, để chắc chắn)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) KHÁCH HÀNG
-- ------------------------------------------------------------
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                 -- customer.name  (Tên khách hàng - bắt buộc)
  customer_code text,                           -- customer.cusid (Mã khách hàng KH001)
  email         text,                           -- customer.email
  phone         text,                           -- customer.phone
  address       text,                           -- customer.address  (Địa chỉ số nhà/đường - Pango customField10)
  province      text,                           -- customer.province (Tỉnh/Thành phố - Pango customField13)
  district      text,                           -- customer.district (Quận/Huyện - Pango customField11)
  ward          text,                           -- customer.ward     (Phường/Xã - Pango customField12)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Mã khách hàng phải duy nhất (Postgres coi mỗi NULL là khác nhau nên vẫn
-- cho phép nhiều dòng customer_code rỗng). Dùng UNIQUE constraint (không phải
-- partial index) để upsert ON CONFLICT (customer_code) hoạt động được.
alter table public.customers drop constraint if exists customers_customer_code_key;
alter table public.customers add constraint customers_customer_code_key unique (customer_code);

-- Số điện thoại là khóa nhận diện khách -> mỗi SĐT chỉ 1 khách.
-- Dùng partial unique index (where phone is not null) để vẫn cho phép dòng NULL.
create unique index if not exists customers_phone_key
  on public.customers (phone) where phone is not null;

-- ------------------------------------------------------------
-- 2) ĐƠN HÀNG
-- ------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  order_code    text not null unique,           -- customer.orderId  (Mã đơn DH-0001 - bắt buộc, duy nhất)
  status        text,                           -- customer.orderStatus (Mới / Đã giao...)
  order_date    timestamptz default now(),      -- customer.orderDate
  total_amount  bigint not null default 0,      -- tổng tiền đơn (tự tính từ order_items)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_order_date_idx  on public.orders (order_date);

-- ------------------------------------------------------------
-- 3) SẢN PHẨM TRONG ĐƠN
-- ------------------------------------------------------------
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_code  text,                           -- product.pid   (Mã SP)
  product_name  text,                           -- product.pname (Tên sản phẩm)
  price         bigint not null default 0,      -- product.price (Đơn giá, VND)
  qty           integer not null default 1 check (qty > 0),
  -- Thành tiền dòng = đơn giá * số lượng, tự tính, không cần ghi tay
  line_total    bigint generated always as (price * qty) stored,
  created_at    timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ------------------------------------------------------------
-- 4) TRIGGER: tự cập nhật updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5) TRIGGER: tự tính lại total_amount của đơn khi thêm/sửa/xóa SP
-- ------------------------------------------------------------
create or replace function public.recalc_order_total()
returns trigger
language plpgsql
as $$
declare
  v_order_id uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o
     set total_amount = coalesce(
           (select sum(line_total) from public.order_items where order_id = v_order_id), 0)
   where o.id = v_order_id;
  return null;
end;
$$;

drop trigger if exists trg_order_items_recalc on public.order_items;
create trigger trg_order_items_recalc
  after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_total();

-- ------------------------------------------------------------
-- 6) VIEW tiện xem nhanh đơn + khách + tổng tiền
-- ------------------------------------------------------------
create or replace view public.order_summary as
select
  o.id            as order_id,
  o.order_code,
  o.status,
  o.order_date,
  o.total_amount,
  c.name          as customer_name,
  c.customer_code,
  c.email,
  c.phone,
  (select count(*) from public.order_items i where i.order_id = o.id) as item_count
from public.orders o
join public.customers c on c.id = o.customer_id
order by o.created_at desc;

-- ------------------------------------------------------------
-- 7) ROW LEVEL SECURITY
--    Supabase mặc định chặn hết khi bật RLS. App gọi bằng anon key
--    (không đăng nhập) nên mở quyền cho cả 'anon' và 'authenticated'.
--    ⚠️ Lưu ý: anon = ai có anon key cũng đọc/ghi được. Hợp cho app
--    nội bộ/training; nếu cần bảo mật hơn thì siết lại policy sau.
-- ------------------------------------------------------------
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "allow all for authenticated" on public.customers;
drop policy if exists "allow all" on public.customers;
create policy "allow all" on public.customers
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "allow all for authenticated" on public.orders;
drop policy if exists "allow all" on public.orders;
create policy "allow all" on public.orders
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "allow all for authenticated" on public.order_items;
drop policy if exists "allow all" on public.order_items;
create policy "allow all" on public.order_items
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
--  XONG. Sau khi chạy, kiểm tra ở Table Editor sẽ thấy 3 bảng
--  customers / orders / order_items và view order_summary.
-- ============================================================
