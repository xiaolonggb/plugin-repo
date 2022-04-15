export default {
  entry: './src/index.ts',
  doc: {
    themeConfig: { mode: 'dark' },
    base: '/'
  },
  cjs: { type: 'babel', lazy: true },
  esm: {
    type: 'babel',
    importLibToEs: true,
  },
}