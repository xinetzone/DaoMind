import { readFileSync, existsSync } from 'node:fs';
import type { DaoBenchmarkResult, DaoPerformanceReport } from './types';
import { daoMeasureStartupTime } from './suites/startup';
import { daoMeasureMemoryBaseline } from './suites/memory';
import { daoMeasureThroughput } from './suites/throughput';
import { daoMeasureFeedbackLatency } from './suites/latency';
import { daoMeasureConvergenceTime } from './suites/chong-qi-convergence';
import { daoMeasureNothingPackageSize } from './suites/nothing-size';

type SuiteRunner = () => Promise<DaoBenchmarkResult> | DaoBenchmarkResult;

const SUITE_MAP: Record<string, SuiteRunner> = {
  '启动时间测试': daoMeasureStartupTime,
  '内存占用测试': daoMeasureMemoryBaseline,
  '消息吞吐量测试': daoMeasureThroughput,
  '反馈回路延迟测试': daoMeasureFeedbackLatency,
  '冲气收敛时间测试': daoMeasureConvergenceTime,
  'daoNothing 打包大小测试': daoMeasureNothingPackageSize,
};

const QUICK_SUITES = ['启动时间测试', '内存占用测试', '消息吞吐量测试'];

export class DaoBenchmarkRunner {
  private results: DaoBenchmarkResult[] = [];

  async daoRunAll(): Promise<DaoPerformanceReport> {
    this.results = [];
    const suiteNames = Object.keys(SUITE_MAP);

    for (const name of suiteNames) {
      const runner = SUITE_MAP[name];
      if (!runner) continue;
      const result = await runner();
      this.results.push(result);
    }

    return this.daoBuildReport();
  }

  async daoRunSuite(name: string): Promise<DaoBenchmarkResult> {
    const runner = SUITE_MAP[name];
    if (!runner) {
      throw new Error(`未知测试套件: ${name}. 可用套件: ${Object.keys(SUITE_MAP).join(', ')}`);
    }
    const result = await runner();
    this.results.push(result);
    return result;
  }

  async daoRunQuick(): Promise<DaoPerformanceReport> {
    this.results = [];

    for (const name of QUICK_SUITES) {
      const runner = SUITE_MAP[name];
      if (runner) {
        const result = await runner();
        this.results.push(result);
      }
    }

    return this.daoBuildReport();
  }

  async daoCompareWithBaseline(baselinePath: string): Promise<DaoPerformanceReport> {
    if (!existsSync(baselinePath)) {
      throw new Error(`基线文件不存在: ${baselinePath}`);
    }

    const baselineContent = readFileSync(baselinePath, 'utf-8');
    const baseline: DaoPerformanceReport = JSON.parse(baselineContent);

    const currentReport = await this.daoRunAll();

    const recommendations: string[] = [];
    const criticalFailures: string[] = [];

    for (let i = 0; i < currentReport.benchmarks.length; i++) {
      const current = currentReport.benchmarks[i];
      if (!current) continue;
      const baselineSuite = baseline.benchmarks.find(b => b.suiteName === current.suiteName);

      if (baselineSuite) {
        for (const metric of current.metrics) {
          const baselineMetric = baselineSuite.metrics.find(m => m.name === metric.name);
          if (baselineMetric) {
            const regression = metric.value - baselineMetric.value;
            if (regression > baselineMetric.value * 0.2) {
              criticalFailures.push(`${current.suiteName} - ${metric.name}: 回退 ${(regression * 100).toFixed(1)}%`);
            } else if (regression > baselineMetric.value * 0.1) {
              recommendations.push(`${current.suiteName} - ${metric.name}: 性能下降 ${(regression * 100).toFixed(1)}%`);
            }
          }
        }
      }
    }

    return {
      ...currentReport,
      summary: {
        ...currentReport.summary,
        criticalFailures,
        recommendations: [...currentReport.summary.recommendations, ...recommendations],
      },
    };
  }

