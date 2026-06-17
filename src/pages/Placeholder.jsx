import { Card } from '../components/ui.jsx'

// Trang tạm cho các phần chưa phát triển.
export default function Placeholder({ item }) {
  return (
    <div className="grid gap-[18px]">
      <div>
        <h1 className="mb-1 text-xl font-bold">
          {item.icon} {item.title}
        </h1>
        <p className="m-0 text-[13px] text-muted">{item.desc}</p>
      </div>
      <Card>
        <div className="py-10 text-center text-muted">
          <div className="mb-2 text-4xl">🚧</div>
          <div className="text-[15px] font-semibold text-txt">Đang phát triển</div>
          <div className="mt-1 text-[13px]">Phần này sẽ sớm được bổ sung.</div>
        </div>
      </Card>
    </div>
  )
}
