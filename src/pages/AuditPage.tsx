import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, BookOpen } from 'lucide-react'
import verifyResults from '../data/verify-results.json'

// Inline types (matches @daomind/verify shapes, no cross-package import needed)
interface VerifyResult {
  name: string
  category: string
  passed: boolean
  score: number
  details: string
  recommendation?: string
  timestamp: number
}
interface PhilosophyDepth {
  ontologyScore: number
  epistemologyScore: number
  methodologyScore: number
  ethicsScore: number
  aestheticsScore: number
  culturalScore: number
  weightedTotal: number
}
interface VerifyReport {
  generatedAt: number
  results: VerifyResult[]
  overallScore: number
  passedCount: number
  failedCount: number
  warnings: string[]
  philosophyDepth: PhilosophyDepth
}

const report = verifyResults as unknown as VerifyReport

const CATEGORY_LABELS: Record<string, string> = {
  'wu-you-balance': '有无平衡',
  'feedback-integrity': '反馈完整性',
  'qi-fluency': '气流通畅性',
  'yin-yang-balance': '阴阳平衡',
  'wu-wei-verification': '无为验证',
  'naming-convention': '命名规范',
}

const DEPTH_LABELS: Record<string, string> = {
  ontologyScore: '本体论',
  epistemologyScore: '认识论',
  methodologyScore: '方法论',
  ethicsScore: '伦理学',
  aestheticsScore: '美学',
  culturalScore: '文化维度',
}

function ScoreRing({ score }: { score: number }): React.JSX.Element {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#6b9080' : score >= 50 ? '#3b4eac' : '#dc2626'

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="audit-score-ring">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="55" y="50" textAnchor="middle" dominantBaseline="middle" className="audit-ring-score">
        {score}
      </text>
      <text x="55" y="67" textAnchor="middle" className="audit-ring-label">
        / 100
      </text>
    </svg>
  )
}

function ScoreBar({ score }: { score: number }): React.JSX.Element {
  const color = score >= 80 ? 'var(--secondary)' : score >= 50 ? 'var(--primary)' : '#dc2626'
  return (
    <div className="audit-score-bar-track">
      <div
        className="audit-score-bar-fill"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  )
}

// Render a text string with each checkmark highlighted in green
function renderWithChecks(text: string): React.ReactNode[] {
  const parts = text.split('\u2713')
  return parts.flatMap((part, i) =>
    i === 0
      ? [<React.Fragment key={i}>{part}</React.Fragment>]
      : [<span key={`c${i}`} className="audit-check">&#x2713;</span>, <React.Fragment key={`t${i}`}>{part}</React.Fragment>]
  )
}

// Structured detail renderer.
// details format uses \n\n between sections and '  · ' bullet prefix.
// Citation sections start with '帛书依据'
function DetailBody({ text }: { text: string }): React.JSX.Element {
  const sections = text.split('\n\n')

  return (
    <div className="audit-detail-body">
      {sections.map((section, si) => {
        const trimmed = section.trim()

        // Citation block
        if (trimmed.startsWith('\u5e1b\u4e66\u4f9d\u636e')) {
          const cite = trimmed.replace(/^\u5e1b\u4e66\u4f9d\u636e[\uff1a:]\s*/, '')
          return (
            <div key={si} className="audit-detail-citation">
              <BookOpen size={11} className="audit-citation-icon" />
              <span>{cite}</span>
            </div>
          )
        }

        // Regular section: first line = summary, remaining lines with · = bullets
        const lines = section.split('\n')
        const summaryLine = lines[0].trim()
        const bulletLines = lines.slice(1).filter(l => l.trim().startsWith('\u00b7'))

        return (
          <div key={si} className="audit-detail-section">
            {summaryLine && (
              <p className="audit-detail-summary">{renderWithChecks(summaryLine)}</p>
            )}
            {bulletLines.length > 0 && (
              <ul className="audit-detail-list">
                {bulletLines.map((line, li) => {
                  const content = line.replace(/^\s*\u00b7\s*/, '').trim()
                  return (
                    <li key={li} className="audit-detail-bullet">
                      {renderWithChecks(content)}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ResultCard({ result }: { result: VerifyResult }): React.JSX.Element {
  return (
    <div className={`audit-card ${result.passed ? 'passed' : 'failed'}`}>
      <div className="audit-card-header">
        <div className="audit-card-title">
          {result.passed ? (
            <CheckCircle size={15} className="audit-icon-pass" />
          ) : (
            <XCircle size={15} className="audit-icon-fail" />
          )}
          <span>{CATEGORY_LABELS[result.category] ?? result.name}</span>
        </div>
        <span className="audit-card-score">{result.score}</span>
      </div>
      <ScoreBar score={result.score} />
      <DetailBody text={result.details} />
      {result.recommendation && (
        <p className="audit-card-rec">
          <Info size={11} />
          {result.recommendation}
        </p>
      )}
    </div>
  )
}

export function AuditPage(): React.JSX.Element {
  const depth = report.philosophyDepth
  const depthEntries = Object.entries(depth).filter(([k]) => k !== 'weightedTotal')

  return (
    <div className="audit-layout">
      {/* top overview */}
      <div className="audit-overview">
        <div className="audit-overview-left">
          <ScoreRing score={report.overallScore} />
          <div className="audit-overview-stats">
            <div className="audit-stat">
              <span className="audit-stat-value pass">{report.passedCount}</span>
              <span className="audit-stat-label">通过</span>
            </div>
            <div className="audit-stat-divider" />
            <div className="audit-stat">
              <span className="audit-stat-value fail">{report.failedCount}</span>
              <span className="audit-stat-label">未通过</span>
            </div>
            <div className="audit-stat-divider" />
            <div className="audit-stat">
              <span className="audit-stat-value">{report.overallScore}</span>
              <span className="audit-stat-label">综合得分</span>
            </div>
          </div>
        </div>
        <div className="audit-overview-right">
          <div className="audit-overview-title">哲学深度评估</div>
          <div className="audit-depth-grid">
            {depthEntries.map(([key, val]) => (
              <div key={key} className="audit-depth-item">
                <span className="audit-depth-label">{DEPTH_LABELS[key] ?? key}</span>
                <div className="audit-depth-bar-wrap">
                  <div
                    className="audit-depth-bar"
                    style={{ width: `${val as number}%` }}
                  />
                </div>
                <span className="audit-depth-score">{val as number}</span>
              </div>
            ))}
          </div>
          <div className="audit-depth-total">
            加权总分：<strong>{depth.weightedTotal}</strong>
          </div>
        </div>
      </div>

      {/* warnings */}
      {report.warnings.length > 0 && (
        <div className="audit-warnings">
          {report.warnings.map((w, i) => (
            <div key={i} className="audit-warning-item">
              <AlertTriangle size={13} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* six check cards */}
      <div className="audit-cards">
        {report.results.map((r) => (
          <ResultCard key={r.category} result={r} />
        ))}
      </div>

      <p className="audit-footer-note">
        基于帛书《道德经》哲学一致性检验 · 生成于{' '}
        {new Date(report.generatedAt).toLocaleDateString('zh-CN')}
      </p>
    </div>
  )
}
