module.exports = {
  require: ["esbuild-register", "global-jsdom/register"],
  file: "./mocha-setup.ts",
  extension: ["js", "jsx", "ts", "tsx"],
};
