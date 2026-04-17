export interface NavItem {
  text: string;
  path: string;
}

export interface NavSection {
  key: string;
  text: string;
  defaultPath: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: "guide",
    text: "指南",
    defaultPath: "/guide/getting-started",
    items: [
      { text: "介绍", path: "/guide/" },
      { text: "快速开始", path: "/guide/getting-started" },
      { text: "核心概念", path: "/guide/concepts" },
      { text: "第一个示例", path: "/guide/first-example" },
      { text: "理解无名与有名", path: "/guide/nameless-named" },
      { text: "创建模块", path: "/guide/creating-modules" },
      { text: "Agent 系统", path: "/guide/agents" },
    ],
  },
  {
    key: "api",
    text: "API",
    defaultPath: "/api/",
    items: [
      { text: "API 概览", path: "/api/" },
      { text: "@daomind/nothing", path: "/api/nothing" },
      { text: "@daomind/anything", path: "/api/anything" },
      { text: "@daomind/agents", path: "/api/agents" },
    ],
  },
  {
    key: "examples",
    text: "示例",
    defaultPath: "/examples/",
    items: [
      { text: "示例概览", path: "/examples/" },
      { text: "Hello World", path: "/examples/hello-world" },
      { text: "Counter", path: "/examples/counter" },
      { text: "Todo List", path: "/examples/todo-list" },
    ],
  },
  {
    key: "faq",
    text: "FAQ",
    defaultPath: "/faq",
    items: [{ text: "常见问题", path: "/faq" }],
  },
];

/** Convert a doc path like '/guide/getting-started' → '/docs/site/guide/getting-started.md' */
export function pathToGlobKey(path: string): string {
  const withIndex = path.endsWith("/") ? `${path}index` : path;
  return `/docs/site${withIndex}.md`;
}

/** Find the NavSection that owns a given doc path */
export function getSectionForPath(docPath: string): NavSection | undefined {
  // Exact match in items first
  const byItem = NAV_SECTIONS.find((s) =>
    s.items.some(
      (item) => item.path === docPath || item.path === `${docPath}/`
    )
  );
  if (byItem) return byItem;
  // Fallback: path prefix match
  return NAV_SECTIONS.find((s) => docPath.startsWith(`/${s.key}`));
}
