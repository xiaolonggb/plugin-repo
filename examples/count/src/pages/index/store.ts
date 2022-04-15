import { effects, namespace, makeObservable, observable, action, create } from '../../../../../es/index';

type Action = {
  type: 'nihao',
  payload: any
}

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
  
  @effects()
  *test() {
    yield new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1000)
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
  @effects()
  *test2({ payload }, { put, call }) {
    console.log('payload', payload)
    console.log('zhixingle!!')
    this.changeValue(this.value + 1);
  }

  @effects()
  *test1({ payload }: Action, { put, call, select }) {
    // 怎么这么牛逼呢
    // 风霜寂寞，掉落在你的怀中，人生风景在游走，每当孤独我停留，不远地方等着我，岁月如旧在穿梭
    const storeOne: {changeValue: Function } = yield select((stores: any) => stores.storeOne);
    storeOne.changeValue(5);
    console.log('store', store)
    console.log('payload', payload)
    const count: number = yield call(delay, 2000);
    yield put({type: 'test2', payload: {commit: 1}});
    return 'resr';
  }
}
// 风霜寂寞，掉落在你的怀中
const store = new Store();
const store1 = new Store1();
export { store, store1 };