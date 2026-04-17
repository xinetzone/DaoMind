import React from 'react'
import { MessageCircle, FlaskConical } from 'lucide-react'
import { DaoLogo } from './components/DaoLogo'
import { ChatPage } from './pages/ChatPage'
import { AuditPage } from './pages/AuditPage'

type Page = 'chat' | 'audit'

function getInitialPage(): Page {
  return window.location.hash === '#audit' ? 'audit' : 'chat'
}

export default function App(): React.JSX.Element {
  const [page, setPage] = React.useState<Page>(getInitialPage)

  // Sync hash ↔ page state
  React.useEffect(() => {
    const handler = (): void => {
      setPage(window.location.hash === '#audit' ? 'audit' : 'chat')
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (p: Page): void => {
    window.location.hash = p === 'audit' ? '#audit' : '#chat'
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
        </div>
      </nav>

      <div className="app-content">
        {page === 'chat' ? <ChatPage /> : <AuditPage />}
      </div>
    </div>
  )
}
