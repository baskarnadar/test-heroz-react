// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import autoprefixer from "autoprefixer";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    base: "/",
    build: {
      outDir: "build",
      sourcemap: false, // ❌ Disable source maps in production
      minify: isProd ? "terser" : false, // ✅ Minify only in production
      terserOptions: {
        compress: {
          drop_console: true, // ✅ Remove console.* calls
          drop_debugger: true, // ✅ Remove debugger statements
        },
      },
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer({}), // add options if needed
        ],
      },
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ["import", "legacy-js-api"],
        },
      },
    },
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: "src/",
          replacement: `${path.resolve(__dirname, "src")}/`,
        },
      ],
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".scss"],
    },

    // ✅ Allow your domains on dev server
    server: {
      host: "0.0.0.0",
      port: 3000,

      // ✅ add test.heroz.sa here
      allowedHosts: ["school.heroz.sa", "test.heroz.sa"],

      proxy: {
        // Add proxy settings here if needed
      },
    },

    // ✅ Allow your domains on preview server
    preview: {
      host: "0.0.0.0",
      port: 3000,

      // ✅ add test.heroz.sa here
      allowedHosts: ["school.heroz.sa", "test.heroz.sa"],
    },
  };
});
