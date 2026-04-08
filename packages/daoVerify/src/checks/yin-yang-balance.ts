import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DaoVerificationResult, DaoVerificationCategory } from '../types.js';

const CATEGORY: DaoVerificationCategory = 'yin-yang-balance';

const EXPECTED_PAIR_COUNT = 5;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

interface YinYangPairCheck {
  id: string;
  hasYinNode: boolean;
  hasYangNode: boolean;
  hasIdealRatio: boolean;
  hasThreshold: boolean;
  complete: boolean;
}

async function analyzeYinYangPairs(chongQiPath: string): Promise<{
  pairs: YinYangPairCheck[];
  pairCount: number;
  completePairs: number;
}> {
  const pairs: YinYangPairCheck[] = [];
  try {
    const content = await fs.readFile(chongQiPath, 'utf-8');
    const pairIdMatches = content.matchAll(/id:\s*['"]([^'"]+)['"]/g);
    for (const match of pairIdMatches) {
      const id = match[1];
      const pairStart = match.index ?? 0;
      const blockEnd = content.indexOf('}', pairStart + 100);
      const block = blockEnd > 0 ? content.slice(pairStart, blockEnd + 200) : content.slice(pairStart, pairStart + 500);

      pairs.push({
        id: id!,
        hasYinNode: /yinNode/.test(block),
        hasYangNode: /yangNode/.test(block),
        hasIdealRatio: /idealRatio/.test(block),
        hasThreshold: /threshold/i.test(block),
        complete: /yinNode/.test(block) && /yangNode/.test(block) && /idealRatio/.test(block) && /threshold/i.test(block),
      });
    }
  } catch {
    // 文件不存在或读取失败
  }

  const completePairs = pairs.filter((p) => p.complete).length;
  return { pairs, pairCount: pairs.length, completePairs };
}

async function checkChongQiRegulatorMethods(chongQiPath: string): Promise<{
  hasRegulateAll: boolean;
  hasConverge: boolean;
}> {
  try {
    const content = await fs.readFile(chongQiPath, 'utf-8');
    return {
      hasRegulateAll: /regulateAll\s*\(/.test(content),
      hasConverge: /converge\s*\(/.test(content),
    };
  } catch {
    return { hasRegulateAll: false, hasConverge: false };
  }
}

export async function daoCheckYinYangBalance(projectRoot: string): Promise<DaoVerificationResult> {
  const timestamp = Date.now();
  const chongQiPath = path.join(
    projectRoot, 'packages', 'daoQi', 'src', 'channels', 'chong-qi.ts'
  );

  const exists = await fileExists(chongQiPath);

  if (!exists) {
    return {
      name: '阴阳平衡检验',
      category: CATEGORY,
      passed: false,
      score: 0,
      details: 'chong-qi.ts 不存在，无法执行阴阳平衡检验',
      recommendation: '请在 @dao/qi/src/channels/ 下创建 chong-qi.ts 并实现五组阴阳对配置',
      timestamp,
    };
  }

  const [pairAnalysis, methodCheck] = await Promise.all([
    analyzeYinYangPairs(chongQiPath),
    checkChongQiRegulatorMethods(chongQiPath),
  ]);

  const pairScore = Math.min(pairAnalysis.completePairs / EXPECTED_PAIR_COUNT, 1) * 55;
  const countScore = pairAnalysis.pairCount >= EXPECTED_PAIR_COUNT ? 15 : Math.round((pairAnalysis.pairCount / EXPECTED_PAIR_COUNT) * 15);
  const methodScore = (methodCheck.hasRegulateAll ? 15 : 0) + (methodCheck.hasConverge ? 15 : 0);
  const score = Math.round(pairScore + countScore + methodScore);

  const passed =
    pairAnalysis.completePairs >= EXPECTED_PAIR_COUNT &&
    methodCheck.hasRegulateAll &&
    methodCheck.hasConverge;

  let details = `chong-qi.ts 存在，阴阳对分析结果：\n`;
  details += `  · 阴阳对总数: ${pairAnalysis.pairCount}（期望 ≥${EXPECTED_PAIR_COUNT}）\n`;
  details += `  · 完整对数: ${pairAnalysis.completePairs}/${EXPECTED_PAIR_COUNT}\n\n`;
  for (const p of pairAnalysis.pairs) {
    details += `  · 对 [${p.id}]: yinNode=${p.hasYinNode ? '✓' : '✗'} yangNode=${p.hasYangNode ? '✓' : '✗'} idealRatio=${p.hasIdealRatio ? '✓' : '✗'} threshold=${p.hasThreshold ? '✓' : '✗'} ${p.complete ? '(完整)' : '(不完整)'}\n`;
  }
  details += `\n  ChongQiRegulator 方法检查:\n`;
  details += `  · regulateAll(): ${methodCheck.hasRegulateAll ? '✓ 已实现' : '✗ 缺失'}\n`;
  details += `  · converge(): ${methodCheck.hasConverge ? '✓ 已实现' : '✗ 缺失'}\n`;
  details += `\n  帛书依据：《道德经》乙本·四十二章「万物负阴而抱阳，冲气以为和」`;

  let recommendation: string | undefined;
  if (!passed) {
    const parts: string[] = [];
    if (pairAnalysis.completePairs < EXPECTED_PAIR_COUNT) {
      parts.push(`完整阴阳对不足（${pairAnalysis.completePairs}/${EXPECTED_PAIR_COUNT}），每对需包含 yinNode/yangNode/idealRatio/threshold`);
    }
    if (!methodCheck.hasRegulateAll) parts.push('ChongQiRegulator 缺少 regulateAll() 方法');
    if (!methodCheck.hasConverge) parts.push('ChongQiRegulator 缺少 converge() 方法');
    recommendation = parts.join('；');
  }

  return {
    name: '阴阳平衡检验',
    category: CATEGORY,
    passed,
    score,
    details,
    recommendation,
    timestamp,
  };
}
