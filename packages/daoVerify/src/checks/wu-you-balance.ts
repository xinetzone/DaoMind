import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DaoVerificationResult, DaoVerificationCategory } from '../types.js';

const CATEGORY: DaoVerificationCategory = 'wu-you-balance';

async function countLines(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await countLines(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        total += content.split('\n').length;
      }
    }
  } catch {
    // 目录不存在时返回0
  }
  return total;
}

async function analyzeNothingContent(projectRoot: string): Promise<{ typeLines: number; totalLines: number }> {
  const nothingDir = path.join(projectRoot, 'packages', 'daoNothing', 'src');
  let typeLines = 0;
  let totalLines = 0;
  try {
    const entries = await fs.readdir(nothingDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.name.endsWith('.ts')) continue;
      const fullPath = path.join(nothingDir, entry.name);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      totalLines += lines;
      const typeKeywords = ['interface ', 'type ', 'enum ', 'export type', 'export interface'];
      const typeCount = typeKeywords.reduce((sum, kw) => sum + (content.match(new RegExp(kw, 'g'))?.length ?? 0), 0);
      typeLines += Math.min(typeCount * 3, lines);
    }
  } catch {
    // ignore
  }
  return { typeLines, totalLines };
}

export async function daoCheckWuYouBalance(projectRoot: string): Promise<DaoVerificationResult> {
  const timestamp = Date.now();
  const nothingDir = path.join(projectRoot, 'packages', 'daoNothing', 'src');
  const anythingDir = path.join(projectRoot, 'packages', 'daoAnything', 'src');

  const [nothingLines, anythingLines, nothingAnalysis] = await Promise.all([
    countLines(nothingDir),
    countLines(anythingDir),
    analyzeNothingContent(projectRoot),
  ]);

  const ratio = anythingLines > 0 ? nothingLines / anythingLines : 0;
  const minRatio = 1 / 8;
  const maxRatio = 1 / 3;
  const inRange = ratio >= minRatio && ratio <= maxRatio;

  let score = 0;
  let details = '';
  let recommendation: string | undefined;

  if (nothingLines === 0 && anythingLines === 0) {
    score = 0;
    details = `未找到 daoNothing 或 daoAnything 源码目录`;
    recommendation = '请确保 packages/daoNothing/src 和 packages/daoAnything/src 存在且包含 TypeScript 源文件';
  } else if (inRange) {
    const centerRatio = (minRatio + maxRatio) / 2;
    const deviation = Math.abs(ratio - centerRatio) / centerRatio;
    score = Math.round(Math.max(60, 100 - deviation * 80));
    details = `有无平衡检验通过。daoNothing: ${nothingLines} 行，daoAnything: ${anythingLines} 行，比值: ${(ratio).toFixed(3)}（合理范围 ${minRatio.toFixed(3)} ~ ${maxRatio.toFixed(3)}）`;
    details += `\n  · daoNothing 类型定义占比: ${nothingAnalysis.totalLines > 0 ? Math.round(nothingAnalysis.typeLines / nothingAnalysis.totalLines * 100) : 0}%`;
    if (score < 90) {
      recommendation = `当前比值接近边界，建议微调以使比值更接近中心值 ${(centerRatio).toFixed(3)}`;
    }
  } else if (ratio < minRatio) {
    score = Math.max(20, Math.round(50 * (ratio / minRatio)));
    details = `有无失衡：daoNothing 过轻。daoNothing: ${nothingLines} 行，daoAnything: ${anythingLines} 行，比值: ${(ratio).toFixed(3)}（低于下限 ${minRatio.toFixed(3)}）`;
    details += `\n  · 帛书依据："无，名天地之始"——无（类型/契约空间）应占据足够的架构比重`;
    recommendation = '建议增强 daoNothing 的类型定义、接口契约与约束规范，使无之空间更加充实';
  } else {
    score = Math.max(20, Math.round(50 * (maxRatio / ratio)));
    details = `有无失衡：daoNothing 过重。daoNothing: ${nothingLines} 行，daoAnything: ${anythingLines} 行，比值: ${(ratio).toFixed(3)}（高于上限 ${maxRatio.toFixed(3)}）`;
    details += `\n  · 帛书依据："有，名万物之母"——有（实现容器）应承载主要的运行逻辑`;
    recommendation = '建议将部分纯类型定义迁移至 daoNothing，确保 daoAnything 聚焦于实际容器与模块注册功能';
  }

  return {
    name: '有无平衡检验',
    category: CATEGORY,
    passed: inRange && score >= 60,
    score,
    details,
    recommendation,
    timestamp,
  };
}
