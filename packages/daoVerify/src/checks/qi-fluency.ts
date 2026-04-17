import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DaoVerificationResult, DaoVerificationCategory } from '../types.js';

const CATEGORY: DaoVerificationCategory = 'qi-fluency';

const REQUIRED_CHANNELS = [
  { file: 'tian-qi.ts', label: '天气通道（天道）' },
  { file: 'di-qi.ts', label: '地气通道（地道）' },
  { file: 'ren-qi.ts', label: '人气通道（人道）' },
  { file: 'chong-qi.ts', label: '冲气通道（调和）' },
] as const;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hasClassDefinition(filePath: string, className: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return new RegExp(`class\\s+${className}`).test(content);
  } catch {
    return false;
  }
}

async function checkMessageProtocol(qiSrc: string): Promise<{
  hasMessageInterface: boolean;
  hasChannelType: boolean;
  protocolCompleteness: number;
}> {
  const typesDir = path.join(qiSrc, 'types');
  let hasMessageInterface = false;
  let hasChannelType = false;

  try {
    const files = await fs.readdir(typesDir);
    for (const f of files) {
      if (!f.endsWith('.ts')) continue;
      const content = await fs.readFile(path.join(typesDir, f), 'utf-8');
      if (/interface\s+DaoMessage/.test(content)) hasMessageInterface = true;
      if (/type\s+QiChannelType/.test(content) || /QiChannelType/.test(content)) hasChannelType = true;
    }
  } catch {
    // types目录不存在
  }

  const checksPassed = [hasMessageInterface, hasChannelType].filter(Boolean).length;
  return {
    hasMessageInterface,
    hasChannelType,
    protocolCompleteness: Math.round((checksPassed / 2) * 100),
  };
}

export async function daoCheckQiFluency(projectRoot: string): Promise<DaoVerificationResult> {
  const timestamp = Date.now();
  const qiSrc = path.join(projectRoot, 'packages', 'daoQi', 'src');
  const channelsDir = path.join(qiSrc, 'channels');
  const hunyuanPath = path.join(qiSrc, 'hunyuan.ts');

  const qiExists = await fileExists(qiSrc);

  if (!qiExists) {
    return {
      name: '气流通畅性检验',
      category: CATEGORY,
      passed: false,
      score: 0,
      details: '@dao/qi 包不存在，无法执行气流通畅性检验',
      recommendation: '请创建 @dao/qi 包并实现天地人冲四通道及混元气总线',
      timestamp,
    };
  }

  const channelResults: Array<{ file: string; label: string; exists: boolean }> = [];
  let existingChannels = 0;

  for (const ch of REQUIRED_CHANNELS) {
    const chPath = path.join(channelsDir, ch.file);
    const exists = await fileExists(chPath);
    channelResults.push({ file: ch.file, label: ch.label, exists });
    if (exists) existingChannels++;
  }

  const hunyuanExists = await fileExists(hunyuanPath);
  const hasHunyuanBus = hunyuanExists
    ? await hasClassDefinition(hunyuanPath, 'HunyuanBus')
    : false;

  const protocolInfo = await checkMessageProtocol(qiSrc);

  const channelScore = (existingChannels / REQUIRED_CHANNELS.length) * 45;
  const hunyuanScore = hasHunyuanBus ? 30 : 0;
  const protocolScore = (protocolInfo.protocolCompleteness / 100) * 25;
  const score = Math.round(channelScore + hunyuanScore + protocolScore);

  const passed = existingChannels === REQUIRED_CHANNELS.length && hasHunyuanBus && protocolInfo.protocolCompleteness >= 100;

  let details = `@dao/qi 包存在，气机通道检查结果：\n`;
  for (const r of channelResults) {
    details += `  · ${r.label} (${r.file}): ${r.exists ? '✓ 已实现' : '✗ 缺失'}\n`;
  }
  details += `  · HunyuanBus 核心类: ${hunyuanExists ? (hasHunyuanBus ? '✓ 已实现' : '⚠ 文件存在但缺少 HunyuanBus 类') : '✗ 缺失'}\n`;
  details += `  · 消息协议 DaoMessage: ${protocolInfo.hasMessageInterface ? '✓ 已定义' : '✗ 缺失'}\n`;
  details += `  · 通道类型 QiChannelType: ${protocolInfo.hasChannelType ? '✓ 已定义' : '✗ 缺失'}\n`;
  details += `\n  帛书依据：《道德经》乙本·四十二章「万物负阴而抱阳，中气以为和」— 四通道构成完整气机循环`;

  let recommendation: string | undefined;
  if (!passed) {
    const missingChannels = channelResults.filter((r) => !r.exists).map((r) => r.label);
    const parts: string[] = [];
    if (missingChannels.length > 0) parts.push(`缺失通道: ${missingChannels.join('、')}`);
    if (!hasHunyuanBus) parts.push('HunyuanBus 核心类未实现');
    if (protocolInfo.protocolCompleteness < 100) parts.push('消息协议定义不完整');
    recommendation = parts.join('；');
  }

  return {
    name: '气流通畅性检验',
    category: CATEGORY,
    passed,
    score,
    details,
    recommendation,
    timestamp,
  };
}
