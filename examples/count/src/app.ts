import React from 'react';
import { Provider, inject, create } from 'saga-mobx';
import createLoading from 'saga-mobx/es/plugins/loading';
import { store, store1 } from './pages/index/store';
console.log('nihao')
const app = create();
app.use(createLoading());
app.registeredEffects(store);
app.registeredEffects(store1);

export function rootContainer(container) {
  console.log(app.getStores())
  return React.createElement(Provider, {...app.getStores()}, container);
}
