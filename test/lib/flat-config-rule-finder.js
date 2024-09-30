const assert = require("assert");
const proxyquire = require("proxyquire");

const semver = require("semver");

const processCwd = process.cwd;

const specifiedFileRelative = `./test/fixtures/post-v9/eslint-flat-config.js`;

function proxyFlatConfig(path) {
  const relativePath = path.replace("./test", "../");
  return proxyquire(relativePath, {
    "eslint-plugin-plugin": {
      rules: {
        "foo-rule": {},
        "bar-rule": {},
        "old-plugin-rule": { meta: { deprecated: true } },
        "baz-rule": {},
      },
      "@noCallThru": true,
    },
    "@scope/eslint-plugin-scoped-plugin": {
      rules: {
        "foo-rule": {},
        "old-plugin-rule": { meta: { deprecated: true } },
        "bar-rule": {},
      },
      "@noCallThru": true,
    },
  });
}

const getRuleFinder = proxyquire("../../src/lib/flat-config-rule-finder", {
  "eslint/use-at-your-own-risk": {
    builtinRules: new Map()
      .set("foo-rule", {})
      .set("old-rule", { meta: { deprecated: true } })
      .set("bar-rule", {})
      .set("baz-rule", {}),
  },
  specifiedFileRelative: proxyFlatConfig(specifiedFileRelative),
});

describe("flat-config-rule-finder", function () {
  // increase timeout because proxyquire adds a significant delay
  this.timeout(
    semver.satisfies(process.version, "> 10")
      ? 5e3
      : semver.satisfies(process.version, "> 4")
      ? 20e3
      : 30e3
  );

  afterEach(() => {
    process.cwd = processCwd;
  });

  it("specifiedFile (relative path) - unused rules", async () => {
    const ruleFinder = await getRuleFinder(specifiedFileRelative);
    assert.deepEqual(ruleFinder.getUnusedRules(), [
      "@scope/scoped-plugin/bar-rule",
      "baz-rule",
      "plugin/bar-rule",
      "plugin/baz-rule",
      "plugin/foo-rule",
    ]);
  });

  it("specifiedFile (relative path) - unused rules including deprecated", async () => {
    const ruleFinder = await getRuleFinder(specifiedFileRelative, {
      includeDeprecated: true,
    });
    assert.deepEqual(ruleFinder.getUnusedRules(), [
      "@scope/scoped-plugin/bar-rule",
      "@scope/scoped-plugin/old-plugin-rule",
      "baz-rule",
      "old-rule",
      "plugin/bar-rule",
      "plugin/baz-rule",
      "plugin/foo-rule",
      "plugin/old-plugin-rule",
    ]);
  });

  it.only("specifiedFile (relative path) - current rules", async () => {
    const ruleFinder = await getRuleFinder(specifiedFileRelative);
    assert.deepEqual(ruleFinder.getCurrentRules(), [
      "@scope/scoped-plugin/foo-rule",
      "bar-rule",
      "foo-rule",
    ]);
  });
});
