import {
  MulticastChannel,
  runSaga,
  RunSagaOptions,
  SagaMonitor,
  stdChannel,
} from "@redux-saga/core";
import getSaga from './getSaga';
import Plugin from './Plugin';
import invariant from 'invariant';
import { isPlainObject } from './utils';
import { effectSymbol, namespaceSymbol } from './constants';

type EffectOpt = {
  type: string;
  options?: object;
}

function namespace(namespace) {
  return function(target) {
    target.prototype[namespaceSymbol] = namespace;
  }
}

function effects(type: string = 'takeEvery', options?: null | object) {
  const effectOpt: EffectOpt = { type };
  if (isPlainObject(options)) {
    effectOpt.options = options;
  }
  return function(target, key, des) {
    des.value[effectSymbol]= {type, options};
    return {
      ...des,
      enumerable: true
    };
  }
}

const channel = stdChannel();

const dispatch = (action) => {
  return new Promise((resolve, reject) => {
    channel.put({
      __dva_resolve: resolve,
      __dva_reject: reject,
      ...action,
    });
  });
};

function create(hooksAndOpts = {}, createOpts = {}) {
  const plugin = new Plugin();
  const stores = {};

  const io = {
    channel,
    dispatch: channel.put,
    getState: () => stores
  }

  function noop () {}
  const onError = noop;
  const onEffect = [];

  function _getStores() {
    return stores;
  }

  function _registeredEffects (store: any) {
    invariant(!stores[store[namespaceSymbol]], `saga-mobx: store namespace ${store[namespaceSymbol]} is multiple`);
    stores[store[namespaceSymbol]]= store;
    runSaga(io, getSaga(store, onError, plugin.get('onEffect')))
  }

  const app = {
    getStores: _getStores,
    registeredEffects: _registeredEffects,
    use: plugin.use.bind(plugin, stores),
  }

  return app;
}

export { effects, namespace, dispatch, create };
export * from 'mobx';
export * from 'mobx-react';
