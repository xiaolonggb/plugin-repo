/*
 * @Author: xiaolong.xu
 * @Date: 2023-03-23 10:58:10
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-09-24 09:59:17
 * @Description: file content
 */
const { ModuleFederationPlugin } = require("webpack").container;
const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");

function isString(obj) {
  return Object.prototype.toString.call(obj) === "[object String]"
    ? true
    : false;
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

class CssScopeModuleFederationPlugin {
  constructor({
    prefix,
    AutoCssScopePrefix = false,
    excludesSelector = [],
    excludesFilePath = [],
    ...moduleFederationPluginOptions
  }) {
    this.prefix = prefix;
    this.excludesSelector = excludesSelector;
    this.cwd = process.cwd();
    this.moduleFederationPluginOptions = moduleFederationPluginOptions || {};
    if (AutoCssScopePrefix) {
      const { exposes } = this.moduleFederationPluginOptions;
      let newExposes = {};
      Object.keys(exposes).forEach((name) => {
        const originPath = exposes[name];
        const concent = Mustache.render(
          fs.readFileSync(
            path.join(__dirname, "./tpl/cssScopeWrapper.tpl"),
            "utf-8"
          ),
          {
            exposesEntryOriginPath: originPath,
            prefix,
          }
        );

        if (!fs.existsSync(path.join(this.cwd, ".wrapper"))) {
          fs.mkdirSync(path.join(this.cwd, ".wrapper"));
        }

        const cssScopeWrapperPath = path.join(
          this.cwd,
          `.wrapper/${name}CssScopeWrapper.tsx`
        );

        fs.writeFileSync(cssScopeWrapperPath, concent, "utf-8");

        newExposes[name] = cssScopeWrapperPath;
      });

      this.moduleFederationPluginOptions.exposes = newExposes;
    }

    this.moduleFederationPlugin = new ModuleFederationPlugin(
      this.moduleFederationPluginOptions
    );
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    this.moduleFederationPlugin.apply(compiler);

    compiler.hooks.afterPlugins.tap(
      "CssScopeModuleFederationPlugin",
      (compiler) => {
        compiler.options.plugins.push(this.moduleFederationPlugin);
        this.addPostcssLoader(compiler.options.module.rules);
      }
    );
  }

  addPostcssLoader(rules) {
    const excludesSelector = this.excludesSelector;
    const postcssLoader = {
      loader: require.resolve("postcss-loader"),
      options: {
        postcssOptions: {
          plugins: {
            "postcss-prefix-selector": {
              prefix: `div[${this.prefix}]`,
              transform(prefix, selector, prefixedSelector, filePath, rule) {
                if (selector.match(/^(html|body)/)) {
                  return selector.replace(/^([^\s]*)/, `$1 ${prefix}`);
                }

                if (
                  excludesFilePath.some((filePathRegExp) =>
                    filePath.match(filePathRegExp)
                  )
                ) {
                  return selector; // Do not prefix styles imported from node_modules
                }

                let matchFlag = null;
                for (let regExp of excludesSelector) {
                  if (selector.match(regExp)) {
                    matchFlag = true;
                    break;
                  }
                }
                if (matchFlag) {
                  return selector;
                }

                const annotation = rule.prev();
                if (
                  annotation?.type === "comment" &&
                  annotation.text.trim() === "no-prefix"
                ) {
                  return selector; // Do not prefix style rules that are preceded by: /* no-prefix */
                }

                return prefixedSelector;
              },
            },
            // autoprefixer: {
            //   browsers: ['last 4 versions'],
            // },
          },
        },
      },
    };

    const rule = rules.find((rule) => {
      return rule.test.test(".css");
    });

    if (rule.use && Array.isArray(rule.use)) {
      const cssLoaderIndex = rule.use.findIndex((item) => {
        if (isString(item) && item === "css-loader") {
          return true;
        }
        if (isObject(item) && item.loader === "css-loader") {
          return true;
        }
        return false;
      });
      if (cssLoaderIndex > -1) {
        rule.use.splice(cssLoaderIndex + 1, 0, postcssLoader);
      }
    }
  }
}

exports.default = CssScopeModuleFederationPlugin;
