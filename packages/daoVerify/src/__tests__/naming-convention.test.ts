import { daoCheckNamingConvention } from '../checks/naming-convention';

describe('daoCheckNamingConvention', () => {
  test('should return valid report for project root', async () => {
    const report = await daoCheckNamingConvention(process.cwd());
    expect(report).toBeDefined();
    expect(report.name).toBe('命名规范检验');
    expect(report.category).toBe('naming-convention');
    expect(typeof report.score).toBe('number');
    expect(typeof report.passed).toBe('boolean');
    expect(typeof report.details).toBe('string');
  });

  test('should handle non-existent directory gracefully', async () => {
    const report = await daoCheckNamingConvention('./non-existent-directory');
    expect(report).toBeDefined();
    expect(report.name).toBe('命名规范检验');
    expect(report.category).toBe('naming-convention');
  });
});