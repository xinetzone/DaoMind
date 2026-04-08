import type { VerificationReport, VerificationResult, VerificationCategory, PhilosophyAssessment } from './types.js';
import { VERIFICATION_CATEGORY_LABELS } from './types.js';
import { daoCheckWuYouBalance } from './checks/wu-you-balance.js';
import { daoCheckFeedbackIntegrity } from './checks/feedback-integrity.js';
import { daoCheckQiFluency } from './checks/qi-fluency.js';
import { daoCheckYinYangBalance } from './checks/yin-yang-balance.js';
import { daoCheckWuWeiVerification } from './checks/wu-wei-verification.js';
import { daoCheckNamingConvention } from './checks/naming-convention.js';

type CheckFn = (projectRoot: string) => Promise<VerificationResult>;

const CHECK_REGISTRY: ReadonlyMap<VerificationCategory, { fn: CheckFn; label: string }> = new Map([
  ['wu-you-balance', { fn: daoCheckWuYouBalance, label: '有无平衡' }],
  ['feedback-integrity', { fn: daoCheckFeedbackIntegrity, label: '反馈完整性' }],
  ['qi-fluency', { fn: daoCheckQiFluency, label: '气流通畅性' }],
  ['yin-yang-balance', { fn: daoCheckYinYangBalance, label: '阴阳平衡' }],
  ['wu-wei-verification', { fn: daoCheckWuWeiVerification, label: '无为验证' }],
  ['naming-convention', { fn: daoCheckNamingConvention, label: '命名规范' }],
]);

function computePhilosophyDepth(results: ReadonlyArray<VerificationResult>): PhilosophyAssessment {
  const resultMap = new Map(results.map((r) => [r.category, r.score]));

  const getScore = (cat: VerificationCategory) => resultMap.get(cat) ?? 0;

  const ontologyScore = Math.round(
    (getScore('wu-you-balance') * 0.4 + getScore('yin-yang-balance') * 0.35 + getScore('architecture-depth') * 0.25)
  );
  const epistemologyScore = Math.round(
    (getScore('feedback-integrity') * 0.4 + getScore('naming-convention') * 0.35 + getScore('qi-fluency') * 0.25)
  );
  const methodologyScore = Math.round(
    (getScore('wu-wei-verification') * 0.4 + getScore('qi-fluency') * 0.3 + getScore('feedback-integrity') * 0.3)
  );
  const ethicsScore = Math.round(
    (getScore('naming-convention') * 0.4 + getScore('wu-wei-verification') * 0.35 + getScore('yin-yang-balance') * 0.25)
  );
  const aestheticsScore = Math.round(
    (getScore('naming-convention') * 0.3 + getScore('yin-yang-balance') * 0.3 + getScore('qi-fluency') * 0.2 + getScore('wu-you-balance') * 0.2)
  );
  const culturalScore = Math.round(
    (getScore('wu-you-balance') * 0.25 + getScore('yin-yang-balance') * 0.25 + getScore('wu-wei-verification') * 0.2 + getScore('feedback-integrity') * 0.15 + getScore('naming-convention') * 0.15)
  );

  const weightedTotal = Math.round(
    ontologyScore * 0.22 +
    epistemologyScore * 0.18 +
    methodologyScore * 0.20 +
    ethicsScore * 0.15 +
    aestheticsScore * 0.12 +
    culturalScore * 0.13
  );

  return {
    ontologyScore,
    epistemologyScore,
    methodologyScore,
    ethicsScore,
    aestheticsScore,
    culturalScore,
    weightedTotal,
  };
}

export class DaoVerificationReporter {
  async runAllChecks(projectRoot: string): Promise<VerificationReport> {
    const checks = Array.from(CHECK_REGISTRY.values());
    const results = await Promise.all(checks.map((c) => c.fn(projectRoot)));
    return this.buildReport(results);
  }

