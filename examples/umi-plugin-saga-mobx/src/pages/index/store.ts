import { makeObservable, observable, action } from 'mobx';
import { effect, namespace } from 'saga-mobx';
import type { AnyAction, EffectsCommandMap } from 'saga-mobx';

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
// 风霜寂寞，掉落在你的怀中
const store = new Store();
export default store;