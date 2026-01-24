/**
 * JSON Toolbox CLI - Fix Operators
 * Pure JSON repair operators without external dependencies
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // JSON Repair
  // ============================================

  function repairJSON(input) {
    if (typeof input !== 'string') {
      throw new Error('fix.repair expects string input');
    }

    let str = input.trim();

    // Already valid?
    try {
      JSON.parse(str);
      return { repaired: false, output: str, method: null };
    } catch (originalError) {
      // Continue with repairs
    }

    const repairs = [];

    // Step 1: Remove BOM
    if (str.charCodeAt(0) === 0xFEFF) {
      str = str.slice(1);
      repairs.push('removed_bom');
    }

    // Step 2: Remove single-line comments
    str = str.replace(/\/\/[^\n\r]*/g, '');
    if (str !== input) repairs.push('removed_line_comments');

    // Step 3: Remove block comments
    str = str.replace(/\/\*[\s\S]*?\*\//g, '');
    if (str !== input) repairs.push('removed_block_comments');

    // Step 4: Convert Python-style booleans and None
    str = str.replace(/\bTrue\b/g, 'true');
    str = str.replace(/\bFalse\b/g, 'false');
    str = str.replace(/\bNone\b/g, 'null');
    if (str.includes('true') || str.includes('false') || str.includes('null')) {
      repairs.push('converted_python_literals');
    }

    // Step 5: Convert single quotes to double quotes (careful with nested)
    str = convertQuotes(str);
    repairs.push('converted_quotes');

    // Step 6: Add quotes to unquoted keys
    str = quoteUnquotedKeys(str);
    repairs.push('quoted_keys');

    // Step 7: Remove trailing commas
    str = str.replace(/,(\s*[\]}])/g, '$1');
    repairs.push('removed_trailing_commas');

    // Step 8: Handle newlines in strings (escape them)
    str = escapeNewlinesInStrings(str);

    // Step 9: Handle undefined -> null
    str = str.replace(/:\s*undefined\b/g, ': null');

    // Step 10: Wrap bare values
    const trimmed = str.trim();
    if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
      // Try wrapping in array
      try {
        JSON.parse(`[${str}]`);
        str = `[${str}]`;
        repairs.push('wrapped_in_array');
      } catch (e) {
        // Try other approaches
      }
    }

    // Final validation
    try {
      JSON.parse(str);
      return {
        repaired: true,
        output: str,
        method: repairs.join(', ')
      };
    } catch (e) {
      // Last resort: try to extract valid JSON
      const extracted = extractValidJSON(str);
      if (extracted) {
        return {
          repaired: true,
          output: extracted,
          method: 'extracted_valid_json'
        };
      }

      throw new Error(`Unable to repair JSON: ${e.message}`);
    }
  }

  function convertQuotes(str) {
    let result = '';
    let inDouble = false;
    let inSingle = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const prev = str[i - 1];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }

      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        result += char;
      } else if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        result += '"';
      } else {
        result += char;
      }
    }

    return result;
  }

  function quoteUnquotedKeys(str) {
    // Match unquoted keys before colons
    return str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  }

  function escapeNewlinesInStrings(str) {
    let result = '';
    let inString = false;
    let stringChar = null;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }

      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        result += char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = null;
        result += char;
      } else if (inString && (char === '\n' || char === '\r')) {
        result += char === '\n' ? '\\n' : '\\r';
      } else {
        result += char;
      }
    }

    return result;
  }

  function extractValidJSON(str) {
    // Try to find a valid JSON object or array
    const objectMatch = str.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        JSON.parse(objectMatch[0]);
        return objectMatch[0];
      } catch (e) {}
    }

    const arrayMatch = str.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[0]);
        return arrayMatch[0];
      } catch (e) {}
    }

    return null;
  }

  // ============================================
  // Fix and Format
  // ============================================

  function fixAndFormat(input, params = {}) {
    const { indent = 2 } = params;
    const result = repairJSON(input);
    const parsed = JSON.parse(result.output);
    return {
      ...result,
      output: JSON.stringify(parsed, null, indent)
    };
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('fix.repair', (input, params) => {
    const result = repairJSON(input);
    return result.output;
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Repair broken JSON string'
  });

  registry.register('fix.repairDetailed', repairJSON, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Repair JSON with detailed report'
  });

  registry.register('fix.format', fixAndFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Repair and format JSON'
  });
};
