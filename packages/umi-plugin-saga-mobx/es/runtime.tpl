import React from 'react';
import { _sagaMobxContainer, getApp, _onCreate } from './saga-mobx';

export function rootContainer(container, opts) {
  console.log(container);
  return React.createElement(_sagaMobxContainer, opts, container);
}