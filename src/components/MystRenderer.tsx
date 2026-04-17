import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/tokyo-night-dark.css";
import type { Components } from "react-markdown";

/** Strip YAML/TOML front-matter from markdown */
function stripFrontmatter(content: string): string {
  return content
    .replace(/^---[\s\S]*?---\n?/, "")
    .replace(/^\+\+\+[\s\S]*?\+\+\+\n?/, "");
}

/** Convert MyST / VitePress ::: admonition directives into HTML divs */
function preprocessDirectives(md: string): string {
  return md.replace(
    /:{3,}\s*(note|warning|tip|important|caution|danger|info)\s*(.*?)\n([\s\S]*?):{3,}/g,
    (_: string, type: string, title: string, body: string) => {
      const titleHtml = title.trim()
        ? `<div class="admonition-title">${title.trim()}</div>`
        : "";
      return `<div class="admonition admonition-${type}">${titleHtml}

${body}

</div>
`;
    }
  );
}

interface MystRendererProps {
  content: string;
  onNavigate?: (path: string) => void;
}

export function MystRenderer({
  content,
  onNavigate,
}: MystRendererProps): React.JSX.Element {
  const processed = preprocessDirectives(stripFrontmatter(content));

  const components: Components = {
    pre({ children }) {
      const codeEl = React.Children.toArray(children)[0] as React.ReactElement<{ className?: string }>;
      const cls = (codeEl?.props?.className as string) ?? '';
      const langMatch = cls.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : '';
      return (
        <div className="doc-pre" data-lang={lang || undefined}>
          {children}
        </div>
      );
    },
    code({ className, children }) {
      if (className?.includes("hljs") || className?.startsWith("language-")) {
        return <code className={`doc-code-block ${className}`}>{children}</code>;
      }
      return <code className="doc-inline-code">{children}</code>;
    },
    table({ children }) {
      return (
        <div className="doc-table-wrap">
          <table className="doc-table">{children}</table>
        </div>
      );
    },
    blockquote({ children }) {
      return <blockquote className="doc-blockquote">{children}</blockquote>;
    },
    a({ href, children }) {
      if (href?.startsWith("/") && onNavigate) {
        return (
          <a
            className="doc-link"
            href={`#docs${href}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(href as string);
            }}
          >
            {children}
          </a>
        );
      }
      return (
        <a
          className="doc-link"
          href={href}
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="myst-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
