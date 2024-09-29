import globals from "globals";
import json from "eslint-plugin-json";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/", "coverage/", ".nyc_output/", "test/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2018,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-empty": "warn"
    }
  },
  {
    ...json.configs.recommended,
    files: ["**/*.json"],
  },
];
