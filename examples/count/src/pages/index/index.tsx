import React, { PureComponent } from 'react'
// import { store, store1 } from './store'
import { dispatch, observer, inject } from 'saga-mobx'

// @inject('storeOne')
// @inject('storeTwo')
// @observer
// class App extends PureComponent {
//   render () {
//     console.log(this.props)
//   const {storeOne, storeTwo} = this.props;
//   console.log(storeOne, storeTwo);
//   return <><p onClick={() => dispatch({type: 'storeOne/test'})}>次数, { storeOne.value }</p>
//   <p onClick={() => dispatch({type: 'storeTwo/@@CANCEL_EFFECTS'})}>放弃任务</p>
//   <p onClick={() => dispatch({type: 'storeTwo/test1', payload: {count: 1}}).then((data) => console.log('data', data))}>次数, { storeTwo.value }</p></>
//   }
// };

const App = (props: any) => {
  const {storeOne, storeTwo} = props;
  const loadingStore = props.loading;
  return <><p onClick={() => dispatch({type: 'storeOne/test-start'})}>次数, { storeOne.value }</p>
  <p>{loadingStore.global ? '加载中。。。' : '加载完毕'}</p>
  <p onClick={() => dispatch({type: 'storeTwo/@@CANCEL_EFFECTS'})}>放弃任务</p>
  <p onClick={() => dispatch({type: 'storeTwo/test1', payload: {count: 1}}).then((data) => console.log('data', data))}>次数, { storeTwo.value }</p></>
};

export default inject('loading', 'storeTwo', 'storeOne')(observer(App));
