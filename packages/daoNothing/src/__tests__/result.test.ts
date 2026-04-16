/**
 * daoNothing/result.ts 单元测试
 * 覆盖：DaoOption<T> 全部 API + DaoResult<T,E> 全部 API
 */

import {
  // DaoOption
  daoSome,
  daoNone,
  daoIsSome,
  daoIsNone,
  daoFromNullable,
  daoMap,
  daoUnwrap,
  daoUnwrapOrThrow,
  // DaoResult
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
} from '../result';

/* ================================================================
 * DaoOption<T>
 * ================================================================ */

describe('DaoOption — 构造', () => {
  it('daoSome 存储 _tag=some 与 value', () => {
    const opt = daoSome(42);
    expect(opt._tag).toBe('some');
    expect(opt.value).toBe(42);
  });

  it('daoNone 存储 _tag=none', () => {
    const opt = daoNone();
    expect(opt._tag).toBe('none');
  });

  it('daoSome 支持复杂对象', () => {
    const obj = { id: 'x', name: 'dao' };
    const opt = daoSome(obj);
    expect(opt.value).toBe(obj);
  });
});

describe('DaoOption — 判断', () => {
  it('daoIsSome: Some → true', () => {
    expect(daoIsSome(daoSome(1))).toBe(true);
  });

  it('daoIsSome: None → false', () => {
    expect(daoIsSome(daoNone())).toBe(false);
  });

  it('daoIsNone: None → true', () => {
    expect(daoIsNone(daoNone())).toBe(true);
  });

  it('daoIsNone: Some → false', () => {
    expect(daoIsNone(daoSome('x'))).toBe(false);
  });
});

describe('DaoOption — daoFromNullable', () => {
  it('非 null 值 → Some', () => {
    const opt = daoFromNullable(0);
    expect(daoIsSome(opt)).toBe(true);
    if (daoIsSome(opt)) expect(opt.value).toBe(0);
  });

  it('null → None', () => {
    expect(daoIsNone(daoFromNullable(null))).toBe(true);
  });

  it('undefined → None', () => {
    expect(daoIsNone(daoFromNullable(undefined))).toBe(true);
  });

  it('空字符串 → Some（非 null）', () => {
    expect(daoIsSome(daoFromNullable(''))).toBe(true);
  });
});

