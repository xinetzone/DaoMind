import React, { useEffect, useRef } from 'react'
import { X, Download, Share2 } from 'lucide-react'
import type { Message } from '../hooks/useAIChat'

interface Props {
  sessionTitle: string
  messages: Message[]
  onClose: () => void
}

// Strip common markdown for plain canvas text
function stripMd(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '[代码块]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Word-wrap a string to fit maxWidth, returns array of lines
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(''); continue }
    let current = ''
    for (const char of para) {
      const test = current + char
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = char
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

// Draw the share card onto a canvas
function drawCard(
  canvas: HTMLCanvasElement,
  title: string,
  messages: Message[],
): void {
  const W = 600
  const H = 820
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── Background ──────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0d1028')
  bg.addColorStop(0.55, '#141830')
  bg.addColorStop(1, '#1c204a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // ── Decorative circles (yin-yang motif) ─────────────────────
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = '#5468c8'
  ctx.lineWidth = 60
  ctx.beginPath(); ctx.arc(W + 40, 100, 220, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(W + 10, 520, 150, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = 0.04
  ctx.lineWidth = 80
  ctx.beginPath(); ctx.arc(-40, H - 60, 200, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  // ── Top accent line ─────────────────────────────────────────
  const topLine = ctx.createLinearGradient(0, 0, W, 0)
  topLine.addColorStop(0, '#5468c8')
  topLine.addColorStop(0.5, '#7080d8')
  topLine.addColorStop(1, 'transparent')
  ctx.fillStyle = topLine
  ctx.fillRect(0, 0, W, 3)

  // ── DaoLogo (simplified SVG path via canvas) ─────────────────
  const lx = 40, ly = 40, lr = 20
  ctx.save()
  ctx.strokeStyle = '#7080d8'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#7080d8'
  // outer circle
  ctx.beginPath(); ctx.arc(lx + lr, ly + lr, lr, 0, Math.PI * 2); ctx.stroke()
  // S-curve
  ctx.beginPath()
  ctx.moveTo(lx + lr, ly)
  ctx.bezierCurveTo(lx + 4, ly + 9, lx + lr * 2 - 4, ly + lr + 7, lx + lr, ly + lr * 2)
  ctx.stroke()
  // top dot (filled)
  ctx.beginPath(); ctx.arc(lx + lr, ly + 7, 3.5, 0, Math.PI * 2); ctx.fill()
  // bottom dot (outline)
  ctx.beginPath(); ctx.arc(lx + lr, ly + lr * 2 - 7, 3.5, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  // ── Brand name ───────────────────────────────────────────────
  ctx.fillStyle = '#e8eaf6'
  ctx.font = 'bold 22px "PingFang SC", "Noto Sans SC", system-ui, sans-serif'
  ctx.fillText('道衍', 80, 60)
  ctx.fillStyle = '#9aa0c4'
  ctx.font = '13px "PingFang SC", system-ui, sans-serif'
  ctx.fillText('DaoMind · 道家智慧 AI', 80, 80)

  // ── Date top-right ───────────────────────────────────────────
  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  ctx.fillStyle = '#6b72a8'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(dateStr, W - 40, 62)
  ctx.textAlign = 'left'

  // ── Divider ──────────────────────────────────────────────────
  const div1 = ctx.createLinearGradient(40, 0, W - 40, 0)
  div1.addColorStop(0, 'rgba(84,104,200,0.6)')
  div1.addColorStop(0.5, 'rgba(84,104,200,0.2)')
  div1.addColorStop(1, 'transparent')
  ctx.fillStyle = div1
  ctx.fillRect(40, 104, W - 80, 1)

  // ── Session title ────────────────────────────────────────────
  ctx.fillStyle = '#e8eaf6'
  ctx.font = 'bold 17px "PingFang SC", "Noto Sans SC", system-ui, sans-serif'
  const displayTitle = title.length > 28 ? title.slice(0, 28) + '…' : title
  ctx.fillText(displayTitle, 40, 138)

  // ── Messages ─────────────────────────────────────────────────
  // Pick last 4 non-streaming messages
  const msgs = messages
    .filter((m) => !m.isStreaming)
    .slice(-4)

  const PAD = 40
  const BPAD = 14
  const BINNER = 12
  const maxMsgW = W - PAD * 2
  let curY = 164

  for (const msg of msgs) {
    if (curY > H - 120) break
    const isUser = msg.role === 'user'

    // Bubble colors
    const bubbleBg = isUser
      ? ctx.createLinearGradient(PAD, curY, PAD + maxMsgW, curY + 60)
      : null
    if (bubbleBg) {
      bubbleBg.addColorStop(0, '#3a4498')
      bubbleBg.addColorStop(1, '#2e3a88')
    }

    // Role label
    ctx.fillStyle = isUser ? '#9aa0c4' : '#7aaa98'
    ctx.font = `bold 11px system-ui, sans-serif`
    ctx.fillText(isUser ? '提问' : '道衍', PAD, curY)
    curY += 16

    // Prepare text
    const raw = stripMd(msg.content)
    const preview = raw.length > 180 ? raw.slice(0, 180) + '…' : raw
    ctx.font = `13.5px "PingFang SC", system-ui, sans-serif`
    const textW = maxMsgW - BPAD * 2 - BINNER * 2
    const lines = wrapText(ctx, preview, textW)
    const maxLines = 4
    const displayLines = lines.slice(0, maxLines)
    if (lines.length > maxLines) {
      displayLines[maxLines - 1] = displayLines[maxLines - 1].slice(0, -2) + '…'
    }

    const bubbleH = displayLines.length * 20 + BPAD * 2

    // Bubble background
    if (isUser) {
      ctx.save()
      ctx.fillStyle = 'rgba(84, 104, 200, 0.28)'
      roundRect(ctx, PAD, curY, maxMsgW, bubbleH, 10)
      ctx.fill()
      ctx.restore()
    } else {
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      roundRect(ctx, PAD, curY, maxMsgW, bubbleH, 10)
      ctx.fill()
      // left border
      ctx.fillStyle = '#7aaa98'
      ctx.fillRect(PAD, curY, 3, bubbleH)
      ctx.restore()
    }

    // Text
    ctx.fillStyle = isUser ? '#d8dcf4' : '#cdd5e4'
    ctx.font = `13.5px "PingFang SC", "Noto Sans SC", system-ui, sans-serif`
    displayLines.forEach((line, i) => {
      ctx.fillText(line, PAD + BPAD + BINNER, curY + BPAD + i * 20 + 13)
    })

    curY += bubbleH + 14
  }

  // ── Bottom bar ───────────────────────────────────────────────
  const div2 = ctx.createLinearGradient(40, 0, W - 40, 0)
  div2.addColorStop(0, 'rgba(84,104,200,0.6)')
  div2.addColorStop(1, 'transparent')
  ctx.fillStyle = div2
  ctx.fillRect(40, H - 60, W - 80, 1)

  ctx.fillStyle = '#6b72a8'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('道衍 · 帛书《道德经》智慧 AI', 40, H - 32)
  ctx.textAlign = 'right'
  ctx.fillText('daomind.app', W - 40, H - 32)
  ctx.textAlign = 'left'
}

// Helper: draw rounded rect path
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function ShareCardModal({ sessionTitle, messages, onClose }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      drawCard(canvasRef.current, sessionTitle, messages)
    }
  }, [sessionTitle, messages])

  const handleDownload = (): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `daomind-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="share-modal-title">
            <Share2 size={15} />
            <span>分享卡片</span>
          </div>
          <button className="share-modal-close" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>

        <div className="share-canvas-wrap">
          <canvas ref={canvasRef} className="share-canvas" />
        </div>

        <div className="share-modal-footer">
          <p className="share-modal-hint">卡片包含最近 4 条对话内容</p>
          <button className="share-download-btn" onClick={handleDownload}>
            <Download size={15} />
            <span>下载 PNG</span>
          </button>
        </div>
      </div>
    </div>
  )
}
