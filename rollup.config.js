import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'main.ts',
  output: {
    dir: '.',
    format: 'cjs'
  },
  external: ['obsidian'],
  plugins: [typescript(), nodeResolve()]
};
