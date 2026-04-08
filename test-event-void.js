import { DaoNothingVoid } from './packages/daoNothing/src/event-void.js';

function testListenerCount() {
  const voidInstance = new DaoNothingVoid();
  
  // 添加监听器
  voidInstance.on('observed', () => console.log('observed'));
  voidInstance.on('test', () => console.log('test'));
  
  // 获取 stillness 对象
  const stillness = voidInstance.stillness();
  
  // 测试 listenerCount 方法
  console.log('All listeners count:', stillness.listenerCount());
  console.log('Observed listeners count:', stillness.listenerCount('observed'));
  console.log('Test listeners count:', stillness.listenerCount('test'));
  
  // 直接调用实例方法进行对比
  console.log('Direct listenerCount call for observed:', voidInstance.listenerCount('observed'));
  console.log('Direct listenerCount call for test:', voidInstance.listenerCount('test'));
  console.log('Event names:', voidInstance.eventNames());
}

testListenerCount();