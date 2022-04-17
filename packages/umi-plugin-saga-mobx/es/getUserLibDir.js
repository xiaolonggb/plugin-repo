import { utils } from 'umi';
import { dirname } from 'path';
export function getUserLibDir(_ref) {
  var library = _ref.library,
      pkg = _ref.pkg,
      cwd = _ref.cwd;

  if (pkg.dependencies && pkg.dependencies[library] || pkg.devDependencies && pkg.devDependencies[library]) {
    return utils.winPath(dirname( // 通过 resolve 往上找，可支持 lerna 仓库
    // lerna 仓库如果用 yarn workspace 的依赖不一定在 node_modules，可能被提到根目录，并且没有 link
    utils.resolve.sync("".concat(library, "/package.json"), {
      basedir: cwd
    })));
  }

  return null;
}