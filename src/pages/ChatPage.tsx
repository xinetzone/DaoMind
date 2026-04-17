import React, { useEffect, useRef } from 'react'
import { Send, Square, RotateCcw, MessageCircle, X, History, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAIChat, SUPABASE_URL, SUPABASE_ANON_KEY } from '../hooks/useAIChat'
import { useSessions } from '../hooks/useSessions'
import { useFeedback } from '../hooks/useFeedback'
import { SessionSidebar } from '../components/SessionSidebar'
import { MessageFeedback } from '../components/MessageFeedback'
import { DaoLogo } from '../components/DaoLogo'
import { downloadMarkdown } from '../utils/exportChat'
import type { Message } from '../hooks/useAIChat'

const SUGGESTIONS = [
  '帛书版与通行本《道德经》有哪些核心差异？',
  '「中气以为和」中，「中气」是什么含义？',
  '三才（天地人）思想在《道德经》中如何体现？',
  '如何将「无为」的智慧应用到现代生活中？',
]

export function ChatPage(): React.JSX.Element {
  const { sessions, currentSessionId, currentSession, createSession, switchSession, updateCurrentMessages, deleteSession } =
    useSessions()

  const [messages, setMessages] = React.useState<Message[]>(() => currentSession?.messages ?? [])
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = React.useState('')

  const { isLoading, error, sendMessage, stopStreaming, dismissError } = useAIChat(
    messages,
    setMessages,
  )

  const { getFeedback, submitFeedback } = useFeedback(currentSessionId)

  // Persist messages to current session whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      updateCurrentMessages(messages)
    }
  }, [messages, updateCurrentMessages])

  // Switch session: load its messages
  const handleSelectSession = (id: string): void => {
    switchSession(id)
    const session = sessions.find((s) => s.id === id)
    setMessages(session?.messages ?? [])
    setSidebarOpen(false)
  }

  // New conversation
  const handleNewChat = (): void => {
    createSession()
    setMessages([])
    setInput('')
  }

  // Export current session as Markdown
  const handleExport = (): void => {
    if (!currentSessionId) return
    downloadMarkdown({
      sessionId: currentSessionId,
      sessionTitle: currentSession?.title ?? '道衍对话',
      messages,
      getFeedback,
    })
  }

  // Pre-warm the Edge Function on mount
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${SUPABASE_URL}/functions/v1/ai-chat-8c107efce1b0`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ping: true }),
      signal: controller.signal,
    }).catch(() => {})
    return (): void => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!input.trim()) return
    // Ensure a session exists before first send
    if (!currentSessionId) createSession()
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim()) return
      if (!currentSessionId) createSession()
      sendMessage(input)
      setInput('')
    }
  }

  // ReactMarkdown code renderer with syntax highlighting
  const markdownComponents = {
    code({
      className,
      children,
    }: {
      className?: string
      children?: React.ReactNode
    }): React.JSX.Element {
      const match = /language-(\w+)/.exec(className ?? '')
      return match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: '0.5em 0', borderRadius: '10px', fontSize: '0.82em' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className}>{children}</code>
      )
    },
  }

  return (
    <div className="chat-with-sidebar">
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelect={handleSelectSession}
        onCreate={handleNewChat}
        onDelete={deleteSession}
        isOpen={sidebarOpen}
      />

      <div className="chat-layout">
        {/* Sub-header */}
        <div className="chat-subheader">
          <button
            className="chat-icon-btn chat-sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            title="历史对话"
          >
            <History size={14} />
          </button>
          <span className="chat-subheader-name">道衍 AI</span>
          <span className="chat-model-tag">GLM 5</span>
          {messages.length > 0 && (
            <>
              <button className="chat-icon-btn" onClick={handleNewChat} title="新对话">
                <RotateCcw size={14} />
                <span>新对话</span>
              </button>
              <button className="chat-icon-btn" onClick={handleExport} title="导出 Markdown">
                <Download size={14} />
                <span>导出</span>
              </button>
            </>
          )}
        </div>

        {/* Messages */}
        <main className="chat-main">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-glow" />
              <DaoLogo className="chat-welcome-logo" />
              <h1 className="chat-welcome-title">道衍</h1>
              <p className="chat-welcome-quote">「万物负阴而抱阳，中气以为和。」</p>
              <p className="chat-welcome-source">— 帛书《道德经》四十二章</p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chat-suggestion" onClick={() => sendMessage(s)}>
                    <MessageCircle size={13} />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-row chat-row-${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <div className="chat-avatar chat-avatar-ai">
                      <DaoLogo className="chat-avatar-logo" />
                    </div>
                  ) : (
                    <div className="chat-avatar chat-avatar-user">人</div>
                  )}
                  <div className={`chat-bubble chat-bubble-${msg.role}`}>
                    {msg.role === 'assistant' && !msg.content && msg.isStreaming ? (
                      <div className="chat-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : (
                      <>
                        {msg.role === 'assistant' ? (
                          <div className="chat-md">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="chat-bubble-text">{msg.content}</div>
                        )}
                        {msg.isStreaming && <span className="chat-cursor" />}
                        {msg.role === 'assistant' && (
                          <MessageFeedback
                            index={i}
                            content={msg.content}
                            isStreaming={msg.isStreaming ?? false}
                            currentRating={getFeedback(i)}
                            onRate={submitFeedback}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {error && (
                <div className="chat-error">
                  <span>{error}</span>
                  <button onClick={dismissError} aria-label="关闭">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <footer className="chat-footer">
          <form className="chat-input-wrap" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="向道衍提问… (Enter 发送，Shift+Enter 换行)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            {isLoading ? (
              <button
                type="button"
                className="chat-send-btn chat-stop-btn"
                onClick={stopStreaming}
                title="停止"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!input.trim()}
                title="发送"
              >
                <Send size={16} />
              </button>
            )}
          </form>
          <p className="chat-footer-note">道衍基于帛书《道德经》智慧，由 GLM 5 驱动</p>
        </footer>
      </div>
    </div>
  )
}
