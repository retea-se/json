/**
 * JSON Toolbox - CSV Operators
 * Version: 1.0.0
 * 
 * Pure CSV operators for parsing and stringifying.
 * No DOM, no network, no storage side effects.
 * 
 * @see docs/operators.md for specification
 */

(function() {
  'use strict';

  const { TYPES } = window.OperatorRegistry;

  // ============================================
  // Pure Helper Functions
  // ============================================

  /**
   * Detect CSV delimiter from content
   * @param {string} text - CSV content
   * @returns {string} - Detected delimiter
   */
  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const counts = {
      ',': (firstLine.match(/,/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length
    };
    
    // Return delimiter with highest count, default to comma
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

  /**
   * Escape a CSV cell value
   * @param {any} value - Cell value
   * @param {string} delimiter - Field delimiter
   * @returns {string} - Escaped value
   */
  function escapeCell(value, delimiter) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Parse a CSV row handling quoted fields
   * @param {string} line - CSV line
   * @param {string} delimiter - Field delimiter
   * @returns {string[]} - Array of cell values
   */
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
            i++; // Skip escaped quote
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
  // CSV Parse Operator
  // ============================================

  /**
   * Parse CSV string to array of objects/arrays
   * @param {string} input - CSV string
   * @param {object} params - Parse parameters
   * @returns {array} - Parsed data
   */
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

    // Detect or use provided delimiter
    const actualDelimiter = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
    
    // Split into lines
    let lines = input.split(/\r?\n/);
    
    // Skip empty lines if configured
    if (skipEmptyLines) {
      lines = lines.filter(line => line.trim() !== '');
    }
    
    if (lines.length === 0) {
      return [];
    }

    // Parse all rows
    const rows = lines.map(line => {
      const cells = parseRow(line, actualDelimiter);
      return trim ? cells.map(c => c.trim()) : cells;
    });

    // If no header, return array of arrays
    if (!header) {
      return rows;
    }

    // Extract headers and convert to objects
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
  // CSV Stringify Operator
  // ============================================

  /**
   * Convert array to CSV string
   * @param {array} input - Array of objects or arrays
   * @param {object} params - Stringify parameters
   * @returns {string} - CSV string
   */
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
    
    // Handle array of arrays
    if (Array.isArray(firstItem)) {
      return input.map(row => 
        row.map(cell => escapeCell(cell, delimiter)).join(delimiter)
      ).join(eol);
    }

    // Handle array of objects
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

    // Handle array of primitives
    return input.map(item => escapeCell(item, delimiter)).join(eol);
  }

  // ============================================
  // CSV Transpose Operator
  // ============================================

  /**
   * Transpose CSV data (swap rows and columns)
   * @param {array} input - Array of objects or arrays
   * @param {object} params - Transpose parameters
   * @returns {array} - Transposed data
   */
  function csvTranspose(input, params = {}) {
    if (!Array.isArray(input) || input.length === 0) {
      return input;
    }

    const firstItem = input[0];

    // Array of objects
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

    // Array of arrays
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

  window.OperatorRegistry.register('csv.parse', csvParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ARRAY,
    description: 'Parse CSV string to array of objects',
    params: {
      delimiter: { type: 'string', default: 'auto', description: 'Field delimiter (auto, comma, tab, semicolon, pipe)' },
      header: { type: 'boolean', default: true, description: 'First row is header' },
      skipEmptyLines: { type: 'boolean', default: true, description: 'Skip empty lines' },
      trim: { type: 'boolean', default: true, description: 'Trim cell values' }
    }
  });

  window.OperatorRegistry.register('csv.stringify', csvStringify, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.STRING,
    description: 'Convert array to CSV string',
    params: {
      delimiter: { type: 'string', default: ',', description: 'Field delimiter' },
      header: { type: 'boolean', default: true, description: 'Include header row' },
      eol: { type: 'string', default: '\n', description: 'Line ending' },
      columns: { type: 'array', default: null, description: 'Columns to include (null = all)' }
    }
  });

  window.OperatorRegistry.register('csv.transpose', csvTranspose, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Transpose CSV data (swap rows and columns)',
    params: {}
  });

  // Export for direct usage
  window.CSVOperators = {
    parse: csvParse,
    stringify: csvStringify,
    transpose: csvTranspose,
    detectDelimiter,
    escapeCell,
    parseRow
  };

})();
