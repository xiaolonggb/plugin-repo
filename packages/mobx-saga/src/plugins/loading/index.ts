import { makeObservable, observable, action } from 'mobx';
import { namespaceSymbol } from '../../constants';
import { namespace as namespaceFn } from '../../index';

const NAMESPACE = 'loading';
@namespaceFn(NAMESPACE)
class Store {
  constructor() {
    makeObservable(this);
  }
  @observable global: boolean = false;
  @observable stores: any = {};
  @observable effects: any = {};

  @action
  show({ payload }) {
    const { namespace, actionType } = payload || {};
    this.global = true;
    this.stores = { ...this.stores, [namespace]: true };
    this.effects = { ...this.effects, [actionType]: true };
  }

  @action
  hide({ payload }) {
    const { namespace, actionType } = payload || {};
    const effects = { ...this.effects, [actionType]: false };
    const stores = {
      ...this.stores,
      // eslint-disable-next-line @typescript-eslint/no-shadow
      [namespace]: Object.keys(effects).some(actionType => {
        // eslint-disable-next-line no-underscore-dangle
        const _namespace = actionType.split('/')[0];
        if (_namespace !== namespace) return false;
        return effects[actionType];
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const global = Object.keys(stores).some(namespace => {
      return stores[namespace];
    });
    this.global = global;
    this.stores = stores;
    this.effects = effects;
  }
}
const loadingStore = new Store();

function createLoading(opts: { only?: any[]; except?: any[] } = {}) {
  const { only = [], except = [] } = opts;
  if (only.length > 0 && except.length > 0) {
    throw Error(
      'It is ambiguous to configurate `only` and `except` items at the same time.',
    );
  }

  function onEffect(effect, sagaEffects, store, actionType) {
    const namespace = store[namespaceSymbol];
    if (
      (only.length === 0 && except.length === 0) ||
      (only.length > 0 && only.indexOf(actionType) !== -1) ||
      (except.length > 0 && except.indexOf(actionType) === -1)
    ) {
      return function*(...args) {
        loadingStore.show({ payload: { namespace, actionType } });
        yield effect(...args);
        loadingStore.hide({ payload: { namespace, actionType } });
      };
    }
    return effect;
  }

  return {
    extraStore: loadingStore,
    onEffect,
  };
}

export default createLoading;
