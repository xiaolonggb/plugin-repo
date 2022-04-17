"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _umi = require("umi");

var _path = require("path");

var _fs = require("fs");

var _getStores = require("./getStores/getStores");

var _getUserLibDir = require("./getUserLibDir");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var Mustache = _umi.utils.Mustache,
    lodash = _umi.utils.lodash,
    winPath = _umi.utils.winPath;

var _default = function _default(api) {
  var logger = api.logger;

  function getStoreDir() {
    return api.config.singular ? 'store' : 'Stores';
  }

  function getSrcStoresPath() {
    return (0, _path.join)(api.paths.absSrcPath, getStoreDir());
  }

  function getSagaMobxDependency() {
    var _api$pkg = api.pkg,
        dependencies = _api$pkg.dependencies,
        devDependencies = _api$pkg.devDependencies;
    return dependencies && dependencies['saga-mobx'] || devDependencies && devDependencies['saga-mobx'] || require('../package').dependencies['saga-mobx'];
  } // 配置


  api.describe({
    key: 'sagaMobx',
    config: {
      schema: function schema(joi) {
        return joi.object({
          disableStoresReExport: joi.boolean(),
          lazyLoad: joi.boolean().description('lazy load saga-mobx store avoiding the import modules from umi undefined'),
          extraStores: joi.array().items(joi.string()),
          skipStoreValidate: joi.boolean()
        });
      }
    }
  });

  function getAllStores() {
    var _api$config$sagaMobx, _api$config$sagaMobx2;

    var srcStoresPath = getSrcStoresPath();
    var baseOpts = {
      skipStoreValidate: (_api$config$sagaMobx = api.config.sagaMobx) === null || _api$config$sagaMobx === void 0 ? void 0 : _api$config$sagaMobx.skipStoreValidate,
      extraStores: (_api$config$sagaMobx2 = api.config.sagaMobx) === null || _api$config$sagaMobx2 === void 0 ? void 0 : _api$config$sagaMobx2.extraStores
    };
    return lodash.uniq([].concat(_toConsumableArray((0, _getStores.getStores)(_objectSpread({
      base: srcStoresPath,
      cwd: api.cwd
    }, baseOpts))), _toConsumableArray((0, _getStores.getStores)(_objectSpread({
      base: api.paths.absPagesPath,
      cwd: api.cwd,
      pattern: "**/".concat(getStoreDir(), "/**/*.{ts,tsx,js,jsx}")
    }, baseOpts))), _toConsumableArray((0, _getStores.getStores)(_objectSpread({
      base: api.paths.absPagesPath,
      cwd: api.cwd,
      pattern: "**/store.{ts,tsx,js,jsx}"
    }, baseOpts)))));
  }

  var hasStores = false; // 初始检测一遍

  api.onStart(function () {
    hasStores = getAllStores().length > 0;
  });
  api.addDepInfo(function () {
    return {
      name: 'saga-mobx',
      range: getSagaMobxDependency()
    };
  }); // 生成临时文件

  api.onGenerateFiles({
    fn: function fn() {
      var _api$config$sagaMobx3;

      var Stores = getAllStores();
      hasStores = Stores.length > 0;
      logger.debug('saga-mobx Stores:');
      logger.debug(Stores); // 没有 Stores 不生成文件

      if (!hasStores) return; // saga-mobx.ts

      var sagaMobxTpl = (0, _fs.readFileSync)((0, _path.join)(__dirname, 'saga-mobx.tpl'), 'utf-8');
      api.writeTmpFile({
        path: 'plugin-saga-mobx/saga-mobx.tsx',
        content: Mustache.render(sagaMobxTpl, {
          LazyLoad: (_api$config$sagaMobx3 = api.config.sagaMobx) === null || _api$config$sagaMobx3 === void 0 ? void 0 : _api$config$sagaMobx3.lazyLoad,
          RegisterStoreImports: Stores.map(function (path, index) {
            var _api$config$sagaMobx4;

            var storeName = "Store".concat(lodash.upperFirst(lodash.camelCase((0, _path.basename)(path, (0, _path.extname)(path))))).concat(index);
            return ((_api$config$sagaMobx4 = api.config.sagaMobx) === null || _api$config$sagaMobx4 === void 0 ? void 0 : _api$config$sagaMobx4.lazyLoad) ? "const ".concat(storeName, " = (await import('").concat(path, "')).default;") : "import ".concat(storeName, " from '").concat(path, "';");
          }).join('\r\n'),
          RegisterStores: Stores.map(function (path, index) {
            // prettier-ignore
            return "\napp.registeredEffects(Store".concat(lodash.upperFirst(lodash.camelCase((0, _path.basename)(path, (0, _path.extname)(path))))).concat(index, ");\n          ").trim();
          }).join('\r\n')
        })
      }); // runtime.tsx

      var runtimeTpl = (0, _fs.readFileSync)((0, _path.join)(__dirname, 'runtime.tpl'), 'utf-8');
      api.writeTmpFile({
        path: 'plugin-saga-mobx/runtime.tsx',
        content: Mustache.render(runtimeTpl, {})
      }); // exports.ts
      // const exportsTpl = readFileSync(join(__dirname, 'exports.tpl'), 'utf-8');

      var sagaMobxLibPath = winPath((0, _getUserLibDir.getUserLibDir)({
        library: 'saga-mobx',
        pkg: api.pkg,
        cwd: api.cwd
      }) || (0, _path.dirname)(require.resolve('saga-mobx/package.json')));

      var sagaMobxVersion = require((0, _path.join)(sagaMobxLibPath, 'package.json')).version;

      logger.debug("saga-mobx version: ".concat(sagaMobxVersion));
    },
    // 要比 preset-built-in 靠前
    // 在内部文件生成之前执行，这样 hasStores 设的值对其他函数才有效
    stage: -1
  }); // src/Stores 下的文件变化会触发临时文件生成

  api.addTmpGenerateWatcherPaths(function () {
    return [getSrcStoresPath()];
  }); // saga-mobx 优先读用户项目的依赖

  api.addProjectFirstLibraries(function () {
    return [{
      name: 'saga-mobx',
      path: (0, _path.dirname)(require.resolve('saga-mobx/package.json'))
    }];
  }); // Runtime Plugin

  api.addRuntimePlugin(function () {
    return hasStores ? [(0, _path.join)(api.paths.absTmpPath, 'plugin-saga-mobx/runtime.tsx')] : [];
  });
  api.addRuntimePluginKey(function () {
    return hasStores ? ['sagaMobx'] : [];
  });
  api.registerCommand({
    name: 'saga-mobx',
    fn: function fn(_ref) {
      var args = _ref.args;

      if (args._[0] === 'list' && args._[1] === 'store') {
        var Stores = getAllStores();
        console.log();
        console.log(_umi.utils.chalk.bold('  Stores in your project:'));
        console.log();
        Stores.forEach(function (store) {
          console.log("    - ".concat((0, _path.relative)(api.cwd, store)));
        });
        console.log();
        console.log("  Totally ".concat(Stores.length, "."));
        console.log();
      }
    }
  });
};

exports.default = _default;