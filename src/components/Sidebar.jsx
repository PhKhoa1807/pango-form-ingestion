import { useState } from 'react'
import { MENU, PREFERENCE } from '../nav.js'
import logo from '../access/image/Logo-Images-04.jpg'
import angleLeft from '../access/image/angle-left-solid-full.svg'

// Một mục điều hướng trong sidebar.
function NavItem({ item, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.title : undefined}
      className={`flex h-[38px] w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors ${
        active
          ? 'bg-accent/10 font-bold text-accent2'
          : 'font-semibold text-txt hover:bg-card2 hover:text-accent2'
      }`}
    >
      <span className="text-base leading-none">{item.icon}</span>
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
      {!collapsed && !item.ready && (
        <span className="rounded bg-orange/10 px-[5px] py-px text-[9px] font-normal text-orange">
          Sắp có
        </span>
      )}
    </button>
  )
}

// Tiêu đề nhóm (Menu / Preference) — luôn hiển thị; khi thu gọn dùng bản rút gọn.
function GroupLabel({ children, short, collapsed }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-txt">
      {collapsed ? short : children}
    </div>
  )
}

// Thanh điều hướng trái cố định, có thể thu nhỏ còn icon.
export default function Sidebar({ view, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = () => setCollapsed((c) => !c)

  // Nút thu nhỏ / mở rộng — nút tròn nhỏ nằm vắt trên đường viền dọc bên phải.
  const ToggleBtn = (
    <button
      onClick={toggle}
      title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}
      className="absolute right-0 top-[56px] z-20 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-card shadow-sm transition-colors hover:bg-card2"
    >
      <img
        src={angleLeft}
        alt=""
        className={`h-3 w-3 opacity-60 transition-transform ${collapsed ? 'rotate-180' : ''}`}
      />
    </button>
  )

  return (
    <aside
      className={`relative shrink-0 border-r border-line bg-card transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-[65px]' : 'w-[240px]'
      }`}
    >
      {ToggleBtn}

      {/* Nội dung sidebar — overflow-hidden để cắt gọn khi thu/mở */}
      <div className="flex h-full flex-col overflow-hidden whitespace-nowrap px-2 py-3">
        {/* Logo + tên */}
        <div className="mb-2 flex items-center gap-2 px-1">
          <img src={logo} alt="VSON" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          {!collapsed && (
            <div className="flex-1 leading-tight">
              <div className="text-[15px] font-bold text-txt">VSON</div>
              <div className="text-[11px] text-muted">Nhập thông tin</div>
            </div>
          )}
        </div>

        {/* Gạch ngang nhẹ ngăn cách logo và menu */}
        <div className="mx-1 border-t border-line" />

        <GroupLabel collapsed={collapsed} short="Menu">
          Menu
        </GroupLabel>
        <nav className="flex flex-col gap-1">
          {MENU.map((m) => (
            <NavItem
              key={m.key}
              item={m}
              active={view === m.key}
              collapsed={collapsed}
              onClick={() => onNavigate(m.key)}
            />
          ))}
        </nav>

        <GroupLabel collapsed={collapsed} short="Pre">
          Preference
        </GroupLabel>
        <nav className="flex flex-col gap-1">
          {PREFERENCE.map((m) => (
            <NavItem
              key={m.key}
              item={m}
              active={view === m.key}
              collapsed={collapsed}
              onClick={() => onNavigate(m.key)}
            />
          ))}
        </nav>
      </div>
    </aside>
  )
}
