// const plugin = require("eslint-plugin-plugin")

module.exports = [
  {
    plugins: {
      plugin: {
        rules: {
          "foo-rule": {}
        }
      }
    },
    rules: {
      "plugin/foo-rule": [2],
    }
  }
]