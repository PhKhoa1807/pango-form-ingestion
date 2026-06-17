import { MENU } from '../nav.js'

// Màn hình chính: lưới các ô module, bấm vào ô nào điều hướng vào phần đó.
export default function Dashboard({ onNavigate }) {
  // Bỏ chính mục "dashboard" — không cần ô tự trỏ về trang hiện tại.
  const tiles = MENU.filter((m) => m.key !== 'dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-xl font-bold">Dashboard</h1>
        <p className="m-0 text-[13px] text-muted">Chọn một phần để bắt đầu</p>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        {tiles.map((m) => (
          <button
            key={m.key}
            onClick={() => onNavigate(m.key)}
            className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-card p-5 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg"
          >
            <span className="text-5xl transition-transform duration-200 group-hover:scale-110">
              {m.icon}
            </span>
            <span className="flex flex-col items-center gap-1 text-[15px] font-semibold text-txt">
              {m.title}
              {!m.ready && (
                <span className="rounded bg-orange/10 px-[6px] py-px text-[10px] font-normal text-orange">
                  Sắp có
                </span>
              )}
            </span>
            <span className="text-xs text-muted">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
