import React from 'react'
import { MessageCircle, FlaskConical, Activity, Layers } from 'lucide-react'
import { DaoLogo } from './components/DaoLogo'
import { ChatPage } from './pages/ChatPage'
import { AuditPage } from './pages/AuditPage'
import { MonitorPage } from './pages/MonitorPage'
import { CollectivePage } from './pages/CollectivePage'

type Page = 'chat' | 'audit' | 'monitor' | 'collective'

function getInitialPage(): Page {
  const h = window.location.hash
  if (h === '#audit')      return 'audit'
  if (h === '#monitor')    return 'monitor'
  if (h === '#collective') return 'collective'
  return 'chat'
}

export default function App(): React.JSX.Element {
  const [page, setPage] = React.useState<Page>(getInitialPage)

  // Sync hash ↔ page state
  React.useEffect(() => {
    const handler = (): void => {
      const h = window.location.hash
      if (h === '#audit')           setPage('audit')
      else if (h === '#monitor')    setPage('monitor')
      else if (h === '#collective') setPage('collective')
      else setPage('chat')
    }
    window.addEventListener('hashchange', handler)
    return (): void => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (p: Page): void => {
    const hash = p === 'audit' ? '#audit' : p === 'monitor' ? '#monitor' : p === 'collective' ? '#collective' : '#chat'
    window.location.hash = hash
    setPage(p)
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="app-nav-brand">
          <DaoLogo className="app-nav-logo" />
          <span className="app-nav-brand-name">DaoMind</span>
          <span className="app-nav-brand-dot">·</span>
          <span className="app-nav-brand-sub">道衍 AI</span>
        </div>

        <div className="app-nav-tabs">
          <button
            className={`app-nav-tab ${page === 'chat' ? 'active' : ''}`}
            onClick={() => navigate('chat')}
          >
            <MessageCircle size={14} />
            <span>问道</span>
          </button>
          <button
            className={`app-nav-tab ${page === 'audit' ? 'active' : ''}`}
            onClick={() => navigate('audit')}
          >
            <FlaskConical size={14} />
            <span>道审</span>
          </button>
          <button
            className={`app-nav-tab ${page === 'monitor' ? 'active' : ''}`}
            onClick={() => navigate('monitor')}
          >
            <Activity size={14} />
            <span>道监</span>
          </button>
          <button
            className={`app-nav-tab ${page === 'collective' ? 'active' : ''}`}
            onClick={() => navigate('collective')}
          >
            <Layers size={14} />
            <span>道集</span>
          </button>
        </div>
      </nav>

      <div className="app-content">
        {page === 'chat'       ? <ChatPage />       :
         page === 'audit'      ? <AuditPage />      :
         page === 'collective' ? <CollectivePage /> :
                                 <MonitorPage />}
      </div>
    </div>
  )
}
