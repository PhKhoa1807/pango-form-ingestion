import { useState } from 'react'
import { CFG_KEYS, DEFAULT_CFG, CFG_STORAGE_KEY } from './config.js'
import { MENU } from './nav.js'
import Dashboard from './pages/Dashboard.jsx'
import CreateOrder from './pages/CreateOrder.jsx'
import Settings from './pages/Settings.jsx'
import Placeholder from './pages/Placeholder.jsx'

function loadCfg() {
  try {
    const saved = JSON.parse(localStorage.getItem(CFG_STORAGE_KEY) || '{}')
    const merged = { ...DEFAULT_CFG }
    CFG_KEYS.forEach((k) => {
      if (saved[k] != null) merged[k] = saved[k]
    })
    return merged
  } catch {
    return { ...DEFAULT_CFG }
  }
}

export default function App() {
  const [cfg, setCfg] = useState(loadCfg)
  const [view, setView] = useState('dashboard') // 'dashboard' hoặc key trong MENU

  const saveCfg = () => {
    const obj = {}
    CFG_KEYS.forEach((k) => (obj[k] = cfg[k]))
    localStorage.setItem(CFG_STORAGE_KEY, JSON.stringify(obj))
  }

  const renderView = () => {
    switch (view) {
      case 'create-order':
        return <CreateOrder cfg={cfg} />
      case 'settings':
        return <Settings cfg={cfg} setCfg={setCfg} onSave={saveCfg} />
      case 'dashboard':
        return <Dashboard onNavigate={setView} />
      default: {
        const item = MENU.find((m) => m.key === view)
        return item ? <Placeholder item={item} /> : <Dashboard onNavigate={setView} />
      }
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[90%]">
        {view !== 'dashboard' && (
          <button
            onClick={() => setView('dashboard')}
            className="mb-4 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-card px-3 py-[7px] text-[13px] text-txt shadow-sm transition-colors hover:border-accent hover:bg-card2"
          >
            ← Trang chủ
          </button>
        )}
        {renderView()}
      </div>
    </div>
  )
}
