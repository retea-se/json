/**
 * JSON Toolbox CLI - Diff Operators
 * Pure diff operators for deterministic comparison
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Deep Diff
  // ============================================

  function deepDiff(left, right, path = '', ignoreArrayOrder = false) {
    const differences = [];

    // Type mismatch
    const leftType = getType(left);
    const rightType = getType(right);

    if (leftType !== rightType) {
      differences.push({
        path: path || '(root)',
        type: 'type_change',
        left: left,
        right: right,
        leftType: leftType,
        rightType: rightType
      });
      return differences;
    }

    // Compare arrays
    if (Array.isArray(left)) {
      if (ignoreArrayOrder) {
        return diffArraysUnordered(left, right, path, differences);
      }
      return diffArraysOrdered(left, right, path, differences);
    }

    // Compare objects
    if (leftType === 'object') {
      return diffObjects(left, right, path, differences, ignoreArrayOrder);
    }

    // Compare primitives
    if (left !== right) {
      differences.push({
        path: path || '(root)',
        type: 'changed',
        left: left,
        right: right
      });
    }

    return differences;
  }

  function getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  function diffArraysOrdered(left, right, basePath, differences) {
    const maxLen = Math.max(left.length, right.length);

    for (let i = 0; i < maxLen; i++) {
      const path = basePath ? `${basePath}[${i}]` : `[${i}]`;

      if (i >= left.length) {
        differences.push({
          path: path,
          type: 'added',
          right: right[i]
        });
      } else if (i >= right.length) {
        differences.push({
          path: path,
          type: 'removed',
          left: left[i]
        });
      } else {
        const itemDiffs = deepDiff(left[i], right[i], path, false);
        differences.push(...itemDiffs);
      }
    }

    return differences;
  }

  function diffArraysUnordered(left, right, basePath, differences) {
    const leftStrings = left.map(item => JSON.stringify(item));
    const rightStrings = right.map(item => JSON.stringify(item));

    const leftSet = new Set(leftStrings);
    const rightSet = new Set(rightStrings);

    // Find items only in left (removed)
    leftStrings.forEach((str, i) => {
      if (!rightSet.has(str)) {
        differences.push({
          path: basePath ? `${basePath}[${i}]` : `[${i}]`,
          type: 'removed',
          left: left[i]
        });
      }
    });

    // Find items only in right (added)
    rightStrings.forEach((str, i) => {
      if (!leftSet.has(str)) {
        differences.push({
          path: basePath ? `${basePath}[?]` : `[?]`,
          type: 'added',
          right: right[i]
        });
      }
    });

    return differences;
  }

  function diffObjects(left, right, basePath, differences, ignoreArrayOrder) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

    for (const key of allKeys) {
      const path = basePath ? `${basePath}.${key}` : key;
      const hasLeft = key in left;
      const hasRight = key in right;

      if (!hasLeft) {
        differences.push({
          path: path,
          type: 'added',
          right: right[key]
        });
      } else if (!hasRight) {
        differences.push({
          path: path,
          type: 'removed',
          left: left[key]
        });
      } else {
        const itemDiffs = deepDiff(left[key], right[key], path, ignoreArrayOrder);
        differences.push(...itemDiffs);
      }
    }

    return differences;
  }

  // ============================================
  // Diff Operator
  // ============================================

  function diffCompare(input, params = {}) {
    // Input must be object with left and right properties
    if (typeof input !== 'object' || input === null) {
      throw new Error('diff.compare expects object with left and right properties');
    }

    const { left, right } = input;
    const { ignoreOrder = false, ignoreWhitespace = false, outputFormat = 'detailed' } = params;

    let leftData = left;
    let rightData = right;

    // Parse strings if needed
    if (typeof leftData === 'string') {
      leftData = JSON.parse(ignoreWhitespace ? leftData.trim() : leftData);
    }
    if (typeof rightData === 'string') {
      rightData = JSON.parse(ignoreWhitespace ? rightData.trim() : rightData);
    }

    const differences = deepDiff(leftData, rightData, '', ignoreOrder);

    if (outputFormat === 'simple') {
      return {
        identical: differences.length === 0,
        count: differences.length
      };
    }

    if (outputFormat === 'paths') {
      return differences.map(d => d.path);
    }

    // Default: detailed
    return {
      identical: differences.length === 0,
      count: differences.length,
      differences: differences
    };
  }

  // ============================================
  // Patch Operator (apply changes)
  // ============================================

  function diffPatch(input, params = {}) {
    if (typeof input !== 'object' || input === null) {
      throw new Error('diff.patch expects object with target and patches');
    }

    const { target, patches } = input;
    if (!Array.isArray(patches)) {
      throw new Error('diff.patch expects patches to be an array');
    }

    let result = JSON.parse(JSON.stringify(target)); // Deep clone

    for (const patch of patches) {
      const { path, type, right, left } = patch;

      if (type === 'added' || type === 'changed') {
        setValueAtPath(result, path, right);
      } else if (type === 'removed') {
        deleteValueAtPath(result, path);
      }
    }

    return result;
  }

  function setValueAtPath(obj, path, value) {
    const segments = parsePath(path);
    let current = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (current[seg] === undefined) {
        current[seg] = typeof segments[i + 1] === 'number' ? [] : {};
      }
      current = current[seg];
    }

    current[segments[segments.length - 1]] = value;
  }

  function deleteValueAtPath(obj, path) {
    const segments = parsePath(path);
    let current = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      current = current[segments[i]];
      if (current === undefined) return;
    }

    const lastSeg = segments[segments.length - 1];
    if (Array.isArray(current)) {
      current.splice(lastSeg, 1);
    } else {
      delete current[lastSeg];
    }
  }

  function parsePath(path) {
    if (path === '(root)') return [];
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(s => s !== '')
      .map(s => /^\d+$/.test(s) ? parseInt(s, 10) : s);
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('diff.compare', diffCompare, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.OBJECT,
    description: 'Compare two JSON values and return differences'
  });

  registry.register('diff.patch', diffPatch, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ANY,
    description: 'Apply diff patches to target object'
  });
};
