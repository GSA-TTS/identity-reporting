import { UserConfig } from "vite";

export default {
  build: {
    outDir: "_site",
    sourcemap: true,
  },
  esbuild: {
    jsxInject: "import { h } from 'preact';",
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  publicDir: "data",
} as UserConfig;
