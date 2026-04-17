import React from 'react'
import { MessageCircle, FlaskConical, Activity } from 'lucide-react'
import { DaoLogo } from './components/DaoLogo'
import { ChatPage } from './pages/ChatPage'
import { AuditPage } from './pages/AuditPage'
import { MonitorPage } from './pages/MonitorPage'

type Page = 'chat' | 'audit' | 'monitor'

function getInitialPage(): Page {
  const h = window.location.hash
  if (h === '#audit')   return 'audit'
  if (h === '#monitor') return 'monitor'
  return 'chat'
}

export default function App(): React.JSX.Element {
  const [page, setPage] = React.useState<Page>(getInitialPage)

  // Sync hash ↔ page state
  React.useEffect(() => {
    const handler = (): void => {
      const h = window.location.hash
      if (h === '#audit')   setPage('audit')
      else if (h === '#monitor') setPage('monitor')
      else setPage('chat')
    }
    window.addEventListener('hashchange', handler)
    return (): void => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (p: Page): void => {
    window.location.hash = p === 'audit' ? '#audit' : p === 'monitor' ? '#monitor' : '#chat'
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
        </div>
      </nav>

      <div className="app-content">
        {page === 'chat'    ? <ChatPage />    :
         page === 'audit'   ? <AuditPage />   :
                              <MonitorPage />}
      </div>
    </div>
  )
}
