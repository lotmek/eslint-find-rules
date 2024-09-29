const path = require('path');

const difference = require('./array-diff');
const getSortedRules = require('./sort-rules');
const { builtinRules } = require('eslint/use-at-your-own-risk');

function _getConfigFile(specifiedFile) {
  if (specifiedFile) {
    if (path.isAbsolute(specifiedFile)) {
      return specifiedFile;
    }
    return path.join(process.cwd(), specifiedFile);
  }
  // This is not being called with an arg. Use the package.json `main`
  return require(path.join(process.cwd(), 'package.json')).main;
}

function _getCurrentNamesRules(flatConfig) {
  return flatConfig.flatMap(config => config && config.rules
    ? Object.keys((config.rules))
    : []
  );
}

function _isDeprecated(rule) {
  return rule && rule.meta && rule.meta.deprecated;
}

function _notDeprecated(rule) {
  return !_isDeprecated(rule);
}

function _getPluginRules(flatConfig) {
  const pluginRules = new Map();
  flatConfig.forEach(config => {
    const plugins = config.plugins;
    /* istanbul ignore else */
    if (plugins) {
      Object.entries(plugins).forEach(([pluginName, plugin]) => {;
        const rules = plugin.rules === undefined ? {} : plugin.rules;
  
        Object.keys(rules).forEach(ruleName =>
          pluginRules.set(`${pluginName}/${ruleName}`, rules[ruleName])
        );
      });
    }
  })
  return pluginRules;
}

function _getCoreRules() {
  return builtinRules;
}

function _filterRuleNames(ruleNames, rules, predicate) {
  return ruleNames.filter(ruleName => predicate(rules.get(ruleName)));
}

function _isNotCore(rule) {
  return rule.indexOf('/') !== '-1';
}

function RuleFinder(flatConfig, {omitCore, includeDeprecated}) {
  let currentRuleNames = _getCurrentNamesRules(flatConfig);
  if (omitCore) {
    currentRuleNames = currentRuleNames.filter(_isNotCore);
  }

  const pluginRules = _getPluginRules(flatConfig);
  const coreRules = _getCoreRules();
  const allRules = omitCore ? pluginRules : new Map([...coreRules, ...pluginRules]);

  let allRuleNames = [...allRules.keys()];
  let pluginRuleNames = [...pluginRules.keys()];
  if (!includeDeprecated) {
    allRuleNames = _filterRuleNames(allRuleNames, allRules, _notDeprecated);
    pluginRuleNames = _filterRuleNames(pluginRuleNames, pluginRules, _notDeprecated);
  }
  const deprecatedRuleNames = _filterRuleNames(currentRuleNames, allRules, _isDeprecated);
  const dedupedRuleNames = [...new Set(allRuleNames)];
  const unusedRuleNames = difference(dedupedRuleNames, currentRuleNames);

  // Get all the current rules instead of referring the extended files or documentation
  this.getCurrentRules = () => getSortedRules(currentRuleNames);

  // Get all the plugin rules instead of referring the extended files or documentation
  this.getPluginRules = () => getSortedRules(pluginRuleNames);

  // Get all the available rules instead of referring eslint and plugin packages or documentation
  this.getAllAvailableRules = () => getSortedRules(dedupedRuleNames);

  this.getUnusedRules = () => getSortedRules(unusedRuleNames);

  // Get all the current rules that are deprecated
  this.getDeprecatedRules = () => getSortedRules(deprecatedRuleNames);
}

async function createRuleFinder(specifiedFile, options) {
  const flatConfigFile = _getConfigFile(specifiedFile);
  const flatConfig = require(flatConfigFile);

  return new RuleFinder(flatConfig, options);
}

module.exports = async function (specifiedFile, options = {}) {
  return createRuleFinder(specifiedFile, options);
};
