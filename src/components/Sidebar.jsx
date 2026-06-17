import { MENU, PREFERENCE } from '../nav.js'
import logo from '../access/image/Logo-Images-04.jpg'

// Một mục điều hướng trong sidebar.
function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-[9px] text-left text-[13px] transition-colors ${
        active
          ? 'bg-accent/10 font-semibold text-accent2'
          : 'text-muted hover:bg-card2 hover:text-txt'
      }`}
    >
      <span className="text-base leading-none">{item.icon}</span>
      <span className="flex-1 truncate">{item.title}</span>
      {!item.ready && (
        <span className="rounded bg-orange/10 px-[5px] py-px text-[9px] font-normal text-orange">
          Sắp có
        </span>
      )}
    </button>
  )
}

// Tiêu đề nhóm trong sidebar (Menu / Preference).
function GroupLabel({ children }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  )
}

// Thanh điều hướng trái cố định.
export default function Sidebar({ view, onNavigate }) {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-line bg-card p-4">
      {/* Logo + tên thương hiệu */}
      <div className="mb-2 flex items-center gap-[10px] px-2">
        <img src={logo} alt="VSON" className="h-9 w-9 rounded-lg object-contain" />
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-txt">VSON</div>
          <div className="text-[11px] text-muted">Nhập thông tin</div>
        </div>
      </div>

      <GroupLabel>Menu</GroupLabel>
      <nav className="flex flex-col gap-1">
        {MENU.map((m) => (
          <NavItem key={m.key} item={m} active={view === m.key} onClick={() => onNavigate(m.key)} />
        ))}
      </nav>

      <GroupLabel>Preference</GroupLabel>
      <nav className="flex flex-col gap-1">
        {PREFERENCE.map((m) => (
          <NavItem key={m.key} item={m} active={view === m.key} onClick={() => onNavigate(m.key)} />
        ))}
      </nav>
    </aside>
  )
}
