import { makeObservable, observable, action } from 'mobx';
import { effect, namespace } from 'saga-mobx';
import type { AnyAction, EffectsCommandMap } from 'saga-mobx';

const delay = (ms: number) => new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, ms)
}) 
type RootStore = { value: number };

@namespace('storeOne')
class Store {
  constructor() {
    makeObservable(this)
  }

  @observable
  value = 0;
  
  @action
  changeValue(value: number) {
    this.value = value;
  }
  
  @effect('poll', {delay: 1000})
  *test(action: AnyAction) {
    console.log(action);
    yield new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 3000)
    })
    this.changeValue(this.value + 1);
  }
}

@namespace('storeTwo')
class Store1 {
  constructor() {
    makeObservable(this)
  }

  @observable
  value = 0;
  
  @action
  changeValue(value: number) {
    this.value = value;
  }

  // 注册一个effect
  @effect()
  *test2(payload: any, sagaEffects?: EffectsCommandMap) {
    console.log('payload', payload)
    this.changeValue(this.value + 1);
  }

  @effect()
  *test1(payload: any, sagaEffects?: EffectsCommandMap) {
    console.log('payload---', payload)
    const count: number = yield sagaEffects?.call(delay, 2000);
    yield this.test2({commit: 1});
    return count;
  }
}
// 风霜寂寞，掉落在你的怀中
const store = new Store();
const store1 = new Store1();
console.log('store---', store1)
export { store, store1 };