import React, { PureComponent } from 'react';
import { observer, inject} from 'mobx-react';
import { dispatch } from 'saga-mobx';
import store from './store';

const App = (props: any) => {
  const loadingStore = props.loading;
  return <><p onClick={() => dispatch({type: 'storeOne/test-start'})}>次数, { store.value }</p>
  <p>{loadingStore.global ? '加载中。。。' : '加载完毕'}</p>
  </>
};

export default inject('loading')(observer(App));
