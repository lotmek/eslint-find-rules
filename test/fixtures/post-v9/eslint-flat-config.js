const plugin = require("eslint-plugin-plugin");
const scopedPlugin = require("@scope/eslint-plugin-scoped-plugin");

module.exports = [
  {
    plugins: {
      plugin,
      "@scope/scoped-plugin": scopedPlugin,
    },
    rules: {
      "foo-rule": [2],
      "bar-rule": [2],
      "@scope/scoped-plugin/foo-rule": [2],
    },
  },
];
