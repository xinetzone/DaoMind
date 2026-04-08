import type { QiDiagnosis } from './types.js';

function tanh(x: number): number {
  return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
}

export class DaoDiagnosisEngine {
  private diagnoses = new Map<string, QiDiagnosis>();

  diagnose(
    nodeId: string,
    incomingRate: number,
    outgoingRate: number,
    history?: ReadonlyArray<number>,
  ): QiDiagnosis {
    const total = incomingRate + outgoingRate;
    const activityScore = (tanh(total / 100) + 1) / 2;

    let trend: QiDiagnosis['trend'] = 'stable';
    if (history && history.length >= 2) {
      const recent = history.slice(-3);
      const diff = (recent[recent.length - 1] ?? 0) - (recent[0] ?? 0);
      if (diff > total * 0.1) trend = 'rising';
      else if (diff < -total * 0.1) trend = 'falling';
    }

    let condition: QiDiagnosis['condition'];
    let recommendation: string;

    if (activityScore < 0.1 && trend === 'falling') {
      condition = 'deficient';
      recommendation =
        '气虚——建议检查该节点是否有未处理的任务堆积或连接断开';
    } else if (activityScore > 0.9 && trend === 'rising') {
      condition = 'excess';
      recommendation =
        '气盛——该节点负载过高，建议进行流量分流或扩容处理';
    } else {
      condition = 'balanced';
      recommendation = '气血调和——节点运行状态正常';
    }

    const diagnosis: QiDiagnosis = {
      nodeId,
      condition,
      incomingRate,
      outgoingRate,
      activityScore,
      trend,
      recommendation,
      timestamp: Date.now(),
    };
    this.diagnoses.set(nodeId, diagnosis);
    return diagnosis;
  }

  diagnoseAll(
    nodes: ReadonlyArray<{ id: string; incoming: number; outgoing: number }>,
  ): ReadonlyArray<QiDiagnosis> {
    return nodes.map((n) => this.diagnose(n.id, n.incoming, n.outgoing));
  }

  getDeficientNodes(): ReadonlyArray<QiDiagnosis> {
    return Array.from(this.diagnoses.values()).filter(
      (d) => d.condition === 'deficient',
    );
  }

  getExcessNodes(): ReadonlyArray<QiDiagnosis> {
    return Array.from(this.diagnoses.values()).filter(
      (d) => d.condition === 'excess',
    );
  }
}
