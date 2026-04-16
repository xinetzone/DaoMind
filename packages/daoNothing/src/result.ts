/** DaoOption + DaoResult —— 函数式错误处理工具
 * 帛书依据："知常曰明，不知常，妄作，凶"（乙本·十六章）
 * 设计原则：显式表达"有值/无值"和"成功/失败"，
 *           以结构化类型替代 null / undefined / throw，
 *           让调用者在类型系统层面被迫处理所有情况。 */

/* ============================================================
 * DaoOption<T> —— 可能有值，也可能无值
 * ============================================================ */

export interface DaoSome<T> {
  readonly _tag: 'some';
  readonly value: T;
}

export interface DaoNone {
  readonly _tag: 'none';
}

export type DaoOption<T> = DaoSome<T> | DaoNone;

/** 构造一个有值的 Some */
export function daoSome<T>(value: T): DaoSome<T> {
  return { _tag: 'some', value };
}

/** 构造一个空值的 None */
export function daoNone(): DaoNone {
  return { _tag: 'none' };
}

/** 判断是否为 Some */
export function daoIsSome<T>(opt: DaoOption<T>): opt is DaoSome<T> {
  return opt._tag === 'some';
}

/** 判断是否为 None */
export function daoIsNone<T>(opt: DaoOption<T>): opt is DaoNone {
  return opt._tag === 'none';
}

/** 将 T | null | undefined 转换为 DaoOption<T> */
export function daoFromNullable<T>(value: T | null | undefined): DaoOption<T> {
  return value == null ? daoNone() : daoSome(value);
}

/** 映射 Some 的内部值；None 透传 */
export function daoMap<T, U>(opt: DaoOption<T>, fn: (value: T) => U): DaoOption<U> {
  return daoIsSome(opt) ? daoSome(fn(opt.value)) : daoNone();
}

/** 若为 Some 则返回内部值，否则返回 fallback */
export function daoUnwrap<T>(opt: DaoOption<T>, fallback: T): T {
  return daoIsSome(opt) ? opt.value : fallback;
}

/** 若为 Some 则返回内部值，否则抛出错误 */
export function daoUnwrapOrThrow<T>(opt: DaoOption<T>, message?: string): T {
  if (daoIsSome(opt)) return opt.value;
  throw new Error(message ?? '[daoNothing] 尝试解包空值（DaoNone）');
}

/* ============================================================
 * DaoResult<T, E> —— 成功或失败
 * ============================================================ */

export interface DaoOk<T> {
  readonly _tag: 'ok';
  readonly value: T;
}

export interface DaoErr<E> {
  readonly _tag: 'err';
  readonly error: E;
}

export type DaoResult<T, E = Error> = DaoOk<T> | DaoErr<E>;

/** 构造成功结果 */
export function daoOk<T>(value: T): DaoOk<T> {
  return { _tag: 'ok', value };
}

/** 构造失败结果 */
export function daoErr<E>(error: E): DaoErr<E> {
  return { _tag: 'err', error };
}

/** 判断是否为 Ok */
export function daoIsOk<T, E>(result: DaoResult<T, E>): result is DaoOk<T> {
  return result._tag === 'ok';
}

/** 判断是否为 Err */
export function daoIsErr<T, E>(result: DaoResult<T, E>): result is DaoErr<E> {
  return result._tag === 'err';
}

/** 将可能抛出异常的同步函数包裹为 DaoResult */
export function daoTry<T>(fn: () => T): DaoResult<T, Error> {
  try {
    return daoOk(fn());
  } catch (e) {
    return daoErr(e instanceof Error ? e : new Error(String(e)));
  }
}

/** 将可能抛出异常的异步函数包裹为 DaoResult */
export async function daoTryAsync<T>(fn: () => Promise<T>): Promise<DaoResult<T, Error>> {
  try {
    return daoOk(await fn());
  } catch (e) {
    return daoErr(e instanceof Error ? e : new Error(String(e)));
  }
}

/** 映射 Ok 的内部值；Err 透传 */
export function daoMapResult<T, U, E>(
  result: DaoResult<T, E>,
  fn: (value: T) => U,
): DaoResult<U, E> {
  return daoIsOk(result) ? daoOk(fn(result.value)) : result;
}

/** 映射 Err 的内部错误；Ok 透传 */
export function daoMapErr<T, E, F>(
  result: DaoResult<T, E>,
  fn: (error: E) => F,
): DaoResult<T, F> {
  return daoIsErr(result) ? daoErr(fn(result.error)) : result;
}

/** 若为 Ok 则返回内部值，否则抛出错误 */
export function daoUnwrapResult<T, E>(result: DaoResult<T, E>): T {
  if (daoIsOk(result)) return result.value;
  const err = (result as DaoErr<E>).error;
  throw err instanceof Error ? err : new Error(String(err));
}

/** 若为 Ok 则返回内部值，否则返回 fallback */
export function daoUnwrapOr<T, E>(result: DaoResult<T, E>, fallback: T): T {
  return daoIsOk(result) ? result.value : fallback;
}
