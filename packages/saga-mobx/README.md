# saga-mobx
mobx + saga，让mobx拥有强大的异步流的处理能力

# 开始

安装

```
npm install mobx-saga
```

创建Saga (使用Store的计数器例子)
```javascript
import { makeObservable, observable, action } from 'mobx'
import { namespace, effect } from 'saga-mobx'

const getCountUrl = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1);
    }, 2000)
  })
}

@namespace('countStore')
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
  *getCount(paylod, { call }) {
    const count = yield call(getCountUrl);
    this.changeCount(count);
  }
}
const store = new Store();

export default store;
```

注册saga
```javascript
import React from 'react';
import { Provider } from 'mobx-react';
import { create } from 'saga-mobx';
import App from './app';
import store from './store';
const app = create();
app.registeredEffects(store);

React.render(
  <Provider {...app.getStore()}>
    <App />
  </Provider>
, document.getElementById('#root'));
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
import { observer, inject } from 'mobx-react';
import store from './store';

const App = observer(props: any) => {
  return <>
    <a javascript="void(0);" onClick={() => store.getCount()}>获取次数</a>
    <p>次数, { store.count }</p>
  </>
});

export default App;
```

### 内置异步流处理方案

takeLeading

上一个getCount处理结束后，才会再次执行getCount
```javascript
@effect('takeLeading')
*getCount(paylod, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

takeLatest

接收getCount调用指令后，默认取消上次未完成的getCount
```javascript
@effect('takeLatest')
*getCount(paylod, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

debounce

防抖，默认被触发时立即调用getCount，配置leading: false时，延时后调用
```javascript
@effect('debounce', {ms: 800})
*getCount(paylod, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

throttle

截流
```javascript
@effect('throttle', {ms: 800})
*getCount(paylod, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}
```

poll

接收开始指令后，间隔800ms,自动调用一次getCount，接受结束指令后，终止调用
```javascript
@effect('poll', {delay: 800})
*getCount(paylod, { call }) {
  const count = yield call(getCountUrl);
  this.changeCount(count);
}

// 触发
// dispatch({type: 'countStore/getCount-start'});

// 结束
// // dispatch({type: 'countStore/getCount-end'});
```

### loading状态管理

开启
```javascript
import createLoading from 'saga-mobx/plugins/loading'

app.use(createLoading());
```

使用
```javascript
import { observer } from 'mobx-react';
import { inject } from 'saga-mobx';
import store from './store';

const App = () => {
  const loadingStore = props.loading;
  return <>
    <a javascript="void(0);" onClick={() => store.getCount()}>获取次数</a>
    { loadingStore.effects['countStore/getCount'] ? '获取中...' : <p>次数, { store.count }</p>}
  </>
}

export default inject('loading')(observer(App));
```