import React, { useEffect, useRef } from "react";
import { Send, Square, RotateCcw, MessageCircle, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAIChat, SUPABASE_URL, SUPABASE_ANON_KEY } from "../hooks/useAIChat";
import { DaoLogo } from "../components/DaoLogo";

const SUGGESTIONS = [
  "帛书版与通行本《道德经》有哪些核心差异？",
  "「中气以为和」中，「中气」是什么含义？",
  "三才（天地人）思想在《道德经》中如何体现？",
  "如何将「无为」的智慧应用到现代生活中？",
];

export function ChatPage(): React.JSX.Element {
  const { messages, isLoading, error, sendMessage, stopStreaming, clearMessages, dismissError } =
    useAIChat();

  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-warm the Edge Function on mount to eliminate cold-start delay
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${SUPABASE_URL}/functions/v1/ai-chat-8c107efce1b0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ping: true }),
      signal: controller.signal,
    }).catch(() => {}); // fire-and-forget, ignore all errors
    return (): void => { controller.abort(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="chat-layout">
      {/* Sub-header: model tag + clear */}
      <div className="chat-subheader">
        <span className="chat-model-tag">GLM 5</span>
        {messages.length > 0 && (
          <button className="chat-icon-btn" onClick={clearMessages} title="新对话">
            <RotateCcw size={15} />
            <span>新对话</span>
          </button>
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
                {msg.role === "assistant" ? (
                  <div className="chat-avatar chat-avatar-ai">
                    <DaoLogo className="chat-avatar-logo" />
                  </div>
                ) : (
                  <div className="chat-avatar chat-avatar-user">人</div>
                )}
                <div className={`chat-bubble chat-bubble-${msg.role}`}>
                  {msg.role === "assistant" && !msg.content && msg.isStreaming ? (
                    <div className="chat-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <>
                      {msg.role === "assistant" ? (
                        <div className="chat-md">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="chat-bubble-text">{msg.content}</div>
                      )}
                      {msg.isStreaming && <span className="chat-cursor" />}
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
  );
}
