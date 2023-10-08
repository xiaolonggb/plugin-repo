---
title: umi-plugin-mobx-saga
order: 3
nav:
  order: 2
  title: 插件类
  path: /plugins
group:
  title: ' '
  path: /plugins/umi-plugin-mobx-saga
---

# umi-plugin-mobx-saga

umi 插件,安装后自动注册 store、自动接入 loading 插件，实现 mobx-saga 的开箱即用

# 开始

安装

```
npm install umi-plugin-mobx-saga
```

创建 Saga (使用 Store 的计数器例子)

```javascript
import { makeObservable, observable, action } from 'mobx'
import { namespace, effect } from 'mobx-saga'

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
