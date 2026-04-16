import { daoIsNothing, daoBirthFromNothing } from '../guards';

describe('daoIsNothing', () => {
  test('should return true for undefined', () => {
    expect(daoIsNothing(undefined)).toBe(true);
  });

  test('should return true for null', () => {
    expect(daoIsNothing(null)).toBe(true);
  });

  test('should return false for non-null, non-undefined values', () => {
    expect(daoIsNothing(0)).toBe(false);
    expect(daoIsNothing('')).toBe(false);
    expect(daoIsNothing(false)).toBe(false);
    expect(daoIsNothing({})).toBe(false);
    expect(daoIsNothing([])).toBe(false);
    expect(daoIsNothing(42)).toBe(false);
    expect(daoIsNothing('hello')).toBe(false);
  });
});

describe('daoBirthFromNothing', () => {
  test('should return the value when it is not nothing', () => {
    const value = 42;
    expect(daoBirthFromNothing<number>(value)).toBe(value);

    const obj = { foo: 'bar' };
    expect(daoBirthFromNothing<{ foo: string }>(obj)).toBe(obj);
  });

  test('should throw error when value is undefined', () => {
    expect(() => daoBirthFromNothing<number>(undefined)).toThrow(/无法从绝对的"无名".*中生有/);
  });

  test('should throw error when value is null', () => {
    expect(() => daoBirthFromNothing<number>(null)).toThrow(/无法从绝对的"无名".*中生有/);
  });

  test('should properly type assert the returned value', () => {
    const value = 'test';
    const result = daoBirthFromNothing<string>(value);
    // This should compile without type errors
    expect(typeof result.toUpperCase()).toBe('string');
  });
});
