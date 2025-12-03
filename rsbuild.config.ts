import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  source: {
    entry: {
      index: "./src/frontend/index.tsx",
    },
  },
  plugins: [pluginReact()],
  output: {
    distPath: {
      root: "web",
    },
  },
  html: {
    title: "Storkitty",
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: "react",
          autoCodeSplitting: true,
          routesDirectory: "./src/frontend/routes",
          generatedRouteTree: "./src/frontend/routes/routeTree.gen.ts",
        }),
      ],
      optimization: {
        splitChunks: {
          chunks: "all",
          minSize: 0,
          cacheGroups: {
            vendor: {
              test: /node_modules/,
              name: "vendor",
            },
          },
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3330",
        changeOrigin: true,
      },
      "/download": {
        target: "http://localhost:3330",
        changeOrigin: true,
      },
      "/open": {
        target: "http://localhost:3330",
        changeOrigin: true,
      },
    },
  },
});
