/*
 * @Author: xiaolong.xu
 * @Date: 2023-10-08 17:30:13
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-10-08 18:08:36
 * @Description: file content
 */
import React, { Component, ReactNode } from "react";
import { Provider } from "mobx-react";
import create, { createLoading } from "./index";

export default class MobxSagaContainer extends Component {
  app: any = null;

  constructor(props: any) {
    super(props);
    const { stores = [] } = props;

    this.app = create();
    this.app.use(createLoading());

    stores.forEach((store) => {
      this.app.registeredEffects(store);
    });
  }

  componentWillUnmount() {
    // 局部使用不取消注册
    const stores = this.app.getStores();
    Object.keys(stores).forEach((namespace: string) => {
      this.app.unregisterEffects(stores[namespace]);
    });
    try {
      // 释放 app，for gc
      this.app = null;
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return (
      <Provider loading={this.app.getStores()["loading"]}>
        {/* @ts-ignore */}
        {this.props.children}
      </Provider>
    );
  }
}
