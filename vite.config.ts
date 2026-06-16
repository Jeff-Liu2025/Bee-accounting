import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  base: '/Bee-accounting/',
  build: {
    sourcemap: 'hidden',
    target: 'es2015',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths(),
    // iOS 微信兼容：将 type="module" 转为普通 script（defer），同时移除 crossorigin
    {
      name: 'wechat-compat',
      transformIndexHtml: {
        order: 'post',
        handler(html: string) {
          return html
            .replace(
              /<script type="module" crossorigin src=/g,
              '<script defer src='
            )
            .replace(
              /<link rel="stylesheet" crossorigin href=/g,
              '<link rel="stylesheet" href='
            );
        },
      },
    },
  ],
})
