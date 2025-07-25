import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  plugins: [pluginReact()],
  output: {
    distPath: {
      root: "web",
    },
  },
});
