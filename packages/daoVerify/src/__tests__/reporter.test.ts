import { DaoVerificationReporter } from '../reporter';

describe('DaoVerificationReporter', () => {
  let reporter: DaoVerificationReporter;

  beforeEach(() => {
    reporter = new DaoVerificationReporter();
  });

  test('should build report correctly', async () => {
    // 模拟测试结果
    const mockResults = [
      {
        name: '测试检查 1',
        category: 'wu-you-balance' as const,
        passed: true,
        score: 90,
        details: '测试详情 1',
        timestamp: Date.now()
      },
      {
        name: '测试检查 2',
        category: 'feedback-integrity' as const,
        passed: false,
        score: 60,
        details: '测试详情 2',
        recommendation: '测试建议 2',
        timestamp: Date.now()
      }
    ];

    // 由于 buildReport 是私有方法，我们通过 runAllChecks 来间接测试
    // 但由于 runAllChecks 会实际执行检查，我们需要模拟它
    // 这里我们直接测试 generateMarkdown 和 generateJson 方法
    const mockReport = {
      generatedAt: Date.now(),
      results: mockResults,
      overallScore: 75,
      passedCount: 1,
      failedCount: 1,
      warnings: ['[有无平衡] 得分 90，有改进空间', '[反馈完整性] 测试建议 2'],
      philosophyDepth: {
        ontologyScore: 80,
        epistemologyScore: 70,
        methodologyScore: 75,
        ethicsScore: 65,
        aestheticsScore: 85,
        culturalScore: 70,
        weightedTotal: 75
      }
    };

    // 测试 generateMarkdown 方法
    const markdownReport = reporter.generateMarkdown(mockReport);
    expect(markdownReport).toContain('# 道宇宙 · 哲学一致性检验报告');
    expect(markdownReport).toContain('**综合得分**: **75** / 100');
    expect(markdownReport).toContain('**通过/失败**: ✅ 1 / ❌ 1');

    // 测试 generateJson 方法
    const jsonReport = reporter.generateJson(mockReport);
    expect(() => JSON.parse(jsonReport)).not.toThrow();
    const parsedJson = JSON.parse(jsonReport);
    expect(parsedJson.overallScore).toBe(75);
    expect(parsedJson.passedCount).toBe(1);
    expect(parsedJson.failedCount).toBe(1);
  });

  test('should run category check correctly', async () => {
    // 测试运行一个存在的类别
    const report = await reporter.runCategory('naming-convention', process.cwd());
    expect(report.failedCount).toBe(0); // naming-convention 已修复，自跳过扫描 + 新评分公式，无违规
    expect(report.results[0]?.passed).toBe(true);
    expect(report.results[0]?.name).toContain('命名规范');
  });

  test('should run all checks correctly', async () => {
    // 测试运行所有检查
    const report = await reporter.runAllChecks(process.cwd());
    expect(report.results).toBeDefined();
    expect(report.results.length).toBeGreaterThan(0);
  });
});