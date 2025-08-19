import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    // Use absolute base so assets resolve from the site root:
    // /assets/... instead of relative admindata/vendor/assets/...
    base: '/',

    build: {
      // Align with your Node app.js which serves ../client/dist
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      // manifest: true, // optional, only if you need it
    },

    css: {
      postcss: {
        plugins: [
          autoprefixer({}),
        ],
      },
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['import', 'legacy-js-api'],
        },
      },
    },

    // Keep your JSX handling if you rely on .js files with JSX
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },

    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },

    plugins: [react()],

    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        // add proxies if you need them
      },
    },

    preview: {
      host: '0.0.0.0',
      port: 3000,
    },
  }
})
