import { DaoBenchmarkRunner } from '../runner';

describe('DaoBenchmarkRunner', () => {
  let runner: DaoBenchmarkRunner;

  beforeEach(() => {
    runner = new DaoBenchmarkRunner();
  });

  describe('运行测试套件', () => {
    test('应该成功运行快速测试套件', async () => {
      const report = await runner.daoRunQuick();
      expect(report).toBeDefined();
      expect(report.benchmarks).toBeDefined();
      expect(report.benchmarks.length).toBeGreaterThan(0);
      expect(report.summary.totalSuites).toBeGreaterThan(0);
    });

    test('应该成功运行特定测试套件', async () => {
      const suiteName = '启动时间测试';
      const result = await runner.daoRunSuite(suiteName);
      expect(result).toBeDefined();
      expect(result.suiteName).toBe(suiteName);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.length).toBeGreaterThan(0);
    });

    test('对于未知测试套件应该抛出错误', async () => {
      const unknownSuite = '未知测试套件';
      await expect(runner.daoRunSuite(unknownSuite)).rejects.toThrow(/未知测试套件/);
    });
  });

  describe('生成测试报告', () => {
    test('应该生成文本格式的测试报告', () => {
      const textReport = runner.daoGenerateReport('text');
      expect(typeof textReport).toBe('string');
      expect(textReport.length).toBeGreaterThan(0);
    });

    test('应该生成 JSON 格式的测试报告', () => {
      const jsonReport = runner.daoGenerateReport('json');
      expect(typeof jsonReport).toBe('string');
      expect(() => JSON.parse(jsonReport)).not.toThrow();
    });

    test('应该生成 Markdown 格式的测试报告', () => {
      const markdownReport = runner.daoGenerateReport('markdown');
      expect(typeof markdownReport).toBe('string');
      expect(markdownReport.length).toBeGreaterThan(0);
    });
  });

  describe('与基线比较', () => {
    test('对于不存在的基线文件应该抛出错误', async () => {
      const nonExistentPath = 'non-existent-baseline.json';
      await expect(runner.daoCompareWithBaseline(nonExistentPath)).rejects.toThrow(/基线文件不存在/);
    });
  });
});
