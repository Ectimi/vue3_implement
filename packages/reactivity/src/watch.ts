import { isFunction, isObject } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { isReactive } from './reactive';

//要考虑循环引用的问题
function traversal(value: { [key in string]: any }, set = new Set()) {
  //不是对象就不递归了
  if (!isObject(value)) return value;

  if (set.has(value)) return value;

  set.add(value);

  let key: string;
  for (key in value) {
    traversal(value[key], set);
  }

  return value;
}

/**
 *
 * @param source 用户传入的对象
 * @param cb 回调函数
 */
export function watch(source: unknown, cb: Function) {
  let getter: Function = () => {};

  if (isReactive(source)) {
    //对用户传入的数据进行递归循环，只要循环就会访问对象上的每一个属性，访问属性的时候会收集effect
    getter = () => traversal(source as ProxyConstructor);
  } else if (isFunction(source)) {
    getter = source as Function;
  }

  let cleanup: Function;
  const onCleanup = (fn: Function) => {
    cleanup = fn; //保存用户函数
  };
  let oldValue: any;
  const job = () => {
    if (cleanup) cleanup(); //下一次watch开始触发上一次watch的清理
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job); //监控自己构造的函数，变化后重新执行job
  oldValue = effect.run();
}
