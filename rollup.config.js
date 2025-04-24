import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true
  },
  external: ['obsidian'],
  plugins: [
    typescript({ tsconfig: "./tsconfig.json" }),
    nodeResolve()
  ]
};
