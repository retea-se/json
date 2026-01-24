/**
 * JSON Toolbox CLI - Schema Operators
 * JSON Schema generation and validation
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Schema Generation
  // ============================================

  function generateSchema(input, params = {}) {
    const {
      draft = '2020-12',
      required = true,
      examples = false,
      title = 'Generated Schema'
    } = params;

    const schema = {
      $schema: getDraftUri(draft),
      title: title
    };

    Object.assign(schema, inferType(input, required, examples));

    return schema;
  }

  function getDraftUri(draft) {
    const drafts = {
      '4': 'http://json-schema.org/draft-04/schema#',
      '6': 'http://json-schema.org/draft-06/schema#',
      '7': 'http://json-schema.org/draft-07/schema#',
      '2019-09': 'https://json-schema.org/draft/2019-09/schema',
      '2020-12': 'https://json-schema.org/draft/2020-12/schema'
    };
    return drafts[draft] || drafts['2020-12'];
  }

  function inferType(value, includeRequired = true, includeExamples = false) {
    if (value === null) {
      return { type: 'null' };
    }

    if (Array.isArray(value)) {
      return inferArrayType(value, includeRequired, includeExamples);
    }

    switch (typeof value) {
      case 'boolean':
        return { type: 'boolean' };

      case 'number':
        return inferNumberType(value);

      case 'string':
        return inferStringType(value, includeExamples);

      case 'object':
        return inferObjectType(value, includeRequired, includeExamples);

      default:
        return {};
    }
  }

  function inferNumberType(value) {
    if (Number.isInteger(value)) {
      return { type: 'integer' };
    }
    return { type: 'number' };
  }

  function inferStringType(value, includeExamples) {
    const schema = { type: 'string' };

    // Detect format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      schema.format = 'date';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      schema.format = 'date-time';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      schema.format = 'email';
    } else if (/^https?:\/\//.test(value)) {
      schema.format = 'uri';
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      schema.format = 'uuid';
    }

    if (includeExamples && value) {
      schema.examples = [value];
    }

    return schema;
  }

  function inferArrayType(arr, includeRequired, includeExamples) {
    if (arr.length === 0) {
      return { type: 'array', items: {} };
    }

    // Check if all items have the same type
    const itemTypes = arr.map(item => inferType(item, includeRequired, includeExamples));
    const uniqueTypes = [...new Set(itemTypes.map(t => JSON.stringify(t)))];

    if (uniqueTypes.length === 1) {
      return {
        type: 'array',
        items: itemTypes[0]
      };
    }

    // Mixed types - use anyOf
    return {
      type: 'array',
      items: {
        anyOf: uniqueTypes.map(t => JSON.parse(t))
      }
    };
  }

  function inferObjectType(obj, includeRequired, includeExamples) {
    const properties = {};
    const required = [];

    for (const [key, value] of Object.entries(obj)) {
      properties[key] = inferType(value, includeRequired, includeExamples);
      if (includeRequired && value !== null && value !== undefined) {
        required.push(key);
      }
    }

    const schema = {
      type: 'object',
      properties: properties
    };

    if (includeRequired && required.length > 0) {
      schema.required = required.sort();
    }

    return schema;
  }

  // ============================================
  // Schema Validation (Basic)
  // ============================================

  function validateSchema(input, params = {}) {
    const { schema } = params;

    if (!schema) {
      throw new Error('schema.validate requires schema parameter');
    }

    let schemaObj = schema;
    if (typeof schema === 'string') {
      schemaObj = JSON.parse(schema);
    }

    const errors = [];
    validateValue(input, schemaObj, '', errors);

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  function validateValue(value, schema, path, errors) {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    // Check type
    if (schema.type) {
      const actualType = getJsonType(value);
      const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];

      // Type compatibility: integer is a subtype of number
      let typeMatches = expectedTypes.includes(actualType);
      if (!typeMatches && actualType === 'integer' && expectedTypes.includes('number')) {
        typeMatches = true;
      }

      if (!typeMatches) {
        errors.push({
          path: path || '(root)',
          message: `Expected type ${expectedTypes.join(' or ')}, got ${actualType}`,
          keyword: 'type'
        });
        return;
      }
    }

    // Check enum
    if (schema.enum) {
      if (!schema.enum.some(e => JSON.stringify(e) === JSON.stringify(value))) {
        errors.push({
          path: path || '(root)',
          message: `Value must be one of: ${schema.enum.join(', ')}`,
          keyword: 'enum'
        });
      }
    }

    // Check const
    if (schema.const !== undefined) {
      if (JSON.stringify(value) !== JSON.stringify(schema.const)) {
        errors.push({
          path: path || '(root)',
          message: `Value must be ${JSON.stringify(schema.const)}`,
          keyword: 'const'
        });
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          path: path || '(root)',
          message: `String length must be >= ${schema.minLength}`,
          keyword: 'minLength'
        });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          path: path || '(root)',
          message: `String length must be <= ${schema.maxLength}`,
          keyword: 'maxLength'
        });
      }
      if (schema.pattern) {
        if (!new RegExp(schema.pattern).test(value)) {
          errors.push({
            path: path || '(root)',
            message: `String must match pattern: ${schema.pattern}`,
            keyword: 'pattern'
          });
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          path: path || '(root)',
          message: `Number must be >= ${schema.minimum}`,
          keyword: 'minimum'
        });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          path: path || '(root)',
          message: `Number must be <= ${schema.maximum}`,
          keyword: 'maximum'
        });
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push({
          path: path || '(root)',
          message: `Array must have >= ${schema.minItems} items`,
          keyword: 'minItems'
        });
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        errors.push({
          path: path || '(root)',
          message: `Array must have <= ${schema.maxItems} items`,
          keyword: 'maxItems'
        });
      }
      if (schema.items) {
        value.forEach((item, i) => {
          validateValue(item, schema.items, `${path}[${i}]`, errors);
        });
      }
    }

    // Object validations
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value);

      // Required properties
      if (schema.required) {
        for (const req of schema.required) {
          if (!keys.includes(req)) {
            errors.push({
              path: path ? `${path}.${req}` : req,
              message: `Missing required property: ${req}`,
              keyword: 'required'
            });
          }
        }
      }

      // Property validation
      if (schema.properties) {
        for (const [key, propValue] of Object.entries(value)) {
          const propSchema = schema.properties[key];
          if (propSchema) {
            validateValue(propValue, propSchema, path ? `${path}.${key}` : key, errors);
          } else if (schema.additionalProperties === false) {
            errors.push({
              path: path ? `${path}.${key}` : key,
              message: `Additional property not allowed: ${key}`,
              keyword: 'additionalProperties'
            });
          }
        }
      }
    }
  }

  function getJsonType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number' && Number.isInteger(value)) return 'integer';
    return typeof value;
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('schema.generate', generateSchema, {
    inputType: TYPES.ANY,
    outputType: TYPES.OBJECT,
    description: 'Generate JSON Schema from data'
  });

  registry.register('schema.validate', validateSchema, {
    inputType: TYPES.ANY,
    outputType: TYPES.OBJECT,
    description: 'Validate data against JSON Schema'
  });
};
