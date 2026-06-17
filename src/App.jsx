import { useState } from 'react'
import { CFG_KEYS, DEFAULT_CFG, CFG_STORAGE_KEY } from './config.js'
import { MENU } from './nav.js'
import Sidebar from './components/Sidebar.jsx'
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
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar view={view} onNavigate={setView} />
      <main className="no-scrollbar flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-[1100px]">{renderView()}</div>
      </main>
    </div>
  )
}
