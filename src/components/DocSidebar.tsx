import React from "react";
import { ChevronRight } from "lucide-react";
import { NAV_SECTIONS } from "../data/navigation";
import type { NavSection } from "../data/navigation";

interface DocSidebarProps {
  currentPath: string;
  currentSection: NavSection | undefined;
  onNavigate: (path: string) => void;
}

export function DocSidebar({
  currentPath,
  currentSection,
  onNavigate,
}: DocSidebarProps): React.JSX.Element {
  return (
    <aside className="doc-sidebar">
      {/* Section tabs */}
      <div className="doc-sidebar-tabs">
        {NAV_SECTIONS.map((section) => (
          <button
            key={section.key}
            className={`doc-sidebar-tab ${
              currentSection?.key === section.key ? "active" : ""
            }`}
            onClick={() => onNavigate(section.defaultPath)}
          >
            {section.text}
          </button>
        ))}
      </div>

      {/* Items for current section */}
      {currentSection && (
        <nav className="doc-sidebar-nav" aria-label={currentSection.text}>
          {currentSection.items.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.path.endsWith("/") &&
                currentPath === item.path.slice(0, -1));
            return (
              <button
                key={item.path}
                className={`doc-sidebar-item ${isActive ? "active" : ""}`}
                onClick={() => onNavigate(item.path)}
              >
                {isActive && (
                  <ChevronRight className="doc-sidebar-chevron" size={12} />
                )}
                <span>{item.text}</span>
              </button>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
