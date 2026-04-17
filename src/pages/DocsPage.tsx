import React, { useMemo, useRef, useEffect } from 'react'
import { DocSidebar } from '../components/DocSidebar'
import { MystRenderer } from '../components/MystRenderer'
import { pathToGlobKey, getSectionForPath } from '../data/navigation'

// Load all docs/site markdown at build time as raw strings
const allDocs = import.meta.glob('/docs/site/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

interface DocsPageProps {
  docPath: string
  onNavigate: (path: string) => void
}

export function DocsPage({ docPath, onNavigate }: DocsPageProps): React.JSX.Element {
  const currentSection = useMemo(() => getSectionForPath(docPath), [docPath])
  const scrollRef = useRef<HTMLElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [docPath])

  const content = useMemo(() => {
    const key = pathToGlobKey(docPath)
    return (
      allDocs[key] ??
      `# 页面不存在\n\n找不到路径 \`${docPath}\` 对应的文档页面。\n\n请通过左侧导航选择一个页面。`
    )
  }, [docPath])

  return (
    <div className="docs-layout">
      <DocSidebar currentPath={docPath} currentSection={currentSection} onNavigate={onNavigate} />
      <main className="docs-content" ref={scrollRef}>
        <MystRenderer content={content} onNavigate={onNavigate} />
      </main>
    </div>
  )
}
