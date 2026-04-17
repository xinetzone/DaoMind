import React, { useState, useEffect } from "react";
import { DaoLogo } from "./components/DaoLogo";
import { ChatPage } from "./pages/ChatPage";
import { DocsPage } from "./pages/DocsPage";
import { NAV_SECTIONS } from "./data/navigation";

// ── Hash routing helpers ────────────────────────────────────

type PageState = { type: "chat" } | { type: "docs"; docPath: string };

function getPageState(): PageState {
  const hash = window.location.hash; // e.g. '#docs/guide/getting-started'
  if (hash.startsWith("#docs")) {
    const docPath = hash.slice(5) || "/guide/getting-started";
    return { type: "docs", docPath };
  }
  return { type: "chat" };
}

function navigateDocs(docPath: string): void {
  window.location.hash = `docs${docPath}`;
}

function navigateChat(): void {
  window.location.hash = "chat";
}

// ── App ─────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const [pageState, setPageState] = useState<PageState>(getPageState);

  useEffect(() => {
    const handler = (): void => setPageState(getPageState());
    window.addEventListener("hashchange", handler);
    return (): void => window.removeEventListener("hashchange", handler);
  }, []);

  const isOnDocs = pageState.type === "docs";
  const activeDocPath = isOnDocs ? pageState.docPath : "";

  const activeSection = NAV_SECTIONS.find((s) =>
    activeDocPath
      ? s.items.some((item) => item.path === activeDocPath) ||
        activeDocPath.startsWith(`/${s.key}`)
      : false
  );

  return (
    <div className="app">
      {/* ── TopNav ──────────────────────────────────────────── */}
      <nav className="app-nav">
        <button className="app-nav-brand" onClick={navigateChat}>
          <DaoLogo className="app-nav-logo" />
          <span className="app-nav-brand-name">DaoMind</span>
          <span className="app-nav-brand-dot">·</span>
          <span className="app-nav-brand-sub">Modulux</span>
        </button>

        <div className="app-nav-links">
          {NAV_SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`app-nav-link ${
                isOnDocs && activeSection?.key === section.key ? "active" : ""
              }`}
              onClick={() => navigateDocs(section.defaultPath)}
            >
              {section.text}
            </button>
          ))}
        </div>

        <button
          className={`app-nav-chat-btn ${!isOnDocs ? "active" : ""}`}
          onClick={navigateChat}
        >
          <DaoLogo className="app-nav-chat-logo" />
          <span>道衍</span>
        </button>
      </nav>

      {/* ── Page content ────────────────────────────────────── */}
      <div className="app-content">
        {isOnDocs ? (
          <DocsPage docPath={activeDocPath} onNavigate={navigateDocs} />
        ) : (
          <ChatPage />
        )}
      </div>
    </div>
  );
}
