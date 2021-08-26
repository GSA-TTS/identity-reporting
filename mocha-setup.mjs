import { register } from "esbuild-register/dist/node.js";

register({ define: { "import.meta.env": "{}" } });
