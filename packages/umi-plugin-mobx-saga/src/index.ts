/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { IApi, utils } from 'umi';
import { basename, dirname, extname, join, relative } from 'path';
import { readFileSync } from 'fs';
import { getStores } from './getStores/getStores';
import { getUserLibDir } from './getUserLibDir';

const { Mustache, lodash, winPath } = utils;

const PACKAGE_NAME = 'mobx-saga';

export default (api: IApi) => {
  const { logger } = api;

  function getStoreDir() {
    return api.config.singular ? 'store' : 'Stores';
  }

  function getSrcStoresPath() {
    return join(api.paths.absSrcPath!, getStoreDir());
  }

  function getPackageDependency() {
    const { dependencies, devDependencies } = api.pkg;
    return (
      (dependencies && dependencies[PACKAGE_NAME]) ||
      (devDependencies && devDependencies[PACKAGE_NAME]) ||
      require('../package').dependencies[PACKAGE_NAME]
    );
  }

  // 配置
  api.describe({
    key: 'mobxSaga',
    config: {
      schema(joi) {
        return joi.object({
          lazyLoad: joi
            .boolean()
            .description(
              `lazy load ${PACKAGE_NAME} store avoiding the import modules from umi undefined`,
            ),
          extraStores: joi.array().items(joi.string()),
          providerAllStore: joi.boolean(),
        });
      },
    },
  });

  function getAllStores() {
    const srcStoresPath = getSrcStoresPath();
    const baseOpts = {
      extraStores: api.config.mobxSaga?.extraStores,
    };
    return lodash.uniq([
      ...getStores({
        base: srcStoresPath,
        cwd: api.cwd,
        ...baseOpts,
      }),
      ...getStores({
        base: api.paths.absPagesPath!,
        cwd: api.cwd,
        pattern: `**/${getStoreDir()}/**/*.{ts,tsx,js,jsx}`,
        ...baseOpts,
      }),
      ...getStores({
        base: api.paths.absPagesPath!,
        cwd: api.cwd,
        pattern: `**/store.{ts,tsx,js,jsx}`,
        ...baseOpts,
      }),
    ]);
  }

  let hasStores = false;

  // 初始检测一遍
  api.onStart(() => {
    hasStores = getAllStores().length > 0;
  });

  api.addDepInfo(() => {
    return {
      name: PACKAGE_NAME,
      range: getPackageDependency(),
    };
  });

  // 生成临时文件
  api.onGenerateFiles({
    fn() {
      const Stores = getAllStores();

      hasStores = Stores.length > 0;
      logger.debug(`${PACKAGE_NAME} Stores:`);
      logger.debug(Stores);

      // 没有 Stores 不生成文件
      if (!hasStores) return;

      // mobx-saga.ts
      const mobxSagaTpl = readFileSync(
        join(__dirname, 'mobx-saga.tpl'),
        'utf-8',
      );
      api.writeTmpFile({
        path: 'plugin-mobx-saga/mobx-saga.tsx',
        content: Mustache.render(mobxSagaTpl, {
          LazyLoad: api.config.mobxSaga?.lazyLoad,
          ProviderAllStore: !!api.config.mobxSaga?.providerAllStore,
          RegisterStoreImports: Stores.map((path, index) => {
            const storeName = `Store${lodash.upperFirst(
              lodash.camelCase(basename(path, extname(path))),
            )}${index}`;
            return api.config.mobxSaga?.lazyLoad
              ? `const ${storeName} = (await import('${path}')).default;`
              : `import ${storeName} from '${path}';`;
          }).join('\r\n'),
          RegisterStores: Stores.map((path, index) => {
            // prettier-ignore
            return `
app.registeredEffects(Store${lodash.upperFirst(lodash.camelCase(basename(path, extname(path))))}${index});
          `.trim();
          }).join('\r\n'),
        }),
      });

      // runtime.tsx
      const runtimeTpl = readFileSync(join(__dirname, 'runtime.tpl'), 'utf-8');
      api.writeTmpFile({
        path: 'plugin-mobx-saga/runtime.tsx',
        content: Mustache.render(runtimeTpl, {}),
      });

      // exports.ts
      // const exportsTpl = readFileSync(join(__dirname, 'exports.tpl'), 'utf-8');
      const mobxSagaLibPath = winPath(
        getUserLibDir({
          library: PACKAGE_NAME,
          pkg: api.pkg,
          cwd: api.cwd,
        }) || dirname(require.resolve(`${PACKAGE_NAME}/package.json`)),
      );

      const mobxSagaVersion = require(join(mobxSagaLibPath, 'package.json'))
        .version;

      logger.debug(`${PACKAGE_NAME} version: ${mobxSagaVersion}`);
    },
    // 要比 preset-built-in 靠前
    // 在内部文件生成之前执行，这样 hasStores 设的值对其他函数才有效
    stage: -1,
  });

  // src/Stores 下的文件变化会触发临时文件生成
  api.addTmpGenerateWatcherPaths(() => [getSrcStoresPath()]);

  // mobx-saga 优先读用户项目的依赖
  api.addProjectFirstLibraries(() => [
    {
      name: PACKAGE_NAME,
      path: dirname(require.resolve(`${PACKAGE_NAME}/package.json`)),
    },
  ]);

  // Runtime Plugin
  api.addRuntimePlugin(() =>
    hasStores
      ? [join(api.paths.absTmpPath!, 'plugin-mobx-saga/runtime.tsx')]
      : [],
  );
  api.addRuntimePluginKey(() => (hasStores ? ['mobxSaga'] : []));

  api.registerCommand({
    name: 'mobx-saga',
    fn({ args }) {
      if (args._[0] === 'list' && args._[1] === 'store') {
        const Stores = getAllStores();
        console.log();
        console.log(utils.chalk.bold('  Stores in your project:'));
        console.log();
        Stores.forEach(store => {
          console.log(`    - ${relative(api.cwd, store)}`);
        });
        console.log();
        console.log(`  Totally ${Stores.length}.`);
        console.log();
      }
    },
  });
};
