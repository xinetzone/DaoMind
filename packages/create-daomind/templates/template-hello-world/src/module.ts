import type { HelloModule } from './types';

/**
 * 创建 Hello 模块实例
 * 
 * 这个函数执行"命名"过程，将类型（无名）转化为实例（有名）
 * 
 * @param message - 要显示的消息
 * @param language - 消息的语言，默认为 'en'
 * @returns HelloModule 实例
 * 
 * @example
 * ```typescript
 * const hello = createHello('Hello, World!', 'en');
 * console.log(hello.message); // 'Hello, World!'
 * ```
 */
export function createHello(message: string, language = 'en'): HelloModule {
  return {
    // 标记从"无名"到"有名"的转化
    existentialType: 'anything',
    message,
    language,
  };
}

/**
 * 格式化 Hello 消息用于显示
 * 
 * @param hello - HelloModule 实例
 * @returns 格式化的字符串
 */
export function formatHello(hello: HelloModule): string {
  return `[${hello.language.toUpperCase()}] ${hello.message}`;
}
