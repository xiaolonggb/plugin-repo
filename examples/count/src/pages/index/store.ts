import { effect, namespace, makeObservable, observable, action } from 'saga-mobx';
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
  *test2({ payload }: AnyAction, { put, call }: EffectsCommandMap) {
    console.log('payload', payload)
    this.changeValue(this.value + 1);
  }

  @effect()
  *test1({ payload }: AnyAction, { put, call, select }: EffectsCommandMap) {
    const count: number = yield call(delay, 2000);
    yield put({type: 'test2', payload: {commit: 1}});
    return count;
  }
}
// 风霜寂寞，掉落在你的怀中
const store = new Store();
const store1 = new Store1();
export { store, store1 };