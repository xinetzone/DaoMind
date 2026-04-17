import React from 'react'
import { DaoLogo } from './components/DaoLogo'
import { ChatPage } from './pages/ChatPage'

export default function App(): React.JSX.Element {
  return (
    <div className="app">
      <nav className="app-nav">
        <div className="app-nav-brand">
          <DaoLogo className="app-nav-logo" />
          <span className="app-nav-brand-name">DaoMind</span>
          <span className="app-nav-brand-dot">·</span>
          <span className="app-nav-brand-sub">道衍 AI</span>
        </div>
      </nav>

      <div className="app-content">
        <ChatPage />
      </div>
    </div>
  )
}
