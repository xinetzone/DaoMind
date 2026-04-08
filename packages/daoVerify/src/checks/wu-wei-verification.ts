import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { VerificationResult, VerificationCategory } from '../types.js';

const CATEGORY: VerificationCategory = 'wu-wei-verification';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

interface CollectiveAnalysis {
  isCoordinationFocused: boolean;
  usesEventDriven: boolean;
  avoidsDirectControl: boolean;
  supportsSelfOrganization: boolean;
  lineCount: number;
  exportStyle: 'object' | 'class' | 'function' | 'mixed';
}

async function analyzeCollectiveIndex(collectivePath: string): Promise<CollectiveAnalysis> {
  const defaultResult: CollectiveAnalysis = {
    isCoordinationFocused: false,
    usesEventDriven: false,
    avoidsDirectControl: true,
    supportsSelfOrganization: false,
    lineCount: 0,
    exportStyle: 'mixed',
  };

  try {
    const content = await fs.readFile(collectivePath, 'utf-8');
    const lines = content.split('\n');
    const effectiveLines = lines.filter((l) => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('*')).length;

    const controlPatterns = [/\.call\(/, /\.invoke\(/, /\.execute\(/, /\.run\(/, /\.command\(/];
    const coordinationPatterns = [/coordinate/, /orchestrat/, /harmoniz/, /mediate/, /facilitat/, /bridge/];
    const eventPatterns = [/EventEmitter/, /emit\s*\(/, /on\s*\(/, /subscribe/, /listen/, /observer/];
    const selfOrgPatterns = [/self.?organiz|autonomous|decentraliz|emergent|organic/];

    const controlIndicators = controlPatterns.filter((p) => p.test(content)).length;
    const coordinationIndicators = coordinationPatterns.filter((p) => p.test(content)).length;
    const eventIndicators = eventPatterns.filter((p) => p.test(content)).length;
    const selfOrgIndicators = selfOrgPatterns.filter((p) => p.test(content)).length;

    let exportStyle: CollectiveAnalysis['exportStyle'] = 'mixed';
    if (/export\s+const\s+\w+\s*=\s*\{/.test(content)) exportStyle = 'object';
    else if (/export\s+class\s+\w+/.test(content)) exportStyle = 'class';
    else if (/export\s+(async\s+)?function/.test(content)) exportStyle = 'function';

    return {
      isCoordinationFocused: coordinationIndicators > 0 || controlIndicators === 0,
      usesEventDriven: eventIndicators > 0,
      avoidsDirectControl: controlIndicators === 0 || controlIndicators < coordinationIndicators,
      supportsSelfOrganization: selfOrgIndicators > 0 || effectiveLines <= 10,
      lineCount: effectiveLines,
      exportStyle,
    };
  } catch {
    return defaultResult;
  }
}

export async function daoCheckWuWeiVerification(projectRoot: string): Promise<VerificationResult> {
  const timestamp = Date.now();
  const collectiveIndex = path.join(projectRoot, 'packages', 'daoCollective', 'src', 'index.ts');

  const exists = await fileExists(collectiveIndex);

  if (!exists) {
    return {
      name: '无为验证',
      category: CATEGORY,
      passed: false,
      score: 0,
      details: 'daoCollective/index.ts 不存在，无法执行无为验证',
      recommendation: '请创建 @dao/collective 包作为根节点入口，遵循无为而治的协调者设计',
      timestamp,
    };
  }

  const analysis = await analyzeCollectiveIndex(collectiveIndex);

  const scores: number[] = [];

  scores.push(analysis.isCoordinationFocused ? 25 : 5);
  scores.push(analysis.usesEventDriven ? 20 : 8);
  scores.push(analysis.avoidsDirectControl ? 25 : 5);
  scores.push(analysis.supportsSelfOrganization ? 20 : 8);

  const lightnessBonus = analysis.lineCount <= 10 ? 10 : analysis.lineCount <= 30 ? 5 : 0;
  scores.push(lightnessBonus);

  const score = Math.round(scores.reduce((a, b) => a + b, 0));

  const passed = score >= 70;

  let details = `daoCollective/index.ts 无为分析结果：\n`;
  details += `  · 有效代码行数: ${analysis.lineCount}\n`;
  details += `  · 导出风格: ${analysis.exportStyle}\n`;
  details += `  · 协调导向（非直接控制）: ${analysis.isCoordinationFocused ? '✓ 符合' : '⚠ 偏向直接控制'}\n`;
  details += `  · 事件驱动模式: ${analysis.usesEventDriven ? '✓ 采用事件驱动' : '— 未检测到事件驱动'}\n`;
  details += `  · 避免直接控制调用: ${analysis.avoidsDirectControl ? '✓ 无直接控制模式' : '⚠ 存在直接控制调用'}\n`;
  details += `  · 自组织结构支撑: ${analysis.supportsSelfOrganization ? '✓ 支持自组织' : '— 自组织特征不明显'}\n`;
  details += `\n  帛书依据：《道德经》「道常无为而无不为」— 根节点应做协调者而非控制者`;

  let recommendation: string | undefined;
  if (!passed) {
    const suggestions: string[] = [];
    if (!analysis.isCoordinationFocused) suggestions.push('根节点应聚焦协调而非直接控制各子模块');
    if (!analysis.usesEventDriven) suggestions.push('建议采用事件驱动/发布订阅模式替代直接函数调用');
    if (!analysis.avoidsDirectControl) suggestions.push('避免使用 call/invoke/execute 等命令式方法名');
    if (!analysis.supportsSelfOrganization && analysis.lineCount > 30) suggestions.push('根节点应保持精简，将复杂逻辑下沉到子模块');
    recommendation = suggestions.join('；');
  }

  return {
    name: '无为验证',
    category: CATEGORY,
    passed,
    score,
    details,
    recommendation,
    timestamp,
  };
}
