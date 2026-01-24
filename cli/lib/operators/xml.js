/**
 * JSON Toolbox CLI - XML Operators
 * Pure XML operators for Node.js
 * Uses basic DOM parsing without external dependencies
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Helpers
  // ============================================

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
   * Simple XML parser for Node.js
   * Handles basic XML without namespaces or DTD
   */
  function parseXml(xml) {
    const result = {};
    let pos = 0;

    function skipWhitespace() {
      while (pos < xml.length && /\s/.test(xml[pos])) pos++;
    }

    function parseText() {
      let text = '';
      while (pos < xml.length && xml[pos] !== '<') {
        text += xml[pos++];
      }
      return text.trim();
    }

    function parseAttributes() {
      const attrs = {};
      while (pos < xml.length) {
        skipWhitespace();
        if (xml[pos] === '>' || xml[pos] === '/' || xml[pos] === '?') break;

        // Parse attribute name
        let name = '';
        while (pos < xml.length && /[a-zA-Z0-9_:-]/.test(xml[pos])) {
          name += xml[pos++];
        }
        if (!name) break;

        skipWhitespace();
        if (xml[pos] !== '=') continue;
        pos++; // skip =
        skipWhitespace();

        // Parse attribute value
        const quote = xml[pos];
        if (quote !== '"' && quote !== "'") continue;
        pos++; // skip opening quote

        let value = '';
        while (pos < xml.length && xml[pos] !== quote) {
          value += xml[pos++];
        }
        pos++; // skip closing quote

        attrs[name] = value;
      }
      return attrs;
    }

    function parseElement() {
      skipWhitespace();

      // Skip XML declaration and comments
      if (xml.substring(pos, pos + 2) === '<?') {
        while (pos < xml.length && xml.substring(pos, pos + 2) !== '?>') pos++;
        pos += 2;
        skipWhitespace();
      }

      if (xml.substring(pos, pos + 4) === '<!--') {
        while (pos < xml.length && xml.substring(pos, pos + 3) !== '-->') pos++;
        pos += 3;
        skipWhitespace();
      }

      if (xml[pos] !== '<') {
        return parseText();
      }

      pos++; // skip <

      // Parse tag name
      let tagName = '';
      while (pos < xml.length && /[a-zA-Z0-9_:-]/.test(xml[pos])) {
        tagName += xml[pos++];
      }

      if (!tagName) return null;

      const element = {};
      const attrs = parseAttributes();

      if (Object.keys(attrs).length > 0) {
        element['@attributes'] = attrs;
      }

      skipWhitespace();

      // Self-closing tag
      if (xml[pos] === '/') {
        pos += 2; // skip />
        return Object.keys(element).length === 0 ? '' : element;
      }

      pos++; // skip >

      // Parse children
      const children = {};
      let textContent = '';

      while (pos < xml.length) {
        skipWhitespace();

        // End tag
        if (xml.substring(pos, pos + 2) === '</') {
          pos += 2;
          while (pos < xml.length && xml[pos] !== '>') pos++;
          pos++; // skip >
          break;
        }

        // Comment
        if (xml.substring(pos, pos + 4) === '<!--') {
          while (pos < xml.length && xml.substring(pos, pos + 3) !== '-->') pos++;
          pos += 3;
          continue;
        }

        // Child element
        if (xml[pos] === '<') {
          const child = parseElement();
          if (child && typeof child === 'object') {
            // Get child tag name
            const nextTag = xml.substring(pos).match(/<([a-zA-Z0-9_:-]+)/);
            pos--; // Rewind for next iteration
            
            // Find the tag name of what we just parsed
            const prevMatch = xml.substring(0, pos).match(/<([a-zA-Z0-9_:-]+)[^>]*>(?:[^<]*|<[^/])*$/);
            if (prevMatch) {
              const childTagName = prevMatch[1];
              if (children[childTagName]) {
                if (!Array.isArray(children[childTagName])) {
                  children[childTagName] = [children[childTagName]];
                }
                children[childTagName].push(child);
              } else {
                children[childTagName] = child;
              }
            }
          }
          pos++;
        } else {
          // Text content
          const text = parseText();
          if (text) {
            textContent += text;
          }
        }
      }

      // Build result
      if (textContent && Object.keys(children).length === 0 && Object.keys(element).length === 0) {
        return textContent;
      }

      if (textContent) {
        element['#text'] = textContent;
      }

      Object.assign(element, children);

      return element;
    }

    skipWhitespace();
    const root = parseElement();

    // Find root tag name
    const rootMatch = xml.match(/<([a-zA-Z0-9_:-]+)/);
    if (rootMatch) {
      return { [rootMatch[1]]: root };
    }

    return root;
  }

  // ============================================
  // XML Parse (Simplified)
  // ============================================

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

    // Simple regex-based XML to JSON conversion
    let json = {};
    
    // Remove XML declaration
    let xml = input.replace(/<\?xml[^>]*\?>/gi, '').trim();
    
    // Remove comments
    xml = xml.replace(/<!--[\s\S]*?-->/g, '');

    // Find root element
    const rootMatch = xml.match(/<([a-zA-Z0-9_:-]+)(\s[^>]*)?\s*(?:\/>|>([\s\S]*?)<\/\1>)/);
    if (!rootMatch) {
      throw new Error('Invalid XML: no root element found');
    }

    const rootName = rootMatch[1];
    const rootAttrs = rootMatch[2] || '';
    const rootContent = rootMatch[3] || '';

    function parseNode(content, attrs) {
      const result = {};

      // Parse attributes
      if (preserveAttributes && attrs) {
        const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*["']([^"']*)["']/g;
        let match;
        const attributes = {};
        while ((match = attrRegex.exec(attrs)) !== null) {
          attributes[match[1]] = match[2];
        }
        if (Object.keys(attributes).length > 0) {
          result[attributePrefix + 'attributes'] = attributes;
        }
      }

      // If content is just text
      const trimmedContent = trim ? content.trim() : content;
      if (!trimmedContent.includes('<')) {
        if (Object.keys(result).length === 0) {
          return trimmedContent;
        }
        if (trimmedContent) {
          result[textNodeName] = trimmedContent;
        }
        return result;
      }

      // Parse child elements
      const childRegex = /<([a-zA-Z0-9_:-]+)(\s[^>]*)?\s*(?:\/>|>([\s\S]*?)<\/\1>)/g;
      let childMatch;
      
      while ((childMatch = childRegex.exec(content)) !== null) {
        const childName = childMatch[1];
        const childAttrs = childMatch[2] || '';
        const childContent = childMatch[3] || '';
        
        const childValue = parseNode(childContent, childAttrs);
        
        if (result[childName] !== undefined) {
          if (!Array.isArray(result[childName])) {
            result[childName] = [result[childName]];
          }
          result[childName].push(childValue);
        } else {
          result[childName] = childValue;
        }
      }

      // Check for text content mixed with elements
      const textOnly = content.replace(/<[^>]+>/g, '').trim();
      if (textOnly && Object.keys(result).filter(k => !k.startsWith(attributePrefix)).length > 0) {
        result[textNodeName] = trim ? textOnly.trim() : textOnly;
      }

      return result;
    }

    json[rootName] = parseNode(rootContent, rootAttrs);
    return json;
  }

  // ============================================
  // XML Stringify
  // ============================================

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

      if (data === null || data === undefined) {
        return `${spaces}<${tagName}/>${nl}`;
      }

      if (typeof data !== 'object') {
        return `${spaces}<${tagName}>${escapeXml(data)}</${tagName}>${nl}`;
      }

      if (Array.isArray(data)) {
        return data.map(item => toXml(item, tagName, level)).join('');
      }

      let attrs = '';
      let content = '';
      let hasChildElements = false;
      const attrsKey = attributePrefix + 'attributes';

      if (data[attrsKey]) {
        for (const [key, value] of Object.entries(data[attrsKey])) {
          attrs += ` ${key}="${escapeXml(value)}"`;
        }
      }

      for (const [key, value] of Object.entries(data)) {
        if (key === attrsKey) continue;

        if (key === textNodeName) {
          content += escapeXml(value);
        } else {
          hasChildElements = true;
          content += toXml(value, key, level + 1);
        }
      }

      if (content === '') {
        return `${spaces}<${tagName}${attrs}/>${nl}`;
      }

      if (hasChildElements) {
        return `${spaces}<${tagName}${attrs}>${nl}${content}${spaces}</${tagName}>${nl}`;
      }

      return `${spaces}<${tagName}${attrs}>${content}</${tagName}>${nl}`;
    }

    const keys = Object.keys(input);
    let xml = '';

    if (declaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>' + (compact ? '' : '\n');
    }

    if (keys.length === 1) {
      xml += toXml(input[keys[0]], keys[0], 0);
    } else {
      xml += toXml(input, rootName, 0);
    }

    return xml.trim();
  }

  // ============================================
  // XML Format
  // ============================================

  function xmlFormat(input, params = {}) {
    const parsed = xmlParse(input, params);
    return xmlStringify(parsed, {
      ...params,
      indent: params.indent || 2
    });
  }

  // ============================================
  // XML Minify
  // ============================================

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

  registry.register('xml.parse', xmlParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Parse XML string to JSON object'
  });

  registry.register('xml.stringify', xmlStringify, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.STRING,
    description: 'Convert JSON object to XML string'
  });

  registry.register('xml.format', xmlFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify XML string'
  });

  registry.register('xml.minify', xmlMinify, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Minify XML string'
  });
};
