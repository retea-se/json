/**
 * JSON Toolbox - Operators Index
 * Version: 1.0.0
 * 
 * This file loads all operator modules in the correct order.
 * Include this file after loading vendor libraries (js-yaml, etc.)
 * 
 * Load order:
 * 1. registry.js - Central operator registry (required first)
 * 2. json.js - JSON operators
 * 3. csv.js - CSV operators
 * 4. xml.js - XML operators
 * 5. yaml.js - YAML operators (requires js-yaml)
 * 6. transform.js - Transform operators
 * 7. pipeline.js - Pipeline execution engine
 * 
 * @see docs/operators.md for specification
 * @see docs/pipelines.md for pipeline specification
 */

(function() {
  'use strict';

  /**
   * Check if all operators are loaded
   * @returns {boolean}
   */
  function isLoaded() {
    return !!(
      window.OperatorRegistry &&
      window.JSONOperators &&
      window.CSVOperators &&
      window.XMLOperators &&
      window.YAMLOperators &&
      window.TransformOperators &&
      window.Pipeline
    );
  }

  /**
   * List all registered operators
   * @returns {string[]}
   */
  function listOperators() {
    if (!window.OperatorRegistry) {
      console.warn('[Operators] Registry not loaded');
      return [];
    }
    return window.OperatorRegistry.list();
  }

  /**
   * Get operator count by namespace
   * @returns {object}
   */
  function getOperatorStats() {
    const ops = listOperators();
    const stats = {};
    ops.forEach(id => {
      const ns = id.split('.')[0];
      stats[ns] = (stats[ns] || 0) + 1;
    });
    return {
      total: ops.length,
      byNamespace: stats
    };
  }

  /**
   * Log operator loading status
   */
  function logStatus() {
    if (isLoaded()) {
      const stats = getOperatorStats();
      console.info(
        `[Operators] Loaded ${stats.total} operators:`,
        Object.entries(stats.byNamespace)
          .map(([ns, count]) => `${ns}(${count})`)
          .join(', ')
      );
    } else {
      console.warn('[Operators] Some operators failed to load');
    }
  }

  // Export utilities
  window.OperatorsIndex = {
    isLoaded,
    listOperators,
    getOperatorStats,
    logStatus,
    
    // Version info
    VERSION: '1.0.0',
    
    // Operator module references
    get registry() { return window.OperatorRegistry; },
    get json() { return window.JSONOperators; },
    get csv() { return window.CSVOperators; },
    get xml() { return window.XMLOperators; },
    get yaml() { return window.YAMLOperators; },
    get transform() { return window.TransformOperators; },
    get pipeline() { return window.Pipeline; }
  };

  // Auto-log status when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(logStatus, 0);
    });
  } else {
    setTimeout(logStatus, 0);
  }

})();
