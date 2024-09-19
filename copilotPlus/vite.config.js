import { defineConfig } from 'vite';
import commonjs from 'vite-plugin-commonjs';
import path from 'path';

export default defineConfig(() => {
  // 默认配置
  return {
    define: {
      'process.env.APPDATA': 'process.env.APPDATA',
    },
    // plugins: [
    //   commonjs(), // 添加 commonjs 插件
    // ],
    build: {
      minify: false, // 禁用压缩
      rollupOptions: {
        input: path.join(__dirname, `./src/index.js`),
        output: {
          dir: path.join(__dirname, './dist'),
          entryFileNames: '[name].js',
        },
      },
    },
  };
});
