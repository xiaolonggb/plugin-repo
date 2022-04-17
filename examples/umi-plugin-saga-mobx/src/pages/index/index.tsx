import React, { PureComponent } from 'react';
import { dispatch, observer, inject } from 'saga-mobx';

const App = (props: any) => {
  const {storeOne, storeTwo} = props;
  const loadingStore = props.loading;
  return <><p onClick={() => dispatch({type: 'storeOne/test-start'})}>次数, { storeOne.value }</p>
  <p>{loadingStore.global ? '加载中。。。' : '加载完毕'}</p>
  </>
};

export default inject('loading', 'storeOne')(observer(App));
