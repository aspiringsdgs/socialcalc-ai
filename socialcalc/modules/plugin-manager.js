/**
 * SocialCalc Plugin Manager
 * 
 * Provides a lightweight, non-intrusive plugin architecture to dynamically
 * register, enable, disable, and configure plugins on any SocialCalc instance.
 */

let SocialCalc;

if (typeof window !== "undefined" && window.SocialCalc) {
  SocialCalc = window.SocialCalc;
} else if (typeof global !== "undefined" && global.SocialCalc) {
  SocialCalc = global.SocialCalc;
} else {
  SocialCalc = {};
}

// Registry of registered plugins
const _plugins = new Map();

// Active enabled states
const _enabledPlugins = new Set();

// Event listeners for state changes
const _listeners = new Set();

/**
 * Get active SocialCalc editor instance
 */
export function getActiveEditor() {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (SocialCalc && SocialCalc._activeEditor) {
    return SocialCalc._activeEditor;
  }
  if (SocialCalc && SocialCalc.GetCurrentWorkBookControl) {
    const ctrl = SocialCalc.GetCurrentWorkBookControl();
    if (ctrl && ctrl.workbook && ctrl.workbook.spreadsheet && ctrl.workbook.spreadsheet.editor) {
      return ctrl.workbook.spreadsheet.editor;
    }
  }
  const touchinfo = SocialCalc?.TouchInfo;
  if (touchinfo && touchinfo.registeredElements) {
    for (const re of touchinfo.registeredElements) {
      if (re.functionobj && re.functionobj.editor) {
        return re.functionobj.editor;
      }
    }
  }
  return null;
}

/**
 * Get active SocialCalc spreadsheet instance
 */
export function getActiveSpreadsheet() {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (SocialCalc && SocialCalc.GetCurrentWorkBookControl) {
    const ctrl = SocialCalc.GetCurrentWorkBookControl();
    if (ctrl && ctrl.workbook && ctrl.workbook.spreadsheet) {
      return ctrl.workbook.spreadsheet;
    }
  }
  return null;
}

/**
 * Register a plugin
 * @param {string} name 
 * @param {object} pluginDefinition { enable, disable, isEnabled, configure, ... }
 */
export function registerPlugin(name, pluginDefinition) {
  if (!name || typeof name !== 'string') {
    throw new Error('Plugin name must be a non-empty string');
  }
  _plugins.set(name, {
    name,
    enable: pluginDefinition.enable || (() => {}),
    disable: pluginDefinition.disable || (() => {}),
    isEnabled: pluginDefinition.isEnabled || (() => _enabledPlugins.has(name)),
    configure: pluginDefinition.configure || (() => {}),
    metadata: pluginDefinition.metadata || {},
    ...pluginDefinition
  });
}

/**
 * Enable a plugin by name
 * @param {string} name 
 * @param {object} [options]
 */
export function enablePlugin(name, options) {
  const plugin = _plugins.get(name);
  if (!plugin) {
    console.warn(`[PluginManager] Plugin "${name}" is not registered.`);
    return false;
  }
  try {
    plugin.enable(options);
    _enabledPlugins.add(name);
    notifyListeners(name, true);
    return true;
  } catch (err) {
    console.error(`[PluginManager] Failed to enable plugin "${name}":`, err);
    return false;
  }
}

/**
 * Disable a plugin by name
 * @param {string} name 
 */
export function disablePlugin(name) {
  const plugin = _plugins.get(name);
  if (!plugin) {
    console.warn(`[PluginManager] Plugin "${name}" is not registered.`);
    return false;
  }
  try {
    plugin.disable();
    _enabledPlugins.delete(name);
    notifyListeners(name, false);
    return true;
  } catch (err) {
    console.error(`[PluginManager] Failed to disable plugin "${name}":`, err);
    return false;
  }
}

/**
 * Toggle a plugin
 * @param {string} name 
 * @param {boolean} [forceState]
 * @param {object} [options]
 */
export function togglePlugin(name, forceState, options) {
  const currentState = isPluginEnabled(name);
  const nextState = typeof forceState === 'boolean' ? forceState : !currentState;
  if (nextState) {
    return enablePlugin(name, options);
  } else {
    return disablePlugin(name);
  }
}

/**
 * Check if a plugin is currently enabled
 * @param {string} name 
 */
export function isPluginEnabled(name) {
  const plugin = _plugins.get(name);
  if (plugin && typeof plugin.isEnabled === 'function') {
    return plugin.isEnabled();
  }
  return _enabledPlugins.has(name);
}

/**
 * Configure an enabled or registered plugin
 * @param {string} name 
 * @param {object} config 
 */
export function configurePlugin(name, config) {
  const plugin = _plugins.get(name);
  if (plugin && typeof plugin.configure === 'function') {
    plugin.configure(config);
  }
}

/**
 * Get all registered plugin names and statuses
 */
export function getRegisteredPlugins() {
  const result = [];
  for (const [name, plugin] of _plugins.entries()) {
    result.push({
      name,
      enabled: isPluginEnabled(name),
      metadata: plugin.metadata || {}
    });
  }
  return result;
}

/**
 * Subscribe to plugin state changes
 * @param {function(string, boolean): void} listener 
 * @returns {function(): void} Unsubscribe function
 */
export function subscribePluginChanges(listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function notifyListeners(pluginName, enabled) {
  for (const listener of _listeners) {
    try {
      listener(pluginName, enabled);
    } catch (e) {
      console.error('[PluginManager] Error in plugin change listener:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socialcalc:plugin-change', {
      detail: { plugin: pluginName, enabled }
    }));
  }
}
