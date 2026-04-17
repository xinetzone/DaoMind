import React, { useMemo } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { MindNode } from '../hooks/useMindMap'

// ── SVG Tree Layout ──────────────────────────────────────────

const NODE_W = 120
const NODE_H = 32
const H_GAP = 60  // horizontal gap between levels
const V_GAP = 14  // vertical gap between sibling nodes

interface LayoutNode {
  node: MindNode
  x: number
  y: number
  cx: number // center x
  cy: number // center y
}

interface LayoutResult {
  nodes: LayoutNode[]
  edges: Array<{ x1: number; y1: number; x2: number; y2: number }>
  totalHeight: number
  totalWidth: number
}

function countLeaves(node: MindNode): number {
  if (node.children.length === 0) return 1
  return node.children.reduce((s, c) => s + countLeaves(c), 0)
}

function layoutTree(root: MindNode): LayoutResult {
  const nodes: LayoutNode[] = []
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

  function place(node: MindNode, depth: number, yOffset: number): number {
    const leaves = countLeaves(node)
    const blockH = leaves * (NODE_H + V_GAP) - V_GAP
    const x = depth * (NODE_W + H_GAP) + 20
    const cy = yOffset + blockH / 2
    const y = cy - NODE_H / 2

    nodes.push({ node, x, y, cx: x + NODE_W / 2, cy })

    let childY = yOffset
    for (const child of node.children) {
      const childLeaves = countLeaves(child)
      const childBlockH = childLeaves * (NODE_H + V_GAP) - V_GAP
      const childCy = childY + childBlockH / 2
      const childX = (depth + 1) * (NODE_W + H_GAP) + 20

      edges.push({
        x1: x + NODE_W,
        y1: cy,
        x2: childX,
        y2: childCy,
      })

      place(child, depth + 1, childY)
      childY += childLeaves * (NODE_H + V_GAP)
    }
    return blockH
  }

  const totalH = countLeaves(root) * (NODE_H + V_GAP) - V_GAP + 40
  const maxDepth = getDepth(root)
  const totalW = (maxDepth + 1) * (NODE_W + H_GAP) + 40

  place(root, 0, 20)
  return { nodes, edges, totalHeight: totalH, totalWidth: totalW }
}

function getDepth(node: MindNode): number {
  if (node.children.length === 0) return 0
  return 1 + Math.max(...node.children.map(getDepth))
}

const LEVEL_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--text-muted)', 'var(--border-strong)']
const LEVEL_TEXT_COLORS = ['#fff', '#fff', 'var(--text)', 'var(--text)']

function depthOf(node: MindNode, target: MindNode, d = 0): number {
  if (node === target) return d
  for (const c of node.children) {
    const r = depthOf(c, target, d + 1)
    if (r >= 0) return r
  }
  return -1
}

// ── SVG MindMap Component ──────────────────────────────────────

interface SvgMindMapProps {
  tree: MindNode
}

function SvgMindMap({ tree }: SvgMindMapProps): React.JSX.Element {
  const layout = useMemo(() => layoutTree(tree), [tree])

  return (
    <svg
      width={layout.totalWidth}
      height={layout.totalHeight}
      className="mindmap-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Edges */}
      {layout.edges.map((e, i) => {
        const mx = (e.x1 + e.x2) / 2
        return (
          <path
            key={i}
            d={`M${e.x1},${e.y1} C${mx},${e.y1} ${mx},${e.y2} ${e.x2},${e.y2}`}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}

      {/* Nodes */}
      {layout.nodes.map((ln, i) => {
        const depth = depthOf(tree, ln.node)
        const bg = LEVEL_COLORS[Math.min(depth, LEVEL_COLORS.length - 1)]
        const textColor = LEVEL_TEXT_COLORS[Math.min(depth, LEVEL_TEXT_COLORS.length - 1)]
        const isRoot = depth === 0

        return (
          <g key={i}>
            <rect
              x={ln.x}
              y={ln.y}
              width={NODE_W}
              height={NODE_H}
              rx={isRoot ? 10 : 6}
              ry={isRoot ? 10 : 6}
              fill={bg}
              opacity={isRoot ? 1 : depth === 1 ? 0.85 : 0.65}
            />
            <text
              x={ln.cx}
              y={ln.cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isRoot ? 13 : 12}
              fontWeight={isRoot ? '700' : '500'}
              fill={textColor}
              fontFamily="'Inter', sans-serif"
            >
              {ln.node.text}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Modal ──────────────────────────────────────────────────────

interface MindMapModalProps {
  tree: MindNode | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function MindMapModal({ tree, loading, error, onClose }: MindMapModalProps): React.JSX.Element {
  return (
    <div className="mindmap-overlay" onClick={onClose}>
      <div className="mindmap-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mindmap-header">
          <span className="mindmap-title">道象 · 思维导图</span>
          <button className="mindmap-close" onClick={onClose} title="关闭">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="mindmap-body">
          {loading && (
            <div className="mindmap-center">
              <Loader2 size={28} className="mindmap-spinner" />
              <span className="mindmap-hint">正在提炼对话主题…</span>
            </div>
          )}
          {error && !loading && (
            <div className="mindmap-center mindmap-error">
              <span>{error}</span>
            </div>
          )}
          {tree && !loading && (
            <div className="mindmap-scroll">
              <SvgMindMap tree={tree} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
