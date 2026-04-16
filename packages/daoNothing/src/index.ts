// 帛书依据："无名，万物之始也；有名，万物之母也"（甲本·一章）
// 哲学阐释：
//   "无名"（Nameless）—— 未被命名、未被定义的原初状态，是万物生成的起点
//   "有名"（Named）—— 已被命名、已被定义的显化状态，是万物存在的母体
// 设计原则：
//   此模块代表"无名"状态，不导出任何运行时实例。
//   仅导出类型定义、接口契约与纯函数式守卫。
//   它是整个系统的"类型论根基"——定义类型空间，但不创建实例。

export type { Void, Potential, Origin } from './types';
export type { EmptyInterface, ExistenceContract, MutabilityContract } from './contracts';
export type { WuWeiConstraint, ZiRanInvariant } from './constraints';
export type { DaoNothingEvent } from './event-void';

export { daoIsNothing, daoBirthFromNothing } from './guards';
export { daoNothingVoid, DaoNothingVoid } from './event-void';

// 函数式错误处理工具 —— DaoOption<T> + DaoResult<T,E>
export type { DaoSome, DaoNone, DaoOption } from './result';
export type { DaoOk, DaoErr, DaoResult } from './result';
export {
  daoSome,
  daoNone,
  daoIsSome,
  daoIsNone,
  daoFromNullable,
  daoMap,
  daoUnwrap,
  daoUnwrapOrThrow,
  daoOk,
  daoErr,
  daoIsOk,
  daoIsErr,
  daoTry,
  daoTryAsync,
  daoMapResult,
  daoMapErr,
  daoUnwrapResult,
  daoUnwrapOr,
} from './result';

