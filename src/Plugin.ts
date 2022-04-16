import invariant from "invariant";
import { isPlainObject } from "./utils";
import { namespaceSymbol } from './constants'

const hooks = ["extraStore", "onError", "onEffect"];

export function filterHooks(obj) {
  return Object.keys(obj).reduce((memo, key) => {
    if (hooks.indexOf(key) > -1) {
      memo[key] = obj[key];
    }
    return memo;
  }, {});
}

export default class Plugin {
  constructor() {
  }

  hooks = hooks.reduce((memo, key) => {
    memo[key] = [];
    return memo;
  }, {});

  use(stores, plugin) {
    invariant(
      isPlainObject(plugin),
      "plugin.use: plugin should be plain object"
    );
    const { hooks } = this;
    for (const key in plugin) {
      if (Object.prototype.hasOwnProperty.call(plugin, key)) {
        invariant(hooks[key], `plugin.use: unknown plugin property: ${key}`);
        if (key === 'extraStore') {
          const extraStore = plugin[key];
          stores[extraStore[namespaceSymbol]] = extraStore;
        }
        hooks[key].push(plugin[key]);
      }
    }
  }

  apply(key, defaultHandler) {
    const { hooks } = this;
    const validApplyHooks = ["onError"];
    invariant(
      validApplyHooks.indexOf(key) > -1,
      `plugin.apply: hook ${key} cannot be applied`
    );
    const fns = hooks[key];

    return (...args) => {
      if (fns.length) {
        for (const fn of fns) {
          fn(...args);
        }
      } else if (defaultHandler) {
        defaultHandler(...args);
      }
    };
  }

  get(key) {
    const { hooks } = this;
    invariant(key in hooks, `plugin.get: hook ${key} cannot be got`);
    return hooks[key];
  }
}
