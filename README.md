# saga-mobx
mobx + saga，让mobx拥有强大的异步流的处理能力

# 开始

安装

```
npm install redux-saga
```

创建Saga (使用Store的计数器例子)
```javascript
import { makeObservable, observable, namespace, effect, action } from 'saga-mobx'

const getCountUrl = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1);
    }, 2000)
  })
}

@namespace('testStore')
class Store {
  constructor() {
    makeObservable(this)
  }

  @observable
  count: 0,

  @action
  changeCount(count) {
    this.count = count;
  }

  @effect()
  *getCount({ paylod }, { call }) {
    const count = yield call(getCountUrl);
    this.changeCount(count);
  }
}
const store = new Store();

export default store;
```

注册saga
```javascript
import { create } from 'saga-mobx';
import store from './store'
const app = create();
app.registeredEffects(store);
```

使用inject注入store,触发effect改变count
```javascript
import { dispatch, observer, inject } from 'saga-mobx'

const App = (props: any) => {
  const { testStore } = props;
  const loadingStore = props.loading;
  return <>
    <a javascript="void(0);" onClick={() => dispatch({type: 'testStore/test'})}>获取次数</a>
    <p>次数, { testStore.count }</p>
  </>
};

export default inject('testStore')(observer(App));
```

### 内置异步流处理方案

takeLeading

上一个getCount处理结束后，才会再次执行getCount
```javascript
@effect('takeLeading')
*getCount({ paylod }, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

takeLatest

接收getCount调用指令后，默认取消上次未完成的getCount
```javascript
@effect('takeLatest')
*getCount({ paylod }, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

debounce

防抖，默认被触发时立即调用getCount，配置leading: false时，延时后调用
```javascript
@effect('debounce', {ms: 800})
*getCount({ paylod }, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

throttle

截流
```javascript
@effect('throttle', {ms: 800})
*getCount({ paylod }, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

poll

接收开始指令后，间隔800ms,自动调用一次getCount，接受结束指令后，终止调用
```javascript
@effect('poll', {delayMs: 800})
*getCount({ paylod }, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}

// 触发
// dispatch({type: 'testStore/getCount-start'});

// 结束
// // dispatch({type: 'testStore/getCount-end'});
```