  daoGenerateReport(format: 'text' | 'json' | 'markdown' = 'text'): string {
    const report = this.daoBuildReport();

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'markdown':
        return this.daoGenerateMarkdown(report);

      case 'text':
      default:
        return this.daoGenerateText(report);
    }
  }

  private daoBuildReport(): DaoPerformanceReport {
    const totalSuites = this.results.length;
    const passedSuites = this.results.filter(r => r.overallPassed).length;
    const failedSuites = totalSuites - passedSuites;

    const criticalFailures: string[] = [];
    const recommendations: string[] = [];

    for (const result of this.results) {
      if (!result.overallPassed) {
        const failedMetrics = result.metrics.filter(m => !m.passed);
        failedMetrics.forEach(m => {
          criticalFailures.push(`${result.suiteName} - ${m.name}: ${m.value} ${m.unit} (目标: <${m.target} ${m.unit})`);
        });
      }
    }

    if (failedSuites > 0) {
      recommendations.push('存在未达标的性能指标，建议进行优化');
    }

    return {
      generatedAt: Date.now(),
      benchmarks: this.results,
      summary: {
        totalSuites,
        passedSuites,
        failedSuites,
        criticalFailures,
        recommendations,
      },
    };
  }

  private daoGenerateText(report: DaoPerformanceReport): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('DAO 性能基准测试报告');
    lines.push(`生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`);
    lines.push('='.repeat(60));
    lines.push('');

    lines.push(`总套件数: ${report.summary.totalSuites}`);
    lines.push(`通过套件: ${report.summary.passedSuites}`);
    lines.push(`失败套件: ${report.summary.failedSuites}`);
    lines.push('');

    for (const benchmark of report.benchmarks) {
      lines.push('-'.repeat(40));
      lines.push(`套件名称: ${benchmark.suiteName}`);
      lines.push(`耗时: ${benchmark.duration}ms`);
      lines.push(`状态: ${benchmark.overallPassed ? '✓ 通过' : '✗ 未通过'}`);
      lines.push('');

      for (const metric of benchmark.metrics) {
        lines.push(`  ${metric.name}: ${metric.value} ${metric.unit} (目标: <${metric.target} ${metric.unit}) [${metric.passed ? '✓' : '✗'}]`);
      }

      lines.push('');
    }

    if (report.summary.criticalFailures.length > 0) {
      lines.push('!'.repeat(40));
      lines.push('关键失败项:');
      report.summary.criticalFailures.forEach(f => lines.push(`  ! ${f}`));
      lines.push('');
    }

    if (report.summary.recommendations.length > 0) {
      lines.push('优化建议:');
      report.summary.recommendations.forEach(r => lines.push(`  • ${r}`));
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  private daoGenerateMarkdown(report: DaoPerformanceReport): string {
    const lines: string[] = [];
    lines.push('# DAO 性能基准测试报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('## 摘要');
    lines.push('');
    lines.push('| 指标 | 数值 |');
    lines.push('|------|------|');
    lines.push(`| 总套件数 | ${report.summary.totalSuites} |`);
    lines.push(`| 通过套件 | ${report.summary.passedSuites} |`);
    lines.push(`| 失败套件 | ${report.summary.failedSuites} |`);
    lines.push('');

    for (const benchmark of report.benchmarks) {
      lines.push(`## ${benchmark.suiteName}`);
      lines.push('');
      lines.push(`- **状态**: ${benchmark.overallPassed ? '✅ 通过' : '❌ 未通过'}`);
      lines.push(`- **耗时**: ${benchmark.duration}ms`);
      lines.push('');
      lines.push('| 指标 | 值 | 单位 | 目标 | 状态 |');
      lines.push('|------|-----|------|------|------|');

      for (const metric of benchmark.metrics) {
        lines.push(`| ${metric.name} | ${metric.value} | ${metric.unit} | <${metric.target} | ${metric.passed ? '✅' : '❌'} |`);
      }

      lines.push('');
    }

    if (report.summary.criticalFailures.length > 0) {
      lines.push('## ⚠️ 关键失败项');
      lines.push('');
      report.summary.criticalFailures.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    if (report.summary.recommendations.length > 0) {
      lines.push('## 💡 优化建议');
      lines.push('');
      report.summary.recommendations.forEach(r => lines.push(`- ${r}`));
    }

    return lines.join('\n');
  }
}
