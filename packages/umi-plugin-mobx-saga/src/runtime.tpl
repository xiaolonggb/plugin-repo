import React from 'react';
import { _mobxSagaContainer, getApp, _onCreate } from './mobx-saga';

export function rootContainer(container, opts) {
  return React.createElement(_mobxSagaContainer, opts, container);
}
