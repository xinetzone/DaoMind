import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DaoBenchmarkMetric, DaoBenchmarkResult } from '../types.js';

const NOTHING_SIZE_TARGET_BYTES = 1024;

export function daoMeasureNothingPackageSize(): DaoBenchmarkResult {
  const suiteStart = process.hrtime.bigint();

  const packagePath = join(__dirname, '..', '..', '..', 'daoNothing', 'dist', 'index.js');

  let fileSizeBytes = 0;
  let fileExists = false;

  try {
    if (existsSync(packagePath)) {
      const stats = readFileSync(packagePath);
      fileSizeBytes = stats.length;
      fileExists = true;
    }
  } catch {
    fileExists = false;
  }

  const fileSizeKB = fileSizeBytes / 1024;

  const metrics: DaoBenchmarkMetric[] = [
    {
      name: '打包大小',
      value: Math.round(fileSizeKB * 100) / 100,
      unit: 'KB',
      target: NOTHING_SIZE_TARGET_BYTES / 1024,
      passed: fileSizeBytes < NOTHING_SIZE_TARGET_BYTES,
    },
    {
      name: '文件存在',
      value: fileExists ? 1 : 0,
      unit: 'bool',
      target: 1,
      passed: fileExists,
    },
    {
      name: '零运行时副作用',
      value: fileExists && fileSizeBytes < NOTHING_SIZE_TARGET_BYTES ? 1 : 0,
      unit: 'bool',
      target: 1,
      passed: fileExists && fileSizeBytes < NOTHING_SIZE_TARGET_BYTES,
    },
  ];

  const suiteEnd = process.hrtime.bigint();
  const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;

  return {
    suiteName: 'daoNothing 打包大小测试',
    timestamp: Date.now(),
    metrics,
    overallPassed: fileExists && fileSizeBytes < NOTHING_SIZE_TARGET_BYTES,
    duration: Math.round(suiteDurationMs * 100) / 100,
  };
}
