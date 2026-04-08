import type { MonitorSnapshot, QiDiagnosis } from './types.js';
import { DaoHeatmapEngine } from './heatmap.js';
import { DaoVectorField } from './vector-field.js';
import { DaoYinYangGaugeEngine } from './gauge.js';
import { DaoAlertEngine } from './alerts.js';
import { DaoDiagnosisEngine } from './diagnosis.js';

const MAX_HISTORY = 100;

export class DaoSnapshotAggregator {
  private history: MonitorSnapshot[] = [];
  private lastSnapshot: MonitorSnapshot | null = null;

  constructor(
    private heatmap: DaoHeatmapEngine,
    private vectorField: DaoVectorField,
    private gauge: DaoYinYangGaugeEngine,
    private alerts: DaoAlertEngine,
    private diagnosis: DaoDiagnosisEngine,
  ) {}

  capture(): MonitorSnapshot {
    const heatmaps = this.heatmap.getHeatmap();
    const flowVectors = this.vectorField.getVectors();
    const gauges = this.gauge.getAllGauges();
    const alerts = this.alerts.getActiveAlerts();
    const diagnoses = Array.from(
      this.diagnoseAllInternal(),
    );

    let health = 100;
    for (const alert of alerts) {
      if (alert.severity === 'critical') health -= 15;
      else if (alert.severity === 'warning') health -= 5;
    }
    for (const g of gauges) {
      if (g.status !== 'balanced') health -= 3;
    }
    for (const d of diagnoses) {
      if (d.condition !== 'balanced') health -= 2;
    }
    health = Math.max(0, health);

    const snapshot: MonitorSnapshot = {
      timestamp: Date.now(),
      heatmaps,
      flowVectors,
      gauges,
      alerts,
      diagnoses,
      systemHealth: health,
    };

    this.lastSnapshot = snapshot;
    this.history.push(snapshot);
    if (this.history.length > MAX_HISTORY) this.history.shift();

    return snapshot;
  }

  getLastSnapshot(): MonitorSnapshot | null {
    return this.lastSnapshot;
  }

  getHistory(limit?: number): ReadonlyArray<MonitorSnapshot> {
    if (!limit) return [...this.history];
    return this.history.slice(-limit);
  }

  private diagnoseAllInternal(): Iterable<QiDiagnosis> {
    const deficient = this.diagnosis.getDeficientNodes();
    const excess = this.diagnosis.getExcessNodes();
    return [...deficient, ...excess];
  }
}
