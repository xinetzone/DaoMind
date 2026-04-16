const STARTUP_TARGET_MS = 2000;
async function daoMeasureImportTime(importFn) {
    const start = process.hrtime.bigint();
    await importFn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000;
}
export async function daoMeasureStartupTime() {
    const suiteStart = process.hrtime.bigint();
    const importTimings = [];
    const packages = [
        { name: '@dao/nexus', importFn: () => import('../../daoNexus/dist/index.js') },
        { name: '@dao/feedback', importFn: () => import('../../daoFeedback/dist/index.js') },
        { name: '@dao/qi', importFn: () => import('../../daoQi/dist/index.js') },
    ];
    for (const pkg of packages) {
        try {
            const duration = await daoMeasureImportTime(pkg.importFn);
            importTimings.push({ name: pkg.name, durationMs: duration });
        }
        catch {
            importTimings.push({ name: pkg.name, durationMs: -1 });
        }
    }
    const totalDurationMs = importTimings
        .filter(t => t.durationMs >= 0)
        .reduce((sum, t) => sum + t.durationMs, 0);
    const metrics = [
        {
            name: '总启动时间',
            value: Math.round(totalDurationMs * 100) / 100,
            unit: 'ms',
            target: STARTUP_TARGET_MS,
            passed: totalDurationMs < STARTUP_TARGET_MS,
        },
        ...importTimings.map(t => ({
            name: `${t.name} 导入时间`,
            value: Math.round(t.durationMs * 100) / 100,
            unit: 'ms',
            target: STARTUP_TARGET_MS / 2,
            passed: t.durationMs >= 0 && t.durationMs < STARTUP_TARGET_MS / 2,
        })),
    ];
    const suiteEnd = process.hrtime.bigint();
    const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;
    return {
        suiteName: '启动时间测试',
        timestamp: Date.now(),
        metrics,
        overallPassed: totalDurationMs < STARTUP_TARGET_MS,
        duration: Math.round(suiteDurationMs * 100) / 100,
    };
}
//# sourceMappingURL=startup.js.map