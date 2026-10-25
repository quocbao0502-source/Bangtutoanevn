import { mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import config from './vite.config.ts';

export default mergeConfig(config({ command: 'build', mode: 'production' }), {
  base: './',
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  build: {
    outDir: 'html',
    emptyOutDir: true,
    copyPublicDir: false,
    target: ['es2020', 'safari14', 'ios14'],
  },
});