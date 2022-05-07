import invariant from 'invariant';
import warning from 'warning';
import * as sagaEffects from 'redux-saga/effects';
import { NAMESPACE_SEP, namespaceSymbol, effectSymbol } from './constants';
import prefixType from './prefixType';
import { delay, isFunction } from './utils';

export default function getSaga(store, onError, onEffect) {
  return function*() {
    for (const prop in store) {
      if (isFunction(store[prop]) && store[prop][effectSymbol]) {
        const namespace = store[namespaceSymbol];
        const key = namespace ? `${namespace}${NAMESPACE_SEP}${prop}` : prop;
        const watcher = getWatcher(key, store[prop][effectSymbol], store, onError, onEffect);
        const task = yield sagaEffects.fork(watcher);
        yield sagaEffects.fork(function*() {
          yield sagaEffects.take(`${store[namespaceSymbol]}/@@CANCEL_EFFECTS`);
          yield sagaEffects.cancel(task);
        });
      }
    }
  };
}

function getWatcher(key, effectOpts, store, onError, onEffect) {
  const { effectFn } = effectOpts;
  let effect = effectFn.bind(store);
  let type = effectOpts.type;
  let ms;
  let delayMs;

  if (effectOpts.options) {
    const options = effectOpts.options;
    if (type === 'debounce' || type === 'throttle') {
      invariant(options.ms, `${type}: options.ms should be defined`);
      ({ ms } = options);
    }
    if (type === 'poll') {
      invariant(options.delay, `${type}: options.delay should be defined`);
      ({ delay: delayMs } = options);
    }
    invariant(
      ['watcher', 'takeLeading', 'takeEvery', 'takeLatest', 'debounce', 'throttle', 'poll'].indexOf(type) > -1,
      'effectOpts: effect type should be takeEvery, takeLatest, throttle, poll, watcher, takeLeading or debounce',
    );
  }

  function noop() {}

  function* sagaWithCatch(...args) {
    const { __dva_resolve: resolve = noop, __dva_reject: reject = noop, payload = {} } =
      args.length > 0 ? args[0] : {};
    try {
      yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@start` });
      const ret = yield effect(payload, createEffects(store, effectOpts), ...args);
      yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@end` });
      resolve(ret);
    } catch (e) {
      onError(e, {
        key,
        effectArgs: args,
      });
      if (!e._dontReject) {
        reject(e);
      }
    }
  }

  const sagaWithOnEffect = applyOnEffect(onEffect, sagaWithCatch, store, key);

  switch (type) {
    case 'watcher':
      return sagaWithCatch;
    case 'takeLeading':
      return function*() {
        yield sagaEffects.takeLeading(key, sagaWithOnEffect);
      }
    case 'takeLatest':
      return function*() {
        yield sagaEffects.takeLatest(key, sagaWithOnEffect);
      };
    case 'debounce':
      const { leading = true } = effectOpts.options;
      if (leading) {
        return function*() {
          while(true){
            const action = yield sagaEffects.take(key);
            yield sagaEffects.fork(function* (){
              yield sagaEffects.call(sagaWithOnEffect, action);
            })
            yield delay(ms);
          }
        };
      }
      return function* () {
        yield sagaEffects.debounce(ms, key, sagaWithOnEffect);
      }
    case 'throttle':
      return function*() {
        yield sagaEffects.throttle(ms, key, sagaWithOnEffect);
      };
    case 'poll':
      return function*() {
        function* pollSagaWorker(sagaEffects, action) {
          const { call } = sagaEffects;
          while (true) {
            yield call(sagaWithOnEffect, action);
            yield call(delay, delayMs);
          }
        }
        const { call, take, race } = sagaEffects;
        while (true) {
          const action = yield take(`${key}-start`);
          yield race([call(pollSagaWorker, sagaEffects, action), take(`${key}-stop`)]);
        }
      };
    default:
      return function*() {
        yield sagaEffects.takeEvery(key, sagaWithOnEffect);
      };
  }
}

function createEffects(store, opts) {
  function assertAction(type, name) {
    invariant(type, 'dispatch: action should be a plain Object with type');

    const { namespacePrefixWarning = true } = opts;

    if (namespacePrefixWarning) {
      warning(
        type.indexOf(`${store[namespaceSymbol]}${NAMESPACE_SEP}`) !== 0,
        `[${name}] ${type} should not be prefixed with namespace ${store[namespaceSymbol]}`,
      );
    }
  }
  function put(action) {
    const { type } = action;
    assertAction(type, 'sagaEffects.put');
    return sagaEffects.put({ ...action, type: prefixType(type, store) });
  }

  // The operator `put` doesn't block waiting the returned promise to resolve.
  // Using `put.resolve` will wait until the promsie resolve/reject before resuming.
  // It will be helpful to organize multi-effects in order,
  // and increase the reusability by seperate the effect in stand-alone pieces.
  // https://github.com/redux-saga/redux-saga/issues/336
  function putResolve(action) {
    const { type } = action;
    assertAction(type, 'sagaEffects.putResolve');

    return sagaEffects.putResolve({
      ...action,
      type: prefixType(type, store),
    });
  }
  put.resolve = putResolve;

  function take(type) {
    if (typeof type === 'string') {
      assertAction(type, 'sagaEffects.take');
      return sagaEffects.take(prefixType(type, store));
    } else if (Array.isArray(type)) {
      return sagaEffects.take(
        type.map(t => {
          if (typeof t === 'string') {
            assertAction(t, 'sagaEffects.take');
            return prefixType(t, store);
          }
          return t;
        }),
      );
    } else {
      return sagaEffects.take(type);
    }
  }
  return { ...sagaEffects, put, take };
}

function applyOnEffect(fns, effect, store, key) {
  for (const fn of fns) {
    effect = fn(effect, sagaEffects, store, key);
  }
  return effect;
}