describe('DaoOption — daoMap', () => {
  it('Some: 映射内部值', () => {
    const result = daoMap(daoSome(3), (x) => x * 2);
    expect(daoIsSome(result)).toBe(true);
    if (daoIsSome(result)) expect(result.value).toBe(6);
  });

  it('None: 透传 None，不调用 fn', () => {
    const fn = jest.fn(() => 99);
    const result = daoMap(daoNone(), fn);
    expect(daoIsNone(result)).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('DaoOption — daoUnwrap', () => {
  it('Some: 返回内部值', () => {
    expect(daoUnwrap(daoSome('hello'), 'fallback')).toBe('hello');
  });

  it('None: 返回 fallback', () => {
    expect(daoUnwrap(daoNone(), 'fallback')).toBe('fallback');
  });
});

describe('DaoOption — daoUnwrapOrThrow', () => {
  it('Some: 返回内部值', () => {
    expect(daoUnwrapOrThrow(daoSome(7))).toBe(7);
  });

  it('None: 抛出默认错误', () => {
    expect(() => daoUnwrapOrThrow(daoNone())).toThrow('尝试解包空值');
  });

  it('None: 抛出自定义错误消息', () => {
    expect(() => daoUnwrapOrThrow(daoNone(), '找不到用户')).toThrow('找不到用户');
  });
});

/* ================================================================
 * DaoResult<T, E>
 * ================================================================ */

describe('DaoResult — 构造', () => {
  it('daoOk 存储 _tag=ok 与 value', () => {
    const res = daoOk('success');
    expect(res._tag).toBe('ok');
    expect(res.value).toBe('success');
  });

  it('daoErr 存储 _tag=err 与 error', () => {
    const err = new Error('失败了');
    const res = daoErr(err);
    expect(res._tag).toBe('err');
    expect(res.error).toBe(err);
  });

  it('daoErr 支持非 Error 类型', () => {
    const res = daoErr(404);
    expect(res.error).toBe(404);
  });
});

describe('DaoResult — 判断', () => {
  it('daoIsOk: Ok → true', () => {
    expect(daoIsOk(daoOk(1))).toBe(true);
  });

  it('daoIsOk: Err → false', () => {
    expect(daoIsOk(daoErr('x'))).toBe(false);
  });

  it('daoIsErr: Err → true', () => {
    expect(daoIsErr(daoErr('x'))).toBe(true);
  });

  it('daoIsErr: Ok → false', () => {
    expect(daoIsErr(daoOk(0))).toBe(false);
  });
});

describe('DaoResult — daoTry', () => {
  it('成功执行 → Ok', () => {
    const res = daoTry(() => 1 + 1);
    expect(daoIsOk(res)).toBe(true);
    if (daoIsOk(res)) expect(res.value).toBe(2);
  });

  it('抛出 Error → Err with Error', () => {
    const res = daoTry(() => { throw new Error('boom'); });
    expect(daoIsErr(res)).toBe(true);
    if (daoIsErr(res)) expect(res.error.message).toBe('boom');
  });

  it('抛出非 Error → Err with Error(String(...))', () => {
    const res = daoTry(() => { throw 'string error'; });
    expect(daoIsErr(res)).toBe(true);
    if (daoIsErr(res)) expect(res.error.message).toBe('string error');
  });
});

describe('DaoResult — daoTryAsync', () => {
  it('resolve → Ok', async () => {
    const res = await daoTryAsync(async () => 'done');
    expect(daoIsOk(res)).toBe(true);
    if (daoIsOk(res)) expect(res.value).toBe('done');
  });

  it('reject → Err', async () => {
    const res = await daoTryAsync(async () => { throw new Error('async fail'); });
    expect(daoIsErr(res)).toBe(true);
    if (daoIsErr(res)) expect(res.error.message).toBe('async fail');
  });
});

describe('DaoResult — daoMapResult', () => {
  it('Ok: 映射内部值', () => {
    const res = daoMapResult(daoOk(5), (x) => x * 10);
    expect(daoIsOk(res)).toBe(true);
    if (daoIsOk(res)) expect(res.value).toBe(50);
  });

  it('Err: 透传，不调用 fn', () => {
    const fn = jest.fn(() => 99);
    const res = daoMapResult(daoErr('e'), fn);
    expect(daoIsErr(res)).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('DaoResult — daoMapErr', () => {
  it('Err: 映射内部错误', () => {
    const res = daoMapErr(daoErr(404), (code) => `HTTP ${code}`);
    expect(daoIsErr(res)).toBe(true);
    if (daoIsErr(res)) expect(res.error).toBe('HTTP 404');
  });

  it('Ok: 透传，不调用 fn', () => {
    const fn = jest.fn();
    const res = daoMapErr(daoOk('x'), fn);
    expect(daoIsOk(res)).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('DaoResult — daoUnwrapResult', () => {
  it('Ok: 返回内部值', () => {
    expect(daoUnwrapResult(daoOk('value'))).toBe('value');
  });

  it('Err（Error 实例）: 抛出该 Error', () => {
    const err = new Error('解包失败');
    expect(() => daoUnwrapResult(daoErr(err))).toThrow('解包失败');
  });

  it('Err（非 Error）: 抛出 Error(String(...))', () => {
    expect(() => daoUnwrapResult(daoErr('code_500'))).toThrow('code_500');
  });
});

describe('DaoResult — daoUnwrapOr', () => {
  it('Ok: 返回内部值', () => {
    expect(daoUnwrapOr(daoOk(42), 0)).toBe(42);
  });

  it('Err: 返回 fallback', () => {
    expect(daoUnwrapOr(daoErr(new Error()), -1)).toBe(-1);
  });
});
