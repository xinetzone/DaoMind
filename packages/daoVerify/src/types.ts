/** 检验结果 */
export interface VerificationResult {
  readonly name: string;
  readonly category: VerificationCategory;
  readonly passed: boolean;
  readonly score: number;
  readonly details: string;
  readonly recommendation?: string;
  readonly timestamp: number;
}

/** 检验类别 */
export type VerificationCategory =
  | 'wu-you-balance'
  | 'feedback-integrity'
  | 'qi-fluency'
  | 'yin-yang-balance'
  | 'wu-wei-verification'
  | 'naming-convention'
  | 'architecture-depth'
  | 'overall';

/** 综合检验报告 */
export interface VerificationReport {
  readonly generatedAt: number;
  readonly results: ReadonlyArray<VerificationResult>;
  readonly overallScore: number;
  readonly passedCount: number;
  readonly failedCount: number;
  readonly warnings: ReadonlyArray<string>;
  readonly philosophyDepth: PhilosophyAssessment;
}

/** 哲学深度评估 */
export interface PhilosophyAssessment {
  readonly ontologyScore: number;
  readonly epistemologyScore: number;
  readonly methodologyScore: number;
  readonly ethicsScore: number;
  readonly aestheticsScore: number;
  readonly culturalScore: number;
  readonly weightedTotal: number;
}

export const VERIFICATION_CATEGORY_LABELS: Record<VerificationCategory, string> = {
  'wu-you-balance': '有无平衡',
  'feedback-integrity': '反馈完整性',
  'qi-fluency': '气流通畅性',
  'yin-yang-balance': '阴阳平衡',
  'wu-wei-verification': '无为验证',
  'naming-convention': '命名规范',
  'architecture-depth': '架构深度',
  'overall': '综合评估',
};
