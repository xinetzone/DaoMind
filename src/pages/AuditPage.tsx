import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
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
      <p className="audit-card-detail">{result.details}</p>
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
      {/* ── 顶部总览 ── */}
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

      {/* ── 警告 ── */}
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

      {/* ── 六项检验卡片 ── */}
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
