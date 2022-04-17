"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStores = getStores;

var _umi = require("umi");

var _path = require("path");

function getStores(opts) {
  return _umi.utils.lodash.uniq(_umi.utils.glob.sync(opts.pattern || '**/*.{ts,tsx,js,jsx}', {
    cwd: opts.base
  }).map(function (f) {
    return (0, _path.join)(opts.base, f);
  }).concat(opts.extraModels || []).map(_umi.utils.winPath)).filter(function (f) {
    if (/\.d.ts$/.test(f)) return false;
    if (/\.(test|e2e|spec).(j|t)sx?$/.test(f)) return false;
    return true; // 允许通过配置下跳过 Model 校验
    // if (opts.skipModelValidate) return true;
    // TODO: fs cache for performance
    // try {
    //   return isValidStore({
    //     content: readFileSync(f, 'utf-8'),
    //   });
    // } catch (error) {
    //   throw new Error(
    //     `saga-mobx store ${utils.winPath(
    //       relative(opts.cwd, f),
    //     )} parse failed, ${error}`,
    //   );
    // }
  });
}