import React, { Component } from 'react';
import { ApplyPluginsType } from 'umi';
import { Provider } from 'mobx-react';
import create from 'saga-mobx';
// @ts-ignore
import createLoading from 'saga-mobx/es/plugins/loading';
import { plugin, history } from '../core/umiExports';
{{ ^LazyLoad }}
{{{ RegisterStoreImports }}}
{{ /LazyLoad }}

let app:any = null;

export {{ #LazyLoad }}async {{ /LazyLoad }}function _onCreate(options = {}) {
  const runtimeSagaMobx = plugin.applyPlugins({
    key: 'sagaMobx',
    type: ApplyPluginsType.modify,
    initialValue: {},
  });
  {{ #LazyLoad }}
  {{{ RegisterStoreImports }}}
  {{ /LazyLoad }}
  app = create();
  app.use(createLoading());
  (runtimeSagaMobx.plugins || []).forEach((plugin:any) => {
    app.use(plugin);
  });
  {{{ RegisterStores }}}
  return app;
}

export function getApp() {
  return app;
}

/**
 * whether browser env
 * 
 * @returns boolean
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
}

export class _sagaMobxContainer extends Component {
  constructor(props: any) {
    super(props);
    // run only in client, avoid override server _onCreate()
    if (isBrowser()) {
      _onCreate()
      {{ #LazyLoad }}
        .then(() => {
          // force update
          this.forceUpdate();
        });
      {{ /LazyLoad }}
    }
  }

  componentWillUnmount() {
    let app = getApp();
    let stores = app.getStores();
    Object.keys(stores).forEach((namespace: string) => {
      app.unregisterEffects(stores[namespace]);
    })
    try {
      // 释放 app，for gc
      app = null;
    } catch(e) {
      console.error(e);
    }
  }

  render() {
    let app = getApp();
    {{ #LazyLoad }}
    if (!app) {
      return null;
    }
    {{ /LazyLoad }}
    
    return <Provider
      {{ #ProviderAllStore }}
      {...app.getStores()}
      {{ /ProviderAllStore }}
      {{ ^ProviderAllStore }}
      loading={app.getStores()['loading']}
      {{ /ProviderAllStore }}
    >{this.props.children}</Provider>;
  }
}
