/**
 * JSON Toolbox - Schema Module
 * Version: 1.0
 * 
 * Features:
 * - Generate JSON Schema from JSON
 * - Validate JSON against Schema
 * - Schema to TypeScript conversion
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  function init() {
    const panel = document.getElementById('content-schema');
    if (!panel) return;

    panel.innerHTML = `
      <div class="schema-module">
        <!-- Mode Toggle -->
        <div class="schema-module__modes">
          <button type="button" class="schema-module__mode schema-module__mode--active" data-mode="generate">
            <i data-lucide="sparkles"></i>
            ${t('schema_generate', 'Generate Schema')}
          </button>
          <button type="button" class="schema-module__mode" data-mode="validate">
            <i data-lucide="check-circle"></i>
            ${t('schema_validate', 'Validate')}
          </button>
        </div>

        <!-- Generate Mode -->
        <div class="schema-module__panel" id="schemaGenerate">
          <div class="schema-module__input-area">
            <label class="schema-module__label">
              <span class="schema-module__label-text">JSON Input</span>
            </label>
            <textarea 
              id="schemaInput" 
              class="schema-module__textarea"
              placeholder="${t('schema_input_placeholder', 'Paste JSON to generate schema from...')}"
              spellcheck="false"
            ></textarea>
          </div>

          <div class="schema-module__options">
            <div class="schema-module__option">
              <label class="schema-module__checkbox-label">
                <input type="checkbox" id="schemaRequired" checked>
                <span>${t('schema_mark_required', 'Mark all properties as required')}</span>
              </label>
            </div>
            <div class="schema-module__option">
              <label class="schema-module__checkbox-label">
                <input type="checkbox" id="schemaExamples">
                <span>${t('schema_include_examples', 'Include example values')}</span>
              </label>
            </div>
          </div>

          <div class="schema-module__actions">
            <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="schemaGenerateBtn">
              <i data-lucide="sparkles"></i>
              ${t('schema_generate_btn', 'Generate Schema')}
            </button>
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="schemaClearBtn">
              <i data-lucide="trash-2"></i>
              ${t('clear', 'Clear')}
            </button>
          </div>
        </div>

        <!-- Validate Mode (hidden by default) -->
        <div class="schema-module__panel hidden" id="schemaValidate">
          <div class="schema-module__inputs-grid">
            <div class="schema-module__input-area">
              <label class="schema-module__label">
                <span class="schema-module__label-text">JSON Data</span>
              </label>
              <textarea 
                id="schemaValidateData" 
                class="schema-module__textarea"
                placeholder="${t('schema_data_placeholder', 'Paste JSON data to validate...')}"
                spellcheck="false"
              ></textarea>
            </div>
            <div class="schema-module__input-area">
              <label class="schema-module__label">
                <span class="schema-module__label-text">JSON Schema</span>
              </label>
              <textarea 
                id="schemaValidateSchema" 
                class="schema-module__textarea"
                placeholder="${t('schema_schema_placeholder', 'Paste JSON Schema...')}"
                spellcheck="false"
              ></textarea>
            </div>
          </div>

          <div class="schema-module__actions">
            <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="schemaValidateBtn">
              <i data-lucide="check-circle"></i>
              ${t('schema_validate_btn', 'Validate')}
            </button>
          </div>

          <div class="schema-module__result hidden" id="schemaValidateResult"></div>
        </div>

        <!-- Output -->
        <div class="schema-module__output-area" id="schemaOutputArea">
          <label class="schema-module__label">
            <span class="schema-module__label-text">${t('schema_output', 'Generated Schema')}</span>
          </label>
          <textarea 
            id="schemaOutput" 
            class="schema-module__textarea schema-module__textarea--output"
            readonly
          ></textarea>
          <div class="schema-module__actions">
            <button type="button" class="json-toolbox__btn" id="schemaCopyBtn">
              <i data-lucide="copy"></i>
              ${t('copy', 'Copy')}
            </button>
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="schemaDownloadBtn">
              <i data-lucide="download"></i>
              ${t('download', 'Download')}
            </button>
          </div>
        </div>
      </div>
    `;

    addStyles();
    window.JSONToolbox?.refreshIcons(panel);
    bindEvents();
    restoreState();
  }

  function bindEvents() {
    document.querySelectorAll('.schema-module__mode').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
    document.getElementById('schemaGenerateBtn').addEventListener('click', generateSchema);
    document.getElementById('schemaValidateBtn').addEventListener('click', validateSchema);
    document.getElementById('schemaClearBtn').addEventListener('click', clearAll);
    document.getElementById('schemaCopyBtn')?.addEventListener('click', copyOutput);
    document.getElementById('schemaDownloadBtn')?.addEventListener('click', downloadOutput);
    document.getElementById('schemaInput').addEventListener('input', debounce(saveState, 300));
    document.getElementById('schemaInput').addEventListener('keydown', handleKeydown);
  }

  function setMode(mode) {
    document.querySelectorAll('.schema-module__mode').forEach(btn => {
      btn.classList.toggle('schema-module__mode--active', btn.dataset.mode === mode);
    });
    document.getElementById('schemaGenerate').classList.toggle('hidden', mode !== 'generate');
    document.getElementById('schemaValidate').classList.toggle('hidden', mode !== 'validate');
    document.getElementById('schemaOutputArea').classList.toggle('hidden', mode !== 'generate');
  }

  function generateSchema() {
    const input = document.getElementById('schemaInput').value.trim();
    const output = document.getElementById('schemaOutput');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    try {
      const data = JSON.parse(input);
      const markRequired = document.getElementById('schemaRequired').checked;
      const includeExamples = document.getElementById('schemaExamples').checked;

      const schema = jsonToSchema(data, { markRequired, includeExamples });
      output.value = JSON.stringify(schema, null, 2);

      // Analytics: track successful schema generation
      if (window.JTA) {
        window.JTA.trackSuccess('schema', 'generate');
      }
      showStatus(t('schema_generated', 'Schema generated'), 'success');
      saveState();

    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('schema', 'generate');
      }
      output.value = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  function jsonToSchema(data, options = {}, isRoot = true) {
    const schema = {};

    if (isRoot) {
      schema.$schema = 'https://json-schema.org/draft/2020-12/schema';
    }

    if (data === null) {
      schema.type = 'null';
    } else if (Array.isArray(data)) {
      schema.type = 'array';
      if (data.length > 0) {
        // Infer items schema from first element
        schema.items = jsonToSchema(data[0], options, false);
      }
    } else if (typeof data === 'object') {
      schema.type = 'object';
      schema.properties = {};
      
      const keys = Object.keys(data);
      keys.forEach(key => {
        schema.properties[key] = jsonToSchema(data[key], options, false);
        if (options.includeExamples && typeof data[key] !== 'object') {
          schema.properties[key].examples = [data[key]];
        }
      });

      if (options.markRequired && keys.length > 0) {
        schema.required = keys;
      }
    } else if (typeof data === 'string') {
      schema.type = 'string';
      // Detect formats
      if (/^\d{4}-\d{2}-\d{2}$/.test(data)) schema.format = 'date';
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(data)) schema.format = 'date-time';
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) schema.format = 'email';
      else if (/^https?:\/\//.test(data)) schema.format = 'uri';
    } else if (typeof data === 'number') {
      schema.type = Number.isInteger(data) ? 'integer' : 'number';
    } else if (typeof data === 'boolean') {
      schema.type = 'boolean';
    }

    return schema;
  }

  function validateSchema() {
    const dataInput = document.getElementById('schemaValidateData').value.trim();
    const schemaInput = document.getElementById('schemaValidateSchema').value.trim();
    const resultDiv = document.getElementById('schemaValidateResult');

    if (!dataInput || !schemaInput) {
      showStatus(t('schema_need_both', 'Please provide both JSON data and schema.'), 'error');
      return;
    }

    try {
      const data = JSON.parse(dataInput);
      const schema = JSON.parse(schemaInput);
      
      const errors = simpleValidate(data, schema);
      
      resultDiv.classList.remove('hidden');
      
      if (errors.length === 0) {
        resultDiv.innerHTML = `
          <div class="schema-module__valid">
            <i data-lucide="check-circle"></i>
            <span>${t('schema_valid', 'JSON is valid against schema')}</span>
          </div>
        `;
        showStatus(t('schema_valid', 'Validation passed'), 'success');
      } else {
        resultDiv.innerHTML = `
          <div class="schema-module__invalid">
            <i data-lucide="x-circle"></i>
            <span>${errors.length} ${t('schema_errors', 'error(s)')}</span>
          </div>
          <ul class="schema-module__error-list">
            ${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
          </ul>
        `;
        showStatus(t('schema_invalid', 'Validation failed'), 'error');
      }

    } catch (e) {
      resultDiv.classList.add('hidden');
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  // Simple schema validator
  function simpleValidate(data, schema, path = '') {
    const errors = [];

    if (schema.type) {
      const actualType = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
      if (schema.type !== actualType) {
        if (!(schema.type === 'integer' && actualType === 'number' && Number.isInteger(data))) {
          errors.push(`${path || 'root'}: expected ${schema.type}, got ${actualType}`);
          return errors;
        }
      }
    }

    if (schema.required && Array.isArray(schema.required) && typeof data === 'object') {
      schema.required.forEach(key => {
        if (!(key in data)) {
          errors.push(`${path || 'root'}: missing required property "${key}"`);
        }
      });
    }

    if (schema.properties && typeof data === 'object') {
      Object.keys(schema.properties).forEach(key => {
        if (key in data) {
          errors.push(...simpleValidate(data[key], schema.properties[key], path ? `${path}.${key}` : key));
        }
      });
    }

    if (schema.items && Array.isArray(data)) {
      data.forEach((item, i) => {
        errors.push(...simpleValidate(item, schema.items, `${path}[${i}]`));
      });
    }

    return errors;
  }

  async function copyOutput() {
    const output = document.getElementById('schemaOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('schema');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('schemaOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
    // Analytics: track download
    if (window.JTA) {
      window.JTA.trackDownload('schema', 'json');
    }
    showStatus(t('downloaded', 'Downloaded'), 'success');
  }

  function clearAll() {
    document.getElementById('schemaInput').value = '';
    document.getElementById('schemaOutput').value = '';
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); generateSchema(); }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('schema-input', document.getElementById('schemaInput').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const input = window.JSONToolbox.loadFromStorage('schema-input', '');
      if (input) document.getElementById('schemaInput').value = window.JSONToolbox.ensureString(input);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); };
  }

  function showStatus(message, type) {
    if (window.JSONToolbox?.showStatus) window.JSONToolbox.showStatus(message, type);
  }

  function addStyles() {
    if (document.getElementById('schema-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'schema-module-styles';
    style.textContent = `
      .schema-module { display: flex; flex-direction: column; gap: 1rem; }
      .schema-module__modes { display: flex; gap: 0.25rem; padding: 0.25rem; background: var(--jt-tab-bg); border-radius: 0.5rem; width: fit-content; }
      .schema-module__mode { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: transparent; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 500; color: var(--jt-tab-text); transition: all 0.15s ease; }
      .schema-module__mode:hover { background: var(--jt-tab-bg-hover); }
      .schema-module__mode--active { background: var(--jt-tab-bg-active); color: var(--jt-tab-text-active); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .schema-module__input-area, .schema-module__output-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .schema-module__inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      @media (max-width: 768px) { .schema-module__inputs-grid { grid-template-columns: 1fr; } }
      .schema-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .schema-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .schema-module__textarea { width: 100%; min-height: 150px; padding: 0.75rem; border: 1px solid var(--jt-panel-border); border-radius: 0.375rem; background: var(--jt-panel-bg); color: inherit; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem; line-height: 1.5; resize: vertical; }
      .schema-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .schema-module__textarea--output { background: var(--jt-tab-bg); }
      .schema-module__options { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0.75rem; background: var(--jt-tab-bg); border-radius: 0.375rem; }
      .schema-module__checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
      .schema-module__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
      .schema-module__result { margin-top: 1rem; }
      .schema-module__valid { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--jt-privacy-bg); border-radius: 0.375rem; color: var(--jt-privacy-text); font-weight: 500; }
      .schema-module__invalid { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--color-error-bg, #fce8ea); border-radius: 0.375rem 0.375rem 0 0; color: var(--color-error, #dc3545); font-weight: 500; }
      [data-theme="dark"] .schema-module__invalid { background: var(--color-error-bg, #211414); color: var(--color-error, #ff6b6b); }
      .schema-module__error-list { margin: 0; padding: 0.75rem 0.75rem 0.75rem 2rem; background: var(--jt-tab-bg); border-radius: 0 0 0.375rem 0.375rem; font-size: 0.8125rem; }
    `;
    document.head.appendChild(style);
  }

  window.SchemaModule = { init, generateSchema, jsonToSchema };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'schema') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="schema"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
