// Toast dùng Alert của HeroUI, hiển thị ở góc phải trên, tự ẩn sau 1 khoảng.
// Dùng emitter mức module để gọi được từ bất kỳ đâu (kể cả ngoài component).
import { useCallback, useEffect, useState } from 'react'
import { Alert } from '@heroui/react'

const listeners = new Set()
let seq = 0

// toast({ status, title, description, duration }) — mặc định status 'danger'.
export function toast(opts) {
  const item = {
    id: ++seq,
    status: 'danger',
    duration: 4000,
    ...(typeof opts === 'string' ? { title: opts } : opts),
  }
  listeners.forEach((fn) => fn(item))
  return item.id
}
toast.danger = (title, description) => toast({ status: 'danger', title, description })
toast.success = (title, description) => toast({ status: 'success', title, description })

// Mount 1 lần ở gốc app. Lắng nghe emitter và render stack toast.
export function ToastHost() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const onToast = (item) => setItems((list) => [...list, item])
    listeners.add(onToast)
    return () => listeners.delete(onToast)
  }, [])

  const remove = (id) => setItems((list) => list.filter((t) => t.id !== id))

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((t) => (
        <ToastItem key={t.id} item={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  )
}

const ANIM_MS = 700

function ToastItem({ item, onClose }) {
  const [show, setShow] = useState(false)

  // Trượt vào khi mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Đóng: trượt ra trước, hết animation mới xoá khỏi list.
  const close = useCallback(() => {
    setShow(false)
    setTimeout(onClose, ANIM_MS)
  }, [onClose])

  // Tự ẩn sau duration.
  useEffect(() => {
    if (!item.duration) return
    const id = setTimeout(close, item.duration)
    return () => clearTimeout(id)
  }, [item.duration, close])

  return (
    <div
      className={`transform transition-all duration-700 ease-out ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Alert
        status={item.status}
        className="pointer-events-auto cursor-pointer shadow-lg rounded-xl"
        onClick={close}
      >
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{item.title}</Alert.Title>
          {item.description && <Alert.Description>{item.description}</Alert.Description>}
        </Alert.Content>
      </Alert>
    </div>
  )
}
