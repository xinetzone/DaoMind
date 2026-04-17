import { DaoVerificationReporter } from '@daomind/verify'

describe('DaoVerify Integration', () => {
  test('should run all verification checks successfully', async () => {
    const reporter = new DaoVerificationReporter()
    const report = await reporter.runAllChecks(process.cwd())

    expect(report).toBeDefined()
    expect(report.results).toBeDefined()
    expect(report.results.length).toBeGreaterThan(0)
    expect(typeof report.overallScore).toBe('number')
    expect(typeof report.passedCount).toBe('number')
    expect(typeof report.failedCount).toBe('number')
  })

  test('should run specific verification category', async () => {
    const reporter = new DaoVerificationReporter()
    const report = await reporter.runCategory('naming-convention', process.cwd())

    expect(report).toBeDefined()
    expect(report.results).toBeDefined()
    expect(report.results.length).toBeGreaterThan(0)
    expect(report.results[0]?.category).toBe('naming-convention')
  })

  test('should generate markdown report', async () => {
    const reporter = new DaoVerificationReporter()
    const report = await reporter.runAllChecks(process.cwd())
    const markdownReport = reporter.generateMarkdown(report)

    expect(markdownReport).toBeDefined()
    expect(typeof markdownReport).toBe('string')
    expect(markdownReport).toContain('# 道宇宙 · 哲学一致性检验报告')
  })

  test('should generate json report', async () => {
    const reporter = new DaoVerificationReporter()
    const report = await reporter.runAllChecks(process.cwd())
    const jsonReport = reporter.generateJson(report)

    expect(jsonReport).toBeDefined()
    expect(typeof jsonReport).toBe('string')
    expect(() => JSON.parse(jsonReport)).not.toThrow()
  })
})
