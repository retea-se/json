/**
 * JSON Toolbox CLI - CSV Operators
 * Pure CSV operators for Node.js
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Helpers
  // ============================================

  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const counts = {
      ',': (firstLine.match(/,/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length
    };
    let max = 0;
    let result = ',';
    for (const [delim, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        result = delim;
      }
    }
    return result;
  }

  function escapeCell(value, delimiter) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function parseRow(line, delimiter) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }

    cells.push(current.trim());
    return cells;
  }

  // ============================================
  // CSV Parse
  // ============================================

  function csvParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('csv.parse expects string input');
    }

    const {
      delimiter = 'auto',
      header = true,
      skipEmptyLines = true,
      trim = true
    } = params;

    const actualDelimiter = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
    let lines = input.split(/\r?\n/);

    if (skipEmptyLines) {
      lines = lines.filter(line => line.trim() !== '');
    }

    if (lines.length === 0) {
      return [];
    }

    const rows = lines.map(line => {
      const cells = parseRow(line, actualDelimiter);
      return trim ? cells.map(c => c.trim()) : cells;
    });

    if (!header) {
      return rows;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }

  // ============================================
  // CSV Stringify
  // ============================================

  function csvStringify(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('csv.stringify expects array input');
    }

    if (input.length === 0) {
      return '';
    }

    const {
      delimiter = ',',
      header = true,
      eol = '\n',
      columns = null
    } = params;

    const firstItem = input[0];

    if (Array.isArray(firstItem)) {
      return input.map(row =>
        row.map(cell => escapeCell(cell, delimiter)).join(delimiter)
      ).join(eol);
    }

    if (typeof firstItem === 'object' && firstItem !== null) {
      const keys = columns || Object.keys(firstItem);
      const rows = [];

      if (header) {
        rows.push(keys.map(k => escapeCell(k, delimiter)).join(delimiter));
      }

      input.forEach(item => {
        const row = keys.map(k => escapeCell(item[k], delimiter));
        rows.push(row.join(delimiter));
      });

      return rows.join(eol);
    }

    return input.map(item => escapeCell(item, delimiter)).join(eol);
  }

  // ============================================
  // CSV Transpose
  // ============================================

  function csvTranspose(input, params = {}) {
    if (!Array.isArray(input) || input.length === 0) {
      return input;
    }

    const firstItem = input[0];

    if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
      const headers = Object.keys(firstItem);
      return headers.map(header => {
        const row = { _key: header };
        input.forEach((item, i) => {
          row[`col_${i + 1}`] = item[header];
        });
        return row;
      });
    }

    if (Array.isArray(firstItem)) {
      const maxLen = Math.max(...input.map(row => row.length));
      const transposed = [];
      for (let i = 0; i < maxLen; i++) {
        transposed.push(input.map(row => row[i] !== undefined ? row[i] : ''));
      }
      return transposed;
    }

    return input;
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('csv.parse', csvParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ARRAY,
    description: 'Parse CSV string to array of objects'
  });

  registry.register('csv.stringify', csvStringify, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.STRING,
    description: 'Convert array to CSV string'
  });

  registry.register('csv.transpose', csvTranspose, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Transpose CSV data'
  });
};
