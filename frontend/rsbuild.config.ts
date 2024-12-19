import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// https://rsbuild.dev/guide/basic/configure-rsbuild
export default defineConfig({
  plugins: [pluginReact()],
  html: {
    favicon: "src/assets/favicon.ico",
    title: "TFPugs Web App",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5150",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  source: {
    define: {
      'process.env.VITE_PUBLIC_POSTHOG_KEY': JSON.stringify(process.env.VITE_PUBLIC_POSTHOG_KEY),
      'process.env.VITE_PUBLIC_POSTHOG_HOST': JSON.stringify(process.env.VITE_PUBLIC_POSTHOG_HOST),
    },
  },
});
