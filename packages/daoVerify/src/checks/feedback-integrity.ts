import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DaoVerificationResult, DaoVerificationCategory } from '../types.js';

const CATEGORY: DaoVerificationCategory = 'feedback-integrity';

const REQUIRED_STAGES = [
  'stage1-perceive.ts',
  'stage2-aggregate.ts',
  'stage3-harmonize.ts',
  'stage4-return.ts',
] as const;

const STAGE_LABELS: Record<string, string> = {
  'stage1-perceive.ts': '感知（观其妙）',
  'stage2-aggregate.ts': '聚合（大曰逝）',
  'stage3-harmonize.ts': '中和（中气以为和）',
  'stage4-return.ts': '归元（远曰反）',
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkLifecycleIntegratesStages(lifecyclePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(lifecyclePath, 'utf-8');
    return (
      content.includes('stage1') ||
      content.includes('perceive') ||
      content.includes('Perceiver')
    ) && (
      content.includes('stage4') ||
      content.includes('return') ||
      content.includes('Returner')
    );
  } catch {
    return false;
  }
}

export async function daoCheckFeedbackIntegrity(projectRoot: string): Promise<DaoVerificationResult> {
  const timestamp = Date.now();
  const feedbackSrc = path.join(projectRoot, 'packages', 'daoFeedback', 'src');
  const lifecyclePath = path.join(feedbackSrc, 'lifecycle.ts');

  const feedbackExists = await fileExists(feedbackSrc);
  const lifecycleExists = await fileExists(lifecyclePath);

  if (!feedbackExists) {
    return {
      name: '反馈完整性检验',
      category: CATEGORY,
      passed: false,
      score: 0,
      details: '@dao/feedback 包不存在，无法执行反馈完整性检验',
      recommendation: '请创建 @dao/feedback 包并实现四阶段反馈循环',
      timestamp,
    };
  }

  const stageResults: Array<{ file: string; label: string; exists: boolean }> = [];
  let existingStages = 0;

  for (const stage of REQUIRED_STAGES) {
    const stagePath = path.join(feedbackSrc, stage);
    const exists = await fileExists(stagePath);
    stageResults.push({ file: stage, label: STAGE_LABELS[stage] ?? stage, exists });
    if (exists) existingStages++;
  }

  const lifecycleIntegrates = lifecycleExists
    ? await checkLifecycleIntegratesStages(lifecyclePath)
    : false;

  const stageScore = (existingStages / REQUIRED_STAGES.length) * 60;
  const lifecycleBonus = lifecycleIntegrates ? 25 : 0;
  const completenessBonus = existingStages === REQUIRED_STAGES.length ? 15 : 0;
  const score = Math.round(stageScore + lifecycleBonus + completenessBonus);

  const passed = existingStages === REQUIRED_STAGES.length && lifecycleIntegrates;

  let details = `@dao/feedback 包存在，四阶段检查结果：\n`;
  for (const r of stageResults) {
    details += `  · ${r.label} (${r.file}): ${r.exists ? '✓ 已实现' : '✗ 缺失'}\n`;
  }
  details += `  · lifecycle.ts 阶段串联: ${lifecycleExists ? (lifecycleIntegrates ? '✓ 完整串联' : '⚠ 存在但未完整串联') : '✗ 缺失'}\n`;
  details += `\n  帛书依据：《道德经》乙本·四十章「反也者，道之动也」— 反馈循环是道的运动形式`;

  let recommendation: string | undefined;
  if (!passed) {
    const missing = stageResults.filter((r) => !r.exists).map((r) => r.label);
    if (missing.length > 0) {
      recommendation = `缺失阶段: ${missing.join('、')}。请按感知→聚合→中和→归元的顺序补全实现`;
    }
    if (!lifecycleIntegrates && lifecycleExists) {
      recommendation = (recommendation ?? '') + ' lifecycle.ts 未完整串联所有阶段，请在 submit() 方法中调用全部四个阶段';
    }
  }

  return {
    name: '反馈完整性检验',
    category: CATEGORY,
    passed,
    score,
    details,
    recommendation,
    timestamp,
  };
}
