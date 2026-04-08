import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { VerificationResult, VerificationCategory } from '../types.js';

const CATEGORY: VerificationCategory = 'naming-convention';

const FORBIDDEN_PATTERNS = [
  { pattern: /\bkill\b/i, label: 'kill' },
  { pattern: /\bforce\b/i, label: 'force' },
  { pattern: /\battack\b/i, label: 'attack' },
  { pattern: /\bdestroy\b/i, label: 'destroy' },
  { pattern: /\bwar\b/i, label: 'war' },
  { pattern: /\bviolence\b/i, label: 'violence' },
  { pattern: /\bomb\b/i, label: 'bomb' },
  { pattern: /\bhack(?!\w)/i, label: 'hack' },
  { pattern: /\bslash(?!\w)/i, label: 'slash' },
  { pattern: /\bstab\b/i, label: 'stab' },
] as const;

const ENCOURAGED_NATURE_WORDS = [
  'flow', 'stream', 'river', 'ocean', 'wave', 'spring', 'source', 'root',
  'seed', 'tree', 'forest', 'mountain', 'valley', 'cloud', 'rain', 'mist',
  'wind', 'breath', 'pulse', 'rhythm', 'harmony', 'balance', 'circle',
  'void', 'emptiness', 'potential', 'origin', 'dawn', 'light', 'shadow',
  'mirror', 'lotus', 'bamboo', 'crane', 'phoenix', 'dragon',
] as const;

const DAO_PREFIX_PATTERN = /^export\s+(?:type\s+|(?:const|let|var|function|class|enum)\s+(?:dao\w+)|default)/;

async function collectTsFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await collectTsFiles(fullPath)));
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !entry.name.includes('.test.')) {
        results.push(fullPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

interface NamingViolation {
  file: string;
  line: number;
  pattern: string;
  matchedText: string;
}

interface NamingStats {
  totalFiles: number;
  totalExports: number;
  daoPrefixedExports: number;
  violations: NamingViolation[];
  natureWordUsage: number;
  totalExportNames: string[];
}

async function analyzeNaming(packagesDir: string): Promise<NamingStats> {
  const stats: NamingStats = {
    totalFiles: 0,
    totalExports: 0,
    daoPrefixedExports: 0,
    violations: [],
    natureWordUsage: 0,
    totalExportNames: [],
  };

  try {
    const packageDirs = await fs.readdir(packagesDir, { withFileTypes: true });
    for (const pkg of packageDirs) {
      if (!pkg.isDirectory() || !pkg.name.startsWith('dao')) continue;
      const pkgSrc = path.join(packagesDir, pkg.name, 'src');
      const tsFiles = await collectTsFiles(pkgSrc);
      stats.totalFiles += tsFiles.length;

      for (const filePath of tsFiles) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          const exportMatch = line.match(/^export\s+(?:(?:const|let|var|function|class|enum|interface|type)\s+)(\w+)/);
          if (exportMatch) {
            const exportName = exportMatch[1]!;
            stats.totalExports++;
            stats.totalExportNames.push(exportName);

            if (exportName.toLowerCase().startsWith('dao')) {
              stats.daoPrefixedExports++;
            }

            for (const word of ENCOURAGED_NATURE_WORDS) {
              if (new RegExp(`\\b${word}\\b`, 'i').test(line)) {
                stats.natureWordUsage++;
                break;
              }
            }
          }

          for (const fp of FORBIDDEN_PATTERNS) {
            if (fp.pattern.test(line)) {
              const textMatch = line.match(fp.pattern);
              stats.violations.push({
                file: path.relative(packagesDir, filePath),
                line: i + 1,
                pattern: fp.label,
                matchedText: textMatch?.[0] ?? '',
              });
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return stats;
}

export async function daoCheckNamingConvention(projectRoot: string): Promise<VerificationResult> {
  const timestamp = Date.now();
  const packagesDir = path.join(projectRoot, 'packages');

  const stats = await analyzeNaming(packagesDir);

  const prefixRate = stats.totalExports > 0 ? stats.daoPrefixedExports / stats.totalExports : 1;
  const prefixScore = Math.round(prefixRate * 40);
  const violationDeduction = Math.min(stats.violations.length * 10, 40);
  const natureBonus = Math.min(stats.natureWordUsage * 2, 20);
  const score = Math.max(0, Math.min(100, prefixScore - violationDeduction + natureBonus));

  const passed = score >= 70 && stats.violations.length === 0;

  let details = `命名规范扫描结果（扫描 ${stats.totalFiles} 个文件，${stats.totalExports} 个公共导出）：\n`;
  details += `  · dao 前缀合规率: ${stats.totalExports > 0 ? Math.round(prefixRate * 100) : 100}% (${stats.daoPrefixedExports}/${stats.totalExports})\n`;
  details += `  · 武力隐喻违规: ${stats.violations.length} 处\n`;
  details += `  · 自然意象使用: ${stats.natureWordUsage} 处\n`;

  if (stats.violations.length > 0) {
    details += `\n  违规详情（前10条）：\n`;
    for (const v of stats.violations.slice(0, 10)) {
      details += `    · ${v.file}:${v.line} — 检测到 "${v.pattern}" (${v.matchedText})\n`;
    }
  }

  if (stats.totalExports > 0 && stats.daoPrefixedExports < stats.totalExports) {
    const nonDao = stats.totalExportNames.filter((n) => !n.toLowerCase().startsWith('dao'));
    details += `\n  非 dao 前缀导出: ${nonDao.slice(0, 15).join(', ')}${nonDao.length > 15 ? `... 等 ${nonDao.length} 个` : ''}\n`;
  }

  details += `\n  帛书依据：「道可道，非常名」— 命名应体现道的自然本性，避免暴力隐喻`;

  let recommendation: string | undefined;
  if (!passed) {
    const parts: string[] = [];
    if (prefixRate < 0.8) parts.push(`公共导出 dao 前缀率仅 ${Math.round(prefixRate * 100)}%，建议统一使用 dao 前缀`);
    if (stats.violations.length > 0) parts.push(`发现 ${stats.violations.length} 处武力隐喻命名，应替换为自然意象词汇`);
    if (stats.natureWordUsage < 5) parts.push('自然意象命名使用率偏低，建议多用 flow/harmony/balance 等词汇');
    recommendation = parts.join('；');
  }

  return {
    name: '命名规范检验',
    category: CATEGORY,
    passed,
    score,
    details,
    recommendation,
    timestamp,
  };
}
