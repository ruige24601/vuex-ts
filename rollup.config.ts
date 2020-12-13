import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
const pkg = require('./package.json')

const libraryName = 'vuex-ts'

export default {
  // input: `src/index.ts`,
  input: `test/article.ts`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
    // { file: 'dist/vuex-ts.iife.js', format: 'iife', sourcemap: true, name: 'jsvCompiler' }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: ['src/**','test/**'],
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),

    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),

    // Resolve source maps to the original source
    sourceMaps(),
  ],
}
