import type { Session } from './useSessions'

interface BackupPayload {
  version: number
  exportedAt: number
  sessions: Session[]
}

/** 将 sessions 序列化为 JSON 并触发浏览器下载 */
export function exportSessions(sessions: Session[]): void {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    sessions,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `daomind-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 读取 File，解析为 Session[] */
export async function parseImportFile(file: File): Promise<Session[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string
        const parsed = JSON.parse(raw) as unknown

        // Support both wrapped { version, sessions } and raw array formats
        let sessions: unknown[]
        if (Array.isArray(parsed)) {
          sessions = parsed
        } else if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'sessions' in parsed &&
          Array.isArray((parsed as Record<string, unknown>).sessions)
        ) {
          sessions = (parsed as BackupPayload).sessions
        } else {
          reject(new Error('格式无效：缺少 sessions 字段'))
          return
        }

        // Basic shape validation
        const valid = sessions.filter(
          (s) =>
            s !== null &&
            typeof s === 'object' &&
            typeof (s as Record<string, unknown>).id === 'string' &&
            Array.isArray((s as Record<string, unknown>).messages),
        ) as Session[]

        if (valid.length === 0) {
          reject(new Error('未找到有效会话数据'))
          return
        }
        resolve(valid)
      } catch {
        reject(new Error('JSON 解析失败，请检查文件格式'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}
