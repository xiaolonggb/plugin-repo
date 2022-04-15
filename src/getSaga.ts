import invariant from 'invariant';
import warning from 'warning';
import * as sagaEffects from 'redux-saga/effects';
import { NAMESPACE_SEP, namespaceSymbol, effectSymbol } from './constants';
import prefixType from './prefixType';

export default function getSaga(store, onError, onEffect) {
  return function*() {
    for (const prop in store) {
      if (store[prop][effectSymbol]) {
        const namespace = store[namespaceSymbol];
        const key = namespace ? `${namespace}${NAMESPACE_SEP}${prop}` : prop;
        const watcher = getWatcher(key, store[prop], store, onError, onEffect);
        const task = yield sagaEffects.fork(watcher);
        yield sagaEffects.fork(function*() {
          yield sagaEffects.take(`${store[namespaceSymbol]}/@@CANCEL_EFFECTS`);
          yield sagaEffects.cancel(task);
        });
      }
    }
  };
}

function getWatcher(key, _effect, store, onError, onEffect) {
  let opts = _effect[effectSymbol];
  let effect = _effect.bind(store);
  let type = 'takeEvery';
  let ms;
  let delayMs;

  // if (Array.isArray(_effect)) {
  //   [effect] = _effect;
  //   const opts = _effect[1];
  //   if (opts && opts.type) {
  //     ({ type } = opts);
  //     if (type === 'throttle') {
  //       invariant(opts.ms, 'app.start: opts.ms should be defined if type is throttle');
  //       ({ ms } = opts);
  //     }
  //     if (type === 'poll') {
  //       invariant(opts.delay, 'app.start: opts.delay should be defined if type is poll');
  //       ({ delay: delayMs } = opts);
  //     }
  //   }
  //   invariant(
  //     ['watcher', 'takeEvery', 'takeLatest', 'throttle', 'poll'].indexOf(type) > -1,
  //     'app.start: effect type should be takeEvery, takeLatest, throttle, poll or watcher',
  //   );
  // }

  function noop() {}

  function* sagaWithCatch(...args) {
    const { __dva_resolve: resolve = noop, __dva_reject: reject = noop } =
      args.length > 0 ? args[0] : {};
    try {
      yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@start` });
      const ret = yield effect(...args.concat(createEffects(store, opts)));
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
    case 'takeLatest':
      return function*() {
        yield sagaEffects.takeLatest(key, sagaWithOnEffect);
      };
    case 'throttle':
      return function*() {
        yield sagaEffects.throttle(ms, key, sagaWithOnEffect);
      };
    case 'poll':
      return function*() {
        function delay(timeout) {
          return new Promise(resolve => setTimeout(resolve, timeout));
        }
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
    console.log({ ...action, type: prefixType(type, store) })
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
