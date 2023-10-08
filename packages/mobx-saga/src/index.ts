/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable @typescript-eslint/no-shadow */
import { runSaga, stdChannel } from '@redux-saga/core';
import getSaga from './getSaga';
import Plugin from './Plugin';
import invariant from 'invariant';
import warning from 'warning';
import { isPlainObject } from './utils';
import {
  effectSymbol,
  namespaceSymbol,
  NAMESPACE_SEP,
  PACKAGE_NAME,
} from './constants';
import createLoading from './plugins/loading';
import Container from './Container';

type EffectOpt = {
  type: string;
  options?: object;
};
type EffectType =
  | 'takeEvery'
  | 'takeLeading'
  | 'debounce'
  | 'poll'
  | 'takeLatest'
  | 'watcher'
  | 'throttle';

interface Action<T = any> {
  type: T;
}
export interface AnyAction extends Action<string> {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any;
}

export interface EffectsCommandMap {
  put: <A extends AnyAction>(action: A) => any;
  call: Function;
  select: Function;
  take: Function;
  cancel: Function;
  [key: string]: any;
}

const channel = stdChannel();

const dispatch = (action: AnyAction) => {
  return new Promise((resolve, reject) => {
    channel.put({
      __dva_resolve: resolve,
      __dva_reject: reject,
      ...action,
    });
  });
};

// eslint-disable-next-line @typescript-eslint/no-shadow
function namespace(namespace: string) {
  return function(target) {
    // eslint-disable-next-line no-param-reassign
    target.prototype[namespaceSymbol] = namespace;
  };
}

function effect(type: EffectType = 'takeEvery', options?: null | object) {
  const effectOpt: EffectOpt = { type };
  if (isPlainObject(options)) {
    effectOpt.options = options;
  }
  return function(target, key, des) {
    const value = function(payload) {
      warning(this, `store context calls ${key} method are recommended`);
      const namespace = target[namespaceSymbol];
      if (!namespace) {
        invariant(
          namespace,
          `${PACKAGE_NAME}: store must have a unique namespace to call effect(${key})`,
        );
      }
      return dispatch({ type: `${namespace}${NAMESPACE_SEP}${key}`, payload });
    };
    value[effectSymbol] = { type, options, effectFn: des.value };
    return {
      ...des,
      value,
      enumerable: true,
    };
  };
}

function create() {
  const plugin = new Plugin();
  const stores = {};

  const io = {
    channel,
    dispatch: channel.put,
    getState: () => stores,
  };

  const onError = (err, extension) => {
    if (err) {
      if (typeof err === 'string') err = new Error(err);
      err.preventDefault = () => {
        err._dontReject = true;
      };
      plugin.apply('onError', err => {
        throw new Error(err.stack || err);
      })(err, dispatch, extension);
    }
  };

  function _getStores() {
    return stores;
  }

  function _registeredEffects(store: any) {
    if (!store) {
      return;
    }
    const namespace = store[namespaceSymbol];
    if (!namespace) {
      return;
    }
    invariant(
      !stores[store[namespaceSymbol]],
      `${PACKAGE_NAME}: store namespace ${store[namespaceSymbol]} is multiple`,
    );
    stores[store[namespaceSymbol]] = store;
    runSaga(io, getSaga(store, onError, plugin.get('onEffect')));
  }

  /*
   *  取消注册
   */
  function _unregisterEffects(store) {
    const storeNamespace = store[namespaceSymbol];
    // 取消 effects
    dispatch({ type: `${storeNamespace}/@@CANCEL_EFFECTS` });

    // 移除store
    Object.keys(stores).forEach((namespace: string) => {
      if (storeNamespace === namespace) {
        delete stores[namespace];
      }
    });
  }

  const app = {
    getStores: _getStores,
    registeredEffects: _registeredEffects,
    unregisterEffects: _unregisterEffects,
    use: plugin.use.bind(plugin, stores),
  };

  return app;
}

export { effect, namespace, dispatch, createLoading, Container };
export default create;
