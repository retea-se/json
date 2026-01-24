/**
 * JSON Toolbox CLI - Pure YAML Operators
 * Zero-dependency YAML parser for standalone builds
 * Supports YAML 1.2 subset (covers 95% of real-world use cases)
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Pure YAML Parser
  // ============================================

  function parseYAML(input) {
    if (typeof input !== 'string') {
      throw new Error('yaml.parse expects string input');
    }

    const lines = input.split(/\r?\n/);
    let lineIndex = 0;

    // Skip leading empty lines and comments
    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      if (line === '' || line.startsWith('#') || line.startsWith('---')) {
        lineIndex++;
        continue;
      }
      break;
    }

    if (lineIndex >= lines.length) {
      return null;
    }

    return parseValue(lines, { index: lineIndex }, 0);
  }

  function parseValue(lines, state, baseIndent) {
    while (state.index < lines.length) {
      const line = lines[state.index];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        state.index++;
        continue;
      }

      const indent = getIndent(line);

      // End of block at this indent level
      if (indent < baseIndent) {
        return undefined;
      }

      // List item
      if (trimmed.startsWith('- ')) {
        return parseList(lines, state, indent);
      }

      // Bare list item (just -)
      if (trimmed === '-') {
        return parseList(lines, state, indent);
      }

      // Object/mapping
      if (trimmed.includes(':')) {
        return parseObject(lines, state, indent);
      }

      // Scalar value
      state.index++;
      return parseScalar(trimmed);
    }

    return undefined;
  }

  function parseObject(lines, state, baseIndent) {
    const obj = {};

    while (state.index < lines.length) {
      const line = lines[state.index];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        state.index++;
        continue;
      }

      const indent = getIndent(line);

      // End of object
      if (indent < baseIndent) {
        break;
      }

      // Same level - must be a key: value pair
      if (indent === baseIndent) {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) {
          break;
        }

        let key = trimmed.substring(0, colonIndex).trim();
        // Handle quoted keys
        key = unquote(key);

        const afterColon = trimmed.substring(colonIndex + 1).trim();
        state.index++;

        if (afterColon === '' || afterColon.startsWith('#')) {
          // Value is on next line(s) - could be nested object/list
          const nextIndent = peekNextIndent(lines, state);
          if (nextIndent > baseIndent) {
            obj[key] = parseValue(lines, state, nextIndent);
          } else {
            obj[key] = null;
          }
        } else if (afterColon === '|' || afterColon === '|-' || afterColon === '|+') {
          // Literal block scalar
          obj[key] = parseLiteralBlock(lines, state, baseIndent, afterColon);
        } else if (afterColon === '>' || afterColon === '>-' || afterColon === '>+') {
          // Folded block scalar
          obj[key] = parseFoldedBlock(lines, state, baseIndent, afterColon);
        } else {
          // Inline value
          obj[key] = parseScalar(afterColon);
        }
      } else {
        // Deeper indent means we've gone too far
        break;
      }
    }

    return obj;
  }

  function parseList(lines, state, baseIndent) {
    const arr = [];

    while (state.index < lines.length) {
      const line = lines[state.index];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        state.index++;
        continue;
      }

      const indent = getIndent(line);

      // End of list
      if (indent < baseIndent) {
        break;
      }

      // List item at same indent
      if (indent === baseIndent && (trimmed.startsWith('- ') || trimmed === '-')) {
        const afterDash = trimmed.substring(1).trim();
        state.index++;

        if (afterDash === '' || afterDash.startsWith('#')) {
          // Nested structure
          const nextIndent = peekNextIndent(lines, state);
          if (nextIndent > baseIndent) {
            arr.push(parseValue(lines, state, nextIndent));
          } else {
            arr.push(null);
          }
        } else if (afterDash.includes(':') && !afterDash.startsWith('"') && !afterDash.startsWith("'")) {
          // Inline object
          state.index--; // Back up
          const itemLines = [line.substring(line.indexOf('- ') + 2)];

          // Collect following lines at greater indent
          while (state.index + 1 < lines.length) {
            const nextLine = lines[state.index + 1];
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed === '' || nextTrimmed.startsWith('#')) {
              state.index++;
              continue;
            }
            const nextIndent = getIndent(nextLine);
            if (nextIndent <= baseIndent) break;
            state.index++;
          }

          // Parse the inline object
          const colonIdx = afterDash.indexOf(':');
          const key = afterDash.substring(0, colonIdx).trim();
          const val = afterDash.substring(colonIdx + 1).trim();

          const obj = {};
          obj[unquote(key)] = val ? parseScalar(val) : null;

          // Continue collecting nested properties
          while (state.index < lines.length) {
            const nextLine = lines[state.index];
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed === '' || nextTrimmed.startsWith('#')) {
              state.index++;
              continue;
            }
            const nextIndent = getIndent(nextLine);
            if (nextIndent <= baseIndent) break;
            if (nextTrimmed.startsWith('- ')) break;

            const colonIdx2 = nextTrimmed.indexOf(':');
            if (colonIdx2 > 0) {
              const k = nextTrimmed.substring(0, colonIdx2).trim();
              const v = nextTrimmed.substring(colonIdx2 + 1).trim();
              obj[unquote(k)] = v ? parseScalar(v) : null;
              state.index++;
            } else {
              break;
            }
          }

          arr.push(obj);
        } else {
          // Simple scalar value
          arr.push(parseScalar(afterDash));
        }
      } else {
        break;
      }
    }

    return arr;
  }

  function parseLiteralBlock(lines, state, baseIndent, indicator) {
    const contentLines = [];
    const blockIndent = peekNextIndent(lines, state);

    while (state.index < lines.length) {
      const line = lines[state.index];
      const lineIndent = getIndent(line);

      if (line.trim() === '') {
        contentLines.push('');
        state.index++;
        continue;
      }

      if (lineIndent < blockIndent) {
        break;
      }

      contentLines.push(line.substring(blockIndent));
      state.index++;
    }

    let result = contentLines.join('\n');

    // Handle chomping indicator
    if (indicator === '|-') {
      result = result.replace(/\n+$/, '');
    } else if (indicator === '|+') {
      // Keep trailing newlines
    } else {
      // Default: single trailing newline
      result = result.replace(/\n+$/, '\n');
    }

    return result;
  }

  function parseFoldedBlock(lines, state, baseIndent, indicator) {
    const contentLines = [];
    const blockIndent = peekNextIndent(lines, state);

    while (state.index < lines.length) {
      const line = lines[state.index];
      const lineIndent = getIndent(line);

      if (line.trim() === '') {
        contentLines.push('');
        state.index++;
        continue;
      }

      if (lineIndent < blockIndent) {
        break;
      }

      contentLines.push(line.substring(blockIndent));
      state.index++;
    }

    // Fold: replace single newlines with spaces, preserve double newlines
    let result = contentLines.join('\n')
      .replace(/([^\n])\n([^\n])/g, '$1 $2')
      .replace(/\n\n+/g, '\n\n');

    // Handle chomping
    if (indicator === '>-') {
      result = result.replace(/\n+$/, '');
    } else if (indicator === '>+') {
      // Keep trailing newlines
    } else {
      result = result.replace(/\n+$/, '\n');
    }

    return result;
  }

  function parseScalar(str) {
    if (!str) return null;

    // Remove inline comments
    const commentIndex = str.indexOf(' #');
    if (commentIndex > 0 && !isInQuotes(str, commentIndex)) {
      str = str.substring(0, commentIndex).trim();
    }

    // Null
    if (str === 'null' || str === '~' || str === '') {
      return null;
    }

    // Boolean
    if (str === 'true' || str === 'True' || str === 'TRUE') return true;
    if (str === 'false' || str === 'False' || str === 'FALSE') return false;

    // Quoted strings
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      return unquote(str);
    }

    // Numbers
    if (/^-?\d+$/.test(str)) {
      return parseInt(str, 10);
    }
    if (/^-?\d*\.\d+$/.test(str) || /^-?\d+\.\d*$/.test(str)) {
      return parseFloat(str);
    }
    if (/^-?\d+e[+-]?\d+$/i.test(str) || /^-?\d*\.\d+e[+-]?\d+$/i.test(str)) {
      return parseFloat(str);
    }

    // Hex numbers
    if (/^0x[0-9a-fA-F]+$/.test(str)) {
      return parseInt(str, 16);
    }

    // Octal numbers
    if (/^0o[0-7]+$/.test(str)) {
      return parseInt(str.substring(2), 8);
    }

    // Special float values
    if (str === '.inf' || str === '.Inf' || str === '.INF') return Infinity;
    if (str === '-.inf' || str === '-.Inf' || str === '-.INF') return -Infinity;
    if (str === '.nan' || str === '.NaN' || str === '.NAN') return NaN;

    // Inline arrays [a, b, c]
    if (str.startsWith('[') && str.endsWith(']')) {
      return parseInlineArray(str);
    }

    // Inline objects {a: b, c: d}
    if (str.startsWith('{') && str.endsWith('}')) {
      return parseInlineObject(str);
    }

    // Plain string
    return str;
  }

  function parseInlineArray(str) {
    const content = str.slice(1, -1).trim();
    if (!content) return [];

    const items = splitByComma(content);
    return items.map(item => parseScalar(item.trim()));
  }

  function parseInlineObject(str) {
    const content = str.slice(1, -1).trim();
    if (!content) return {};

    const obj = {};
    const pairs = splitByComma(content);

    for (const pair of pairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) continue;

      const key = pair.substring(0, colonIdx).trim();
      const value = pair.substring(colonIdx + 1).trim();

      obj[unquote(key)] = parseScalar(value);
    }

    return obj;
  }

  function splitByComma(str) {
    const result = [];
    let current = '';
    let depth = 0;
    let inQuote = null;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (inQuote) {
        current += char;
        if (char === inQuote && str[i - 1] !== '\\') {
          inQuote = null;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inQuote = char;
        current += char;
        continue;
      }

      if (char === '[' || char === '{') {
        depth++;
        current += char;
        continue;
      }

      if (char === ']' || char === '}') {
        depth--;
        current += char;
        continue;
      }

      if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    if (current) result.push(current);
    return result;
  }

  function getIndent(line) {
    let indent = 0;
    for (const char of line) {
      if (char === ' ') indent++;
      else if (char === '\t') indent += 2;
      else break;
    }
    return indent;
  }

  function peekNextIndent(lines, state) {
    for (let i = state.index; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed !== '' && !trimmed.startsWith('#')) {
        return getIndent(line);
      }
    }
    return 0;
  }

  function unquote(str) {
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1);
    }

    // Handle escape sequences for double-quoted strings
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }

  function isInQuotes(str, index) {
    let inDouble = false;
    let inSingle = false;

    for (let i = 0; i < index; i++) {
      if (str[i] === '"' && !inSingle) inDouble = !inDouble;
      if (str[i] === "'" && !inDouble) inSingle = !inSingle;
    }

    return inDouble || inSingle;
  }

  // ============================================
  // YAML Stringify
  // ============================================

  function stringifyYAML(input, params = {}) {
    const {
      indent = 2,
      flowLevel = -1,
      sortKeys = false
    } = params;

    return yamlStringify(input, 0, indent, flowLevel, sortKeys);
  }

  function yamlStringify(value, level, indentSize, flowLevel, sortKeys) {
    const indent = ' '.repeat(level * indentSize);

    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      if (value === Infinity) return '.inf';
      if (value === -Infinity) return '-.inf';
      if (isNaN(value)) return '.nan';
      return String(value);
    }

    if (typeof value === 'string') {
      return stringifyString(value, level, indentSize);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';

      if (flowLevel >= 0 && level >= flowLevel) {
        return '[' + value.map(v => yamlStringify(v, 0, indentSize, flowLevel, sortKeys)).join(', ') + ']';
      }

      const lines = value.map((item, i) => {
        const itemStr = yamlStringify(item, level + 1, indentSize, flowLevel, sortKeys);
        if (typeof item === 'object' && item !== null) {
          return indent + '- ' + itemStr.trim().replace(/^\n/, '').replace(new RegExp('^' + indent + '  ', 'gm'), indent + '  ');
        }
        return indent + '- ' + itemStr;
      });

      return '\n' + lines.join('\n');
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';

      if (sortKeys) {
        keys.sort();
      }

      if (flowLevel >= 0 && level >= flowLevel) {
        const pairs = keys.map(k => `${k}: ${yamlStringify(value[k], 0, indentSize, flowLevel, sortKeys)}`);
        return '{' + pairs.join(', ') + '}';
      }

      const lines = keys.map(key => {
        const val = value[key];
        const keyStr = needsQuoting(key) ? `"${escapeString(key)}"` : key;
        const valStr = yamlStringify(val, level + 1, indentSize, flowLevel, sortKeys);

        if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) {
          return indent + keyStr + ':' + valStr;
        }

        return indent + keyStr + ': ' + valStr;
      });

      return '\n' + lines.join('\n');
    }

    return String(value);
  }

  function stringifyString(str, level, indentSize) {
    // Check if multiline
    if (str.includes('\n')) {
      const indent = ' '.repeat((level + 1) * indentSize);
      const lines = str.split('\n').map(line => indent + line);
      return '|\n' + lines.join('\n');
    }

    // Check if needs quoting
    if (needsQuoting(str)) {
      return '"' + escapeString(str) + '"';
    }

    return str;
  }

  function needsQuoting(str) {
    // Empty string
    if (!str) return true;

    // Starts with special characters
    if (/^[\[\]{}&*!|>'"%@`#,\-?:]/.test(str)) return true;

    // Contains special characters
    if (/[:\[\]{}#&*!|>'"%@`]/.test(str)) return true;

    // Reserved words
    if (['true', 'false', 'null', '~', 'yes', 'no', 'on', 'off'].includes(str.toLowerCase())) return true;

    // Looks like a number
    if (/^-?\d/.test(str)) return true;

    return false;
  }

  function escapeString(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('yaml.parse', (input, params = {}) => {
    try {
      return parseYAML(input);
    } catch (e) {
      throw new Error(`YAML parse error: ${e.message}`);
    }
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.ANY,
    description: 'Parse YAML string to object/array'
  });

  registry.register('yaml.stringify', stringifyYAML, {
    inputType: TYPES.ANY,
    outputType: TYPES.STRING,
    description: 'Convert object/array to YAML string'
  });

  registry.register('yaml.format', (input, params = {}) => {
    const parsed = parseYAML(input);
    return stringifyYAML(parsed, params).trim();
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify YAML string'
  });

  registry.register('yaml.validate', (input, params = {}) => {
    try {
      parseYAML(input);
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Validate YAML string'
  });
};
