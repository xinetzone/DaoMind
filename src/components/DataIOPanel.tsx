import React, { useRef, useState } from 'react'
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import type { Session } from '../hooks/useSessions'
import { exportSessions, parseImportFile } from '../hooks/useDataIO'

type ImportMode = 'merge' | 'replace'

interface Feedback {
  type: 'success' | 'error'
  text: string
}

interface Props {
  sessions: Session[]
  onReplace: (s: Session[]) => void
  onMerge: (s: Session[]) => void
}

export function DataIOPanel({ sessions, onReplace, onMerge }: Props): React.JSX.Element {
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [importing, setImporting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showFeedback(f: Feedback): void {
    setFeedback(f)
    setTimeout(() => setFeedback(null), 3500)
  }

  function handleExport(): void {
    if (sessions.length === 0) {
      showFeedback({ type: 'error', text: '暂无会话数据可导出' })
      return
    }
    exportSessions(sessions)
    showFeedback({ type: 'success', text: `已导出 ${sessions.length} 条会话` })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const imported = await parseImportFile(file)
      if (importMode === 'replace') {
        onReplace(imported)
        showFeedback({ type: 'success', text: `已覆盖，导入 ${imported.length} 条会话` })
      } else {
        onMerge(imported)
        showFeedback({ type: 'success', text: `已合并，新增 ${imported.length} 条（跳过重复）` })
      }
    } catch (err) {
      showFeedback({ type: 'error', text: err instanceof Error ? err.message : '导入失败' })
    } finally {
      setImporting(false)
      // Reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="data-io-panel">
      <h3 className="data-io-title">
        <Download size={14} />
        数据备份与还原
      </h3>

      <div className="data-io-sections">
        {/* Export */}
        <div className="data-io-section">
          <p className="data-io-section-label">导出备份</p>
          <p className="data-io-section-desc">将所有会话下载为 JSON 文件，可用于备份或迁移</p>
          <button className="data-io-btn export" onClick={handleExport}>
            <Download size={14} />
            导出 {sessions.length > 0 ? `${sessions.length} 条会话` : '(无数据)'}
          </button>
        </div>

        <div className="data-io-divider" />

        {/* Import */}
        <div className="data-io-section">
          <p className="data-io-section-label">导入恢复</p>
          <p className="data-io-section-desc">选择之前导出的 JSON 文件进行恢复</p>

          {/* Mode toggle */}
          <div className="data-io-mode-group">
            <button
              className={`data-io-mode-btn${importMode === 'merge' ? ' active' : ''}`}
              onClick={() => setImportMode('merge')}
            >
              合并
            </button>
            <button
              className={`data-io-mode-btn${importMode === 'replace' ? ' active' : ''}`}
              onClick={() => setImportMode('replace')}
            >
              覆盖
            </button>
          </div>
          <p className="data-io-mode-hint">
            {importMode === 'merge'
              ? '新会话追加到现有数据，重复 ID 跳过'
              : '清除所有现有会话，完全替换为文件中的数据'}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="data-io-file-input"
            onChange={handleFileChange}
            disabled={importing}
          />
          <button
            className="data-io-btn import"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={14} />
            {importing ? '导入中…' : '选择文件导入'}
          </button>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className={`data-io-feedback ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {feedback.text}
        </div>
      )}
    </div>
  )
}
