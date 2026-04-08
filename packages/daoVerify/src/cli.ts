#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import path from 'node:path';
import { DaoVerificationReporter } from './reporter.js';
import type { DaoVerificationCategory } from './types.js';

const CATEGORY_ALIASES: Record<string, DaoVerificationCategory> = {
  'wu-you': 'wu-you-balance',
  'balance': 'wu-you-balance',
  'feedback': 'feedback-integrity',
  'qi': 'qi-fluency',
  'fluency': 'qi-fluency',
  'yinyang': 'yin-yang-balance',
  'yin-yang': 'yin-yang-balance',
  'wuwei': 'wu-wei-verification',
  'wu-wei': 'wu-wei-verification',
  'naming': 'naming-convention',
  'convention': 'naming-convention',
  'depth': 'architecture-depth',
  'arch': 'architecture-depth',
  'all': 'overall',
};

function resolveCategory(input?: string): DaoVerificationCategory | undefined {
  if (!input) return undefined;
  const lower = input.toLowerCase();
  return CATEGORY_ALIASES[lower] ?? (lower as DaoVerificationCategory);
}

import type { ChalkInstance } from 'chalk';

function scoreColor(score: number): ChalkInstance {
  if (score >= 90) return chalk.greenBright;
  if (score >= 70) return chalk.yellow;
  if (score >= 50) return chalk.redBright;
  return chalk.red;
}

interface ReportData {
  generatedAt: number;
  overallScore: number;
  passedCount: number;
  failedCount: number;
  philosophyDepth: {
    ontologyScore: number;
    epistemologyScore: number;
    methodologyScore: number;
    ethicsScore: number;
    aestheticsScore: number;
    culturalScore: number;
    weightedTotal: number;
  };
  results: Array<{
    name: string;
    category: string;
    passed: boolean;
    score: number;
    details: string;
    recommendation?: string;
  }>;
  warnings: string[];
}

function printTerminalReport(report: ReportData): void {
  console.log();
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║') + chalk.white.bold('       道 宇 宙 · 哲 学 一 致 性 检 验 报 告       ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════╝'));
  console.log();

  const overallColor = scoreColor(report.overallScore);
  console.log(`  综合得分: ${overallColor.bold(String(report.overallScore))} / 100`);
  console.log(`  通过: ${chalk.green(String(report.passedCount))}  |  失败: ${chalk.red(String(report.failedCount))}`);
  console.log();

  console.log(chalk.gray('─'.repeat(52)));
  console.log(chalk.bold('  哲学深度评估'));
  console.log(chalk.gray('─'.repeat(52)));

  const pd = report.philosophyDepth;
  const dimensions: Array<{ label: string; score: number; weight: string }> = [
    { label: '本体论一致性', score: pd.ontologyScore, weight: '22%' },
    { label: '认识论完备性', score: pd.epistemologyScore, weight: '18%' },
    { label: '方法论有效性', score: pd.methodologyScore, weight: '20%' },
    { label: '伦理学正当性', score: pd.ethicsScore, weight: '15%' },
    { label: '美学价值', score: pd.aestheticsScore, weight: '12%' },
    { label: '文化传承', score: pd.culturalScore, weight: '13%' },
  ];

  for (const d of dimensions) {
    const barLen = Math.round(d.score / 5);
    const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
    console.log(`  ${scoreColor(d.score)(String(d.score).padStart(3))}  ${bar}  ${d.label} (${d.weight})`);
  }
  console.log(`  ${chalk.bold(scoreColor(pd.weightedTotal)(String(pd.weightedTotal).padStart(3)))}  ${'─'.repeat(20)}  加权总分`);
  console.log();

  console.log(chalk.gray('─'.repeat(52)));
  console.log(chalk.bold('  检验结果详情'));
  console.log(chalk.gray('─'.repeat(52)));
  console.log();

  for (const r of report.results) {
    const icon = r.passed ? chalk.green.bold('✔') : chalk.red.bold('✘');
    const sc = scoreColor(r.score);
    console.log(`  ${icon}  ${chalk.bold(r.name)}  ${sc(`[${r.score}分]`)}`);
    const detailLines = r.details.split('\n').filter((l) => l.trim());
    for (const line of detailLines.slice(0, 6)) {
      console.log(`     ${chalk.gray(line.trim())}`);
    }
    if (r.recommendation) {
      console.log(`     ${chalk.yellow('→ 建议: ' + r.recommendation)}`);
    }
    console.log();
  }

  if (report.warnings.length > 0) {
    console.log(chalk.gray('─'.repeat(52)));
    console.log(chalk.yellow.bold('  ⚠ 警告'));
    console.log(chalk.gray('─'.repeat(52)));
    for (const w of report.warnings.slice(0, 8)) {
      console.log(`  ${chalk.yellow('!')} ${w}`);
    }
    console.log();
  }

  console.log(chalk.gray('  ─'.repeat(50)));
  console.log(chalk.gray('  报告由 @dao/verify 生成 — 帛书《道德经》哲学一致性检验'));
  console.log();
}

async function main(): Promise<void> {
  const program = new Command()
    .name('dao-verify')
    .description('道宇宙哲学一致性检验自动化工具')
    .version('1.0.0')
    .option('-p, --project <path>', '项目根目录路径', process.cwd())
    .option('-c, --category <category>', '指定检验类别')
    .option('-f, --format <format>', '输出格式: terminal (默认) | json | markdown', 'terminal')
    .option('-o, --output <file>', '输出到文件');

  program.parse();
  const opts = program.opts();

  const projectRoot = path.resolve(opts.project);
  const category = resolveCategory(opts.category);
  const format = opts.format as 'terminal' | 'json' | 'markdown';

  const reporter = new DaoVerificationReporter();

  const report = category
    ? await reporter.runCategory(category, projectRoot)
    : await reporter.runAllChecks(projectRoot);

  let output: string;
  switch (format) {
    case 'json':
      output = reporter.generateJson(report);
      break;
    case 'markdown':
      output = reporter.generateMarkdown(report);
      break;
    default:
      if (opts.output) {
        output = reporter.generateMarkdown(report);
      } else {
        printTerminalReport(report as unknown as ReportData);
        process.exit(report.failedCount > 0 ? 1 : 0);
        return;
      }
  }

  if (opts.output) {
    import('node:fs').then(({ writeFileSync }) => {
      writeFileSync(opts.output, output, 'utf-8');
      console.log(`报告已写入: ${opts.output}`);
    });
  } else {
    console.log(output);
  }

  process.exit(report.failedCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(chalk.red('检验执行失败:'), err instanceof Error ? err.message : String(err));
  process.exit(2);
});
