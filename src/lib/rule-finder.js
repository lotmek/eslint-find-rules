const semver = require('semver');
const eslintPkg = require('eslint/package.json');

const createLegacyRuleFinder = require('./legacy-rule-finder');
const createFlatConfigRuleFinder = require('./flat-config-rule-finder');

const isPreV9Eslint = semver.satisfies(eslintPkg.version, '< 9');

module.exports = async function (specifiedFile, options = {}) {
  return isPreV9Eslint || !options.useFlatConfig
    ? createLegacyRuleFinder(specifiedFile, options)
    : createFlatConfigRuleFinder(specifiedFile, options) 
};
