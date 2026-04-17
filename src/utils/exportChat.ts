/**
 * exportChat — 道问 · 对话导出工具
 *
 * 帛书《道德经》乙本·十六章：「知常容，容乃公，公乃王，王乃天」
 * 将当前会话导出为可持久保存的 Markdown 文件，含反馈评分标注。
 */

import type { Message } from '../hooks/useAIChat'
import type { FeedbackRating } from '../hooks/useFeedback'

export interface ExportOptions {
  sessionId: string
  sessionTitle: string
  messages: Message[]
  getFeedback: (index: number) => FeedbackRating | null
}

/** 格式化时间戳为 YYYY-MM-DD HH:mm:ss */
function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

/** 反馈评分文字标注 */
function ratingLabel(rating: FeedbackRating | null): string {
  if (rating === 'up') return ' `[有帮助]`'
  if (rating === 'down') return ' `[待改善]`'
  return ''
}

/** 构建 Markdown 字符串 */
export function buildMarkdown(opts: ExportOptions): string {
  const { sessionId, sessionTitle, messages, getFeedback } = opts
  const now = formatDate(Date.now())
  const userMsgs = messages.filter((m) => m.role === 'user').length
  const aiMsgs = messages.filter((m) => m.role === 'assistant').length

  const lines: string[] = [
    '# 道衍 · 对话导出',
    '',
    `**会话标题：** ${sessionTitle}`,
    `**导出时间：** ${now}`,
    `**会话 ID：** ${sessionId}`,
    `**消息数量：** 用户 ${userMsgs} 条 · 道衍 ${aiMsgs} 条`,
    '',
    '---',
    '',
    '## 对话内容',
    '',
  ]

  messages.forEach((msg, i) => {
    if (msg.isStreaming) return // 跳过未完成的消息
    if (msg.role === 'user') {
      lines.push('### 用户', '', msg.content, '')
    } else {
      const rating = ratingLabel(getFeedback(i))
      lines.push(`### 道衍 AI${rating}`, '', msg.content, '')
    }
    lines.push('---', '')
  })

  // 移除最后多余的 ---
  while (lines.length > 0 && (lines[lines.length - 1] === '---' || lines[lines.length - 1] === '')) {
    lines.pop()
  }

  lines.push(
    '',
    '---',
    '',
    '*由 DaoMind 道衍 AI 生成 · 基于帛书《道德经》智慧*',
  )

  return lines.join('\n')
}

/** 触发浏览器下载 Markdown 文件 */
export function downloadMarkdown(opts: ExportOptions): void {
  const md = buildMarkdown(opts)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const safe = opts.sessionTitle.replace(/[\\/:*?"<>|]/g, '-').slice(0, 24)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `daomind-${safe}-${date}.md`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
