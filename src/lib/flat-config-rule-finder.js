const path = require('path');

const eslint= require('@eslint/js');
const difference = require('./array-diff');
const getSortedRules = require('./sort-rules');

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

function _getCoreRuleNames() {
  return Object.keys(eslint.configs.all.rules);
}

function _filterRuleNames(ruleNames, rules, predicate) {
  return ruleNames.filter(ruleName => predicate(rules.get(ruleName)));
}

function _isNotCore(rule) {
  return rule.indexOf('/') !== '-1';
}

function RuleFinder(flatConfig, {omitCore, includeDeprecated}) {
  let currentRuleNames = _getCurrentNamesRules(flatConfig);
  console.log("current", currentRuleNames)
  if (omitCore) {
    currentRuleNames = currentRuleNames.filter(_isNotCore);
  }

  const pluginRules = _getPluginRules(flatConfig);
  const coreRuleNames = _getCoreRuleNames();

  // Ignore core rules if not imported in the flat config
  const _omitCore = omitCore || !currentRuleNames.some(ruleName => coreRuleNames.includes(ruleName))

  let pluginRuleNames = [...pluginRules.keys()];
  let allRuleNames = _omitCore ? [...pluginRuleNames] : [...coreRuleNames, ...pluginRuleNames];
  
  if (!includeDeprecated) {
    allRuleNames = _filterRuleNames(allRuleNames, pluginRules, _notDeprecated);
    pluginRuleNames = _filterRuleNames(pluginRuleNames, pluginRules, _notDeprecated);
  }

  const deprecatedRuleNames = _filterRuleNames(currentRuleNames, pluginRules, _isDeprecated);
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
