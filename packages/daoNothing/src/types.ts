// 帛书依据:"无名，万物之始也"（甲本·一章）
// "无名"状态：未被命名、未被定义的原初类型空间
// 设计原则：此文件仅包含类型定义，不含任何运行时实现

/** 虚空本身 —— "无名"的极致，无法被实例化的底层类型 */
export type Void = never;

/** 潜在性 —— "无名"向"有名"转化的中间态，可能成为任何类型的未确定状态 */
export type Potential<T = unknown> = T extends Void ? never : T | undefined;

/** 万物之始 —— "无名"状态的类型表达，所有类型空间的源头 */
export type Origin = Potential<unknown>;

// ── 自然意象基础类型（v2.46.4）─────────────────────────────────

/** 脉动配置 —— pulse 的纯类型描述，道的律动节拍 */
export type DaoPulseConfig = {
  readonly interval: number;
  readonly amplitude: number;
};

/** 流过滤器 —— stream 函数类型，道的自然流动 */
export type DaoStreamFilter<T> = (value: T) => boolean;

/** 律动序列 —— rhythm 的纯类型，周期性波动模式 */
export type DaoRhythmPattern = ReadonlyArray<number>;

/** 和谐比率 —— harmony 的纯类型，0~1 范围的调和系数 */
export type DaoHarmonyScore = number;

/** 阴影层级 —— shadow 的枚举，光影深浅的道性表达 */
export type DaoShadowDepth = 'light' | 'medium' | 'deep';

// ── 自然意象符号标识（用于反射/依赖注入标签）─────────────────────
/** 流动性标识 — flow token */
export const daoFlowToken = Symbol('dao.flow');
/** 和谐标识 — harmony token */
export const daoHarmonyToken = Symbol('dao.harmony');
/** 律动标识 — rhythm token */
export const daoRhythmToken = Symbol('dao.rhythm');
/** 流通标识 — stream token */
export const daoStreamToken = Symbol('dao.stream');
/** 脉冲标识 — pulse token */
export const daoPulseToken = Symbol('dao.pulse');

