import { namespaceSymbol } from "../../constants";
import {
  makeObservable,
  observable,
  action,
  namespace as namespaceFn,
  effects as effectsFn,
} from "../../index";

const SHOW = "@@loading/show";
const HIDE = "@@loading/hide";
const NAMESPACE = "@@loading";

@namespaceFn(NAMESPACE)
class Store {
  constructor() {
    makeObservable(this);
  }
  @observable global: boolean = false;
  @observable models: any = {};
  @observable effects: any = {};

  @action
  show({ type, payload }) {
    const { namespace, actionType } = payload || {};
    this.global = true;
    this.models = { ...this.models, [namespace]: true };
    this.effects = { ...this.effects, [actionType]: true };
  }

  @action
  hide({ type, payload }) {
    const { namespace, actionType } = payload || {};
    const effects = { ...this.effects, [actionType]: false };
    const models = {
      ...this.models,
      [namespace]: Object.keys(effects).some((actionType) => {
        const _namespace = actionType.split("/")[0];
        if (_namespace !== namespace) return false;
        return effects[actionType];
      }),
    };
    const global = Object.keys(models).some((namespace) => {
      return models[namespace];
    });
    this.global = global;
    this.models = models;
    this.effects = effects;
  }
}
const loadingStore = new Store();

function createLoading(opts: { only?: any[]; except?: any[] } = {}) {
  const { only = [], except = [] } = opts;
  if (only.length > 0 && except.length > 0) {
    throw Error(
      "It is ambiguous to configurate `only` and `except` items at the same time."
    );
  }

  function onEffect(effect, { put }, store, actionType) {
    const namespace = store[namespaceSymbol];
    if (
      (only.length === 0 && except.length === 0) ||
      (only.length > 0 && only.indexOf(actionType) !== -1) ||
      (except.length > 0 && except.indexOf(actionType) === -1)
    ) {
      return function*(...args) {
        loadingStore.show({ type: SHOW, payload: { namespace, actionType } });
        yield effect(...args);
        loadingStore.hide({ type: HIDE, payload: { namespace, actionType } });
      };
    } else {
      return effect;
    }
  }

  return {
    extraStore: loadingStore,
    onEffect,
  };
}

export default createLoading;
