import fs from 'fs'
import path from 'path'
// @ts-ignore
import lessToJs from 'less-vars-to-js'
import { defineConfig } from 'umi'
import dotenv from 'dotenv'

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  inlineLimit: 5000, // 设置低于5kb图片转base64
  hash: true,
  ignoreMomentLocale: true,
  webpack5: {},
  sagaMobx: {},
  fastRefresh: {}
})