  async runCategory(category: VerificationCategory, projectRoot: string): Promise<VerificationReport> {
    if (category === 'overall') {
      return this.runAllChecks(projectRoot);
    }

    const entry = CHECK_REGISTRY.get(category);
    if (!entry) {
      const emptyResults: VerificationResult[] = [{
        name: `未知类别: ${category}`,
        category,
        passed: false,
        score: 0,
        details: `未注册的检验类别: ${category}`,
        timestamp: Date.now(),
      }];
      return this.buildReport(emptyResults);
    }

    const result = await entry.fn(projectRoot);
    return this.buildReport([result]);
  }

  private buildReport(results: ReadonlyArray<VerificationResult>): VerificationReport {
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;
    const overallScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    const warnings: string[] = [];
    for (const r of results) {
      if (!r.passed && r.recommendation) {
        warnings.push(`[${VERIFICATION_CATEGORY_LABELS[r.category] ?? r.category}] ${r.recommendation}`);
      }
      if (r.passed && r.score < 80) {
        warnings.push(`[${VERIFICATION_CATEGORY_LABELS[r.category] ?? r.category}] 得分 ${r.score}，有改进空间`);
      }
    }

    return {
      generatedAt: Date.now(),
      results,
      overallScore,
      passedCount,
      failedCount,
      warnings,
      philosophyDepth: computePhilosophyDepth(results),
    };
  }

  generateMarkdown(report: VerificationReport): string {
    const lines: string[] = [];
    lines.push('# 道宇宙 · 哲学一致性检验报告');
    lines.push('');
    lines.push(`> **生成时间**: ${new Date(report.generatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    lines.push(`> **综合得分**: **${report.overallScore}** / 100`);
    lines.push(`> **通过/失败**: ✅ ${report.passedCount} / ❌ ${report.failedCount}`);
    lines.push('');

    lines.push('## 哲学深度评估');
    lines.push('');
    const pd = report.philosophyDepth;
    lines.push(`| 维度 | 得分 | 说明 |`);
    lines.push(`|------|------|------|`);
    lines.push(`| 本体论一致性 | ${pd.ontologyScore} | 有无相生、阴阳调和的程度 |`);
    lines.push(`| 认识论完备性 | ${pd.epistemologyScore} | 反馈循环与知识表达的完整性 |`);
    lines.push(`| 方法论有效性 | ${pd.methodologyScore} | 无为而治与气机流转的实现质量 |`);
    lines.push(`| 伦理学正当性 | ${pd.ethicsScore} | 命名规范与非暴力原则的遵循度 |`);
    lines.push(`| 美学价值 | ${pd.aestheticsScore} | 架构和谐性与自然意象的使用 |`);
    lines.push(`| 文化传承 | ${pd.culturalScore} | 帛书《道德经》思想的忠实体现 |`);
    lines.push(`| **加权总分** | **${pd.weightedTotal}** | 六维加权综合评估 |`);
    lines.push('');

    lines.push('## 检验详情');
    lines.push('');

    for (const r of report.results) {
      const statusIcon = r.passed ? '✅' : '❌';
      const categoryLabel = VERIFICATION_CATEGORY_LABELS[r.category] ?? r.category;
      lines.push(`### ${statusIcon} ${r.name}（${categoryLabel}）— 得分: ${r.score}`);
      lines.push('');
      lines.push(`<details>`);
      lines.push(`<summary>点击展开详情</summary>`);
      lines.push('');
      lines.push(r.details.split('\n').map((l) => `> ${l}`).join('\n'));
      if (r.recommendation) {
        lines.push('');
        lines.push(`**建议**: ${r.recommendation}`);
      }
      lines.push('');
      lines.push(`</details>`);
      lines.push('');
    }

    if (report.warnings.length > 0) {
      lines.push('## ⚠️ 警告与建议');
      lines.push('');
      for (const w of report.warnings) {
        lines.push(`- ${w}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push(`*报告由 @dao/verify 自动生成 — 帛书《道德经》哲学一致性检验工具*`);

    return lines.join('\n');
  }

  generateJson(report: VerificationReport): string {
    return JSON.stringify(report, null, 2);
  }
}
