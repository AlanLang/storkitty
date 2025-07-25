import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  plugins: [pluginReact()],
  output: {
    distPath: {
      root: "web",
    },
  },
  tools: {
    rspack: {
      plugins: [TanStackRouterRspack()],
    },
  },
});
