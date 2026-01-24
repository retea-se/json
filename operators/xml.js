/**
 * JSON Toolbox - XML Operators
 * Version: 1.0.0
 * 
 * Pure XML operators for parsing and stringifying.
 * Uses DOMParser for XML parsing (browser built-in, no external dependencies).
 * No network, no storage side effects.
 * 
 * @see docs/operators.md for specification
 */

(function() {
  'use strict';

  const { TYPES } = window.OperatorRegistry;

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Escape XML special characters
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  function escapeXml(str) {
    if (typeof str !== 'string') str = String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Convert DOM node to JSON
   * @param {Node} node - DOM node
   * @param {object} options - Conversion options
   * @returns {any} - JSON representation
   */
  function nodeToJson(node, options = {}) {
    const {
      preserveAttributes = true,
      attributePrefix = '@',
      textNodeName = '#text',
      trim = true
    } = options;

    const result = {};
    
    // Handle attributes
    if (preserveAttributes && node.attributes && node.attributes.length > 0) {
      const attrsKey = attributePrefix + 'attributes';
      result[attrsKey] = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        result[attrsKey][attr.name] = attr.value;
      }
    }

    // Handle child nodes
    let hasTextContent = false;
    let textContent = '';

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      if (child.nodeType === 3) { // TEXT_NODE
        const text = trim ? child.textContent.trim() : child.textContent;
        if (text) {
          hasTextContent = true;
          textContent += text;
        }
      } else if (child.nodeType === 1) { // ELEMENT_NODE
        const childJson = nodeToJson(child, options);
        const name = child.nodeName;
        
        if (result[name] !== undefined) {
          if (!Array.isArray(result[name])) {
            result[name] = [result[name]];
          }
          result[name].push(childJson);
        } else {
          result[name] = childJson;
        }
      }
    }

    // Add text content
    if (hasTextContent) {
      const keys = Object.keys(result);
      const onlyAttrs = keys.length === 0 || (keys.length === 1 && keys[0].startsWith(attributePrefix));
      
      if (onlyAttrs && keys.length === 0) {
        // Text-only element, return as string
        return textContent;
      }
      
      result[textNodeName] = textContent;
    }

    // Simplify text-only nodes
    const resultKeys = Object.keys(result);
    if (resultKeys.length === 1 && resultKeys[0] === textNodeName) {
      return result[textNodeName];
    }

    return result;
  }

  // ============================================
  // XML Parse Operator
  // ============================================

  /**
   * Parse XML string to JSON object
   * @param {string} input - XML string
   * @param {object} params - Parse parameters
   * @returns {object} - Parsed JSON
   */
  function xmlParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('xml.parse expects string input');
    }

    const {
      preserveAttributes = true,
      attributePrefix = '@',
      textNodeName = '#text',
      trim = true
    } = params;

    // Use DOMParser (built-in)
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/xml');
    
    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      const errorText = parseError.textContent || 'Unknown XML parse error';
      throw new Error('Invalid XML: ' + errorText.substring(0, 200));
    }

    // Convert root element to JSON
    const root = doc.documentElement;
    const result = {};
    result[root.nodeName] = nodeToJson(root, {
      preserveAttributes,
      attributePrefix,
      textNodeName,
      trim
    });

    return result;
  }

  // ============================================
  // XML Stringify Operator
  // ============================================

  /**
   * Convert JSON object to XML string
   * @param {object} input - JSON object
   * @param {object} params - Stringify parameters
   * @returns {string} - XML string
   */
  function xmlStringify(input, params = {}) {
    if (typeof input !== 'object' || input === null) {
      throw new Error('xml.stringify expects object input');
    }

    const {
      indent = 2,
      declaration = true,
      attributePrefix = '@',
      textNodeName = '#text',
      rootName = 'root'
    } = params;

    const compact = indent === 0;
    
    function toXml(data, tagName, level = 0) {
      const spaces = compact ? '' : ' '.repeat(level * indent);
      const nl = compact ? '' : '\n';
      
      // Handle primitives
      if (data === null || data === undefined) {
        return `${spaces}<${tagName}/>${nl}`;
      }
      
      if (typeof data !== 'object') {
        return `${spaces}<${tagName}>${escapeXml(data)}</${tagName}>${nl}`;
      }
      
      // Handle arrays
      if (Array.isArray(data)) {
        return data.map(item => toXml(item, tagName, level)).join('');
      }
      
      // Handle objects
      let attrs = '';
      let content = '';
      let hasChildElements = false;
      const attrsKey = attributePrefix + 'attributes';
      
      // Extract attributes
      if (data[attrsKey]) {
        for (const [key, value] of Object.entries(data[attrsKey])) {
          attrs += ` ${key}="${escapeXml(value)}"`;
        }
      }
      
      // Process children
      for (const [key, value] of Object.entries(data)) {
        if (key === attrsKey) continue;
        
        if (key === textNodeName) {
          content += escapeXml(value);
        } else {
          hasChildElements = true;
          content += toXml(value, key, level + 1);
        }
      }
      
      // Build element
      if (content === '') {
        return `${spaces}<${tagName}${attrs}/>${nl}`;
      }
      
      if (hasChildElements) {
        return `${spaces}<${tagName}${attrs}>${nl}${content}${spaces}</${tagName}>${nl}`;
      }
      
      return `${spaces}<${tagName}${attrs}>${content}</${tagName}>${nl}`;
    }

    // Determine root element
    const keys = Object.keys(input);
    let xml = '';
    
    if (declaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>' + (compact ? '' : '\n');
    }
    
    if (keys.length === 1) {
      // Single root element
      xml += toXml(input[keys[0]], keys[0], 0);
    } else {
      // Wrap in root element
      xml += toXml(input, rootName, 0);
    }
    
    return xml.trim();
  }

  // ============================================
  // XML Format Operator
  // ============================================

  /**
   * Format/prettify XML string
   * @param {string} input - XML string
   * @param {object} params - Format parameters
   * @returns {string} - Formatted XML string
   */
  function xmlFormat(input, params = {}) {
    const parsed = xmlParse(input, params);
    return xmlStringify(parsed, {
      ...params,
      indent: params.indent || 2
    });
  }

  // ============================================
  // XML Minify Operator
  // ============================================

  /**
   * Minify XML string
   * @param {string} input - XML string
   * @param {object} params - Minify parameters
   * @returns {string} - Minified XML string
   */
  function xmlMinify(input, params = {}) {
    const parsed = xmlParse(input, params);
    return xmlStringify(parsed, {
      ...params,
      indent: 0,
      declaration: params.declaration !== false
    });
  }

  // ============================================
  // Register Operators
  // ============================================

  window.OperatorRegistry.register('xml.parse', xmlParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Parse XML string to JSON object',
    params: {
      preserveAttributes: { type: 'boolean', default: true, description: 'Preserve XML attributes' },
      attributePrefix: { type: 'string', default: '@', description: 'Prefix for attribute keys' },
      textNodeName: { type: 'string', default: '#text', description: 'Key for text content' },
      trim: { type: 'boolean', default: true, description: 'Trim whitespace' }
    }
  });

  window.OperatorRegistry.register('xml.stringify', xmlStringify, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.STRING,
    description: 'Convert JSON object to XML string',
    params: {
      indent: { type: 'number', default: 2, description: 'Indentation spaces (0 for compact)' },
      declaration: { type: 'boolean', default: true, description: 'Include XML declaration' },
      attributePrefix: { type: 'string', default: '@', description: 'Prefix for attribute keys' },
      textNodeName: { type: 'string', default: '#text', description: 'Key for text content' },
      rootName: { type: 'string', default: 'root', description: 'Root element name if needed' }
    }
  });

  window.OperatorRegistry.register('xml.format', xmlFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify XML string',
    params: {
      indent: { type: 'number', default: 2, description: 'Indentation spaces' }
    }
  });

  window.OperatorRegistry.register('xml.minify', xmlMinify, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Minify XML string',
    params: {
      declaration: { type: 'boolean', default: true, description: 'Include XML declaration' }
    }
  });

  // Export for direct usage
  window.XMLOperators = {
    parse: xmlParse,
    stringify: xmlStringify,
    format: xmlFormat,
    minify: xmlMinify,
    escapeXml,
    nodeToJson
  };

})();
