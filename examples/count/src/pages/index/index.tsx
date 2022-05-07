import React, { PureComponent } from 'react';
import { store, store1 } from './store'
import { observer, inject } from 'mobx-react';

const App = (props: any) => {
  const loadingStore = props.loading;
  return <><p>{loadingStore.global ? '加载中。。。' : '加载完毕'}</p>
  <p onClick={() => store1.test1({count: 1}).then((data) => console.log('data', data))}>次数, { store1.value }</p></>
};

export default inject('loading')(observer(App));
