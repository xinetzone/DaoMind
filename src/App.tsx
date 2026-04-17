import React from 'react'
import { MessageCircle, FlaskConical, Activity, Layers, BarChart2 } from 'lucide-react'
import { DaoLogo } from './components/DaoLogo'
import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import { ChatPage } from './pages/ChatPage'
import { AuditPage } from './pages/AuditPage'
import { MonitorPage } from './pages/MonitorPage'
import { CollectivePage } from './pages/CollectivePage'
import { StatsPage } from './pages/StatsPage'

type Page = 'chat' | 'audit' | 'monitor' | 'collective' | 'stats'

const HASH_TO_PAGE: Record<string, Page> = {
  '#audit': 'audit',
  '#monitor': 'monitor',
  '#collective': 'collective',
  '#stats': 'stats',
  '#chat': 'chat',
}
const PAGE_TO_HASH: Record<Page, string> = {
  audit: '#audit',
  monitor: '#monitor',
  collective: '#collective',
  stats: '#stats',
  chat: '#chat',
}

function getInitialPage(): Page {
  return HASH_TO_PAGE[window.location.hash] ?? 'chat'
}

export default function App(): React.JSX.Element {
  const [page, setPage] = React.useState<Page>(getInitialPage)
  const { theme, setTheme } = useTheme()

  // Sync hash ↔ page state
  React.useEffect(() => {
    const handler = (): void => {
      setPage(HASH_TO_PAGE[window.location.hash] ?? 'chat')
    }
    window.addEventListener('hashchange', handler)
    return (): void => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (p: Page): void => {
    window.location.hash = PAGE_TO_HASH[p]
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
          <button
            className={`app-nav-tab ${page === 'stats' ? 'active' : ''}`}
            onClick={() => navigate('stats')}
          >
            <BarChart2 size={14} />
            <span>道数</span>
          </button>
        </div>

        <div className="app-nav-right">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </nav>

      <div className="app-content">
        {page === 'chat'       ? <ChatPage />       :
         page === 'audit'      ? <AuditPage />      :
         page === 'collective' ? <CollectivePage /> :
         page === 'stats'      ? <StatsPage />      :
                                 <MonitorPage />}
      </div>
    </div>
  )
}
