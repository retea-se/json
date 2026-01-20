/**
 * JSON Toolbox - Validate Module
 * Version: 1.0
 * 
 * Features:
 * - JSON syntax validation
 * - Detailed error messages with line numbers
 * - JSON Schema validation (optional)
 * - Structure analysis
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  function init() {
    const panel = document.getElementById('content-validate');
    if (!panel) return;

    panel.innerHTML = `
      <div class="validate-module">
        <!-- Input Area -->
        <div class="validate-module__input-area">
          <label class="validate-module__label">
            <span class="validate-module__label-text">JSON Input</span>
          </label>
          <textarea 
            id="validateInput" 
            class="validate-module__textarea"
            placeholder="${t('placeholder_json', 'Paste JSON here...')}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Schema (Optional) -->
        <details class="validate-module__schema-section">
          <summary class="validate-module__schema-toggle">
            <i data-lucide="network"></i>
            ${t('validate_schema_optional', 'JSON Schema (optional)')}
          </summary>
          <div class="validate-module__schema-content">
            <textarea 
              id="validateSchema" 
              class="validate-module__textarea validate-module__textarea--schema"
              placeholder="${t('validate_schema_placeholder', 'Paste JSON Schema here for validation...')}"
              spellcheck="false"
            ></textarea>
          </div>
        </details>

        <!-- Actions -->
        <div class="validate-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="validateBtn">
            <i data-lucide="check-circle"></i>
            ${t('validate_check', 'Validate')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="validateClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="validatePasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
        </div>

        <!-- Result Area -->
        <div class="validate-module__result" id="validateResult">
          <!-- Result will be inserted here -->
        </div>

        <!-- Actions for invalid JSON -->
        <div class="validate-module__fix-actions hidden" id="validateFixActions">
          <button type="button" class="json-toolbox__btn" id="validateSendToFix">
            <i data-lucide="wrench"></i>
            ${t('validate_send_to_fix', 'Send to Fix tab')}
          </button>
        </div>
      </div>
    `;

    addStyles();
    window.JSONToolbox?.refreshIcons(panel);
    bindEvents();
    restoreState();
  }

  function bindEvents() {
    document.getElementById('validateBtn').addEventListener('click', validate);
    document.getElementById('validateClearBtn').addEventListener('click', clearAll);
    document.getElementById('validatePasteBtn').addEventListener('click', pasteFromClipboard);
    document.getElementById('validateSendToFix')?.addEventListener('click', sendToFix);

    document.getElementById('validateInput').addEventListener('input', debounce(saveState, 300));
    document.getElementById('validateInput').addEventListener('keydown', handleKeydown);
  }

  function validate() {
    const input = document.getElementById('validateInput').value.trim();
    const schemaInput = document.getElementById('validateSchema').value.trim();
    const resultDiv = document.getElementById('validateResult');
    const fixActions = document.getElementById('validateFixActions');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    resultDiv.innerHTML = '';
    fixActions.classList.add('hidden');

    try {
      // Parse JSON
      const data = JSON.parse(input);
      
      // Analyze structure
      const analysis = analyzeStructure(data);
      
      // Schema validation if provided
      let schemaResult = null;
      if (schemaInput) {
        try {
          const schema = JSON.parse(schemaInput);
          schemaResult = validateAgainstSchema(data, schema);
        } catch (e) {
          schemaResult = { valid: false, error: `Schema parse error: ${e.message}` };
        }
      }

      // Show success
      resultDiv.innerHTML = `
        <div class="validate-module__result-success">
          <div class="validate-module__result-header">
            <i data-lucide="check-circle"></i>
            <span>${t('validate_valid', 'Valid JSON')}</span>
          </div>
          <div class="validate-module__result-details">
            <div class="validate-module__stat">
              <span class="validate-module__stat-label">${t('validate_type', 'Type')}:</span>
              <span class="validate-module__stat-value">${analysis.type}</span>
            </div>
            ${analysis.type === 'array' ? `
              <div class="validate-module__stat">
                <span class="validate-module__stat-label">${t('validate_items', 'Items')}:</span>
                <span class="validate-module__stat-value">${analysis.length}</span>
              </div>
            ` : ''}
            ${analysis.type === 'object' ? `
              <div class="validate-module__stat">
                <span class="validate-module__stat-label">${t('validate_keys', 'Keys')}:</span>
                <span class="validate-module__stat-value">${analysis.keys}</span>
              </div>
            ` : ''}
            <div class="validate-module__stat">
              <span class="validate-module__stat-label">${t('validate_depth', 'Depth')}:</span>
              <span class="validate-module__stat-value">${analysis.depth}</span>
            </div>
            <div class="validate-module__stat">
              <span class="validate-module__stat-label">${t('validate_size', 'Size')}:</span>
              <span class="validate-module__stat-value">${formatBytes(new Blob([input]).size)}</span>
            </div>
          </div>
          ${schemaResult ? `
            <div class="validate-module__schema-result ${schemaResult.valid ? 'validate-module__schema-result--valid' : 'validate-module__schema-result--invalid'}">
              <i data-lucide="${schemaResult.valid ? 'check' : 'x'}"></i>
              <span>${schemaResult.valid ? t('validate_schema_valid', 'Schema validation passed') : schemaResult.error}</span>
            </div>
          ` : ''}
        </div>
      `;

      // Analytics: track successful validation
      if (window.JTA) {
        window.JTA.trackSuccess('validate', 'syntax');
      }
      
      showStatus(t('validate_success', 'JSON is valid!'), 'success');

    } catch (e) {
      // Parse error
      const errorInfo = parseErrorMessage(e.message, input);
      
      resultDiv.innerHTML = `
        <div class="validate-module__result-error">
          <div class="validate-module__result-header">
            <i data-lucide="x-circle"></i>
            <span>${t('validate_invalid', 'Invalid JSON')}</span>
          </div>
          <div class="validate-module__error-details">
            <div class="validate-module__error-message">${escapeHtml(e.message)}</div>
            ${errorInfo.line ? `
              <div class="validate-module__error-location">
                <span>${t('validate_line', 'Line')} ${errorInfo.line}${errorInfo.column ? `, ${t('validate_column', 'Column')} ${errorInfo.column}` : ''}</span>
              </div>
              <pre class="validate-module__error-context">${escapeHtml(errorInfo.context)}</pre>
            ` : ''}
          </div>
        </div>
      `;

      // Analytics: track validation error
      if (window.JTA) {
        window.JTA.trackError('validate', 'syntax');
      }
      
      fixActions.classList.remove('hidden');
      showStatus(t('validate_error', 'JSON validation failed'), 'error');
    }

    saveState();
  }

  function analyzeStructure(data, depth = 0) {
    if (data === null) return { type: 'null', depth: depth + 1 };
    if (Array.isArray(data)) {
      let maxChildDepth = depth + 1;
      data.forEach(item => {
        const child = analyzeStructure(item, depth + 1);
        maxChildDepth = Math.max(maxChildDepth, child.depth);
      });
      return { type: 'array', length: data.length, depth: maxChildDepth };
    }
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      let maxChildDepth = depth + 1;
      keys.forEach(key => {
        const child = analyzeStructure(data[key], depth + 1);
        maxChildDepth = Math.max(maxChildDepth, child.depth);
      });
      return { type: 'object', keys: keys.length, depth: maxChildDepth };
    }
    return { type: typeof data, depth: depth + 1 };
  }

  function parseErrorMessage(message, input) {
    // Try to extract position from error message
    const posMatch = message.match(/position\s+(\d+)/i);
    const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    
    let line = null;
    let column = null;
    let context = '';

    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    } else if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = input.substring(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    if (line) {
      const lines = input.split('\n');
      const startLine = Math.max(0, line - 2);
      const endLine = Math.min(lines.length, line + 1);
      const contextLines = [];
      
      for (let i = startLine; i < endLine; i++) {
        const lineNum = i + 1;
        const prefix = lineNum === line ? '>' : ' ';
        contextLines.push(`${prefix} ${lineNum.toString().padStart(3)}: ${lines[i]}`);
        
        if (lineNum === line && column) {
          contextLines.push(`      ${' '.repeat(column - 1)}^`);
        }
      }
      context = contextLines.join('\n');
    }

    return { line, column, context };
  }

  function validateAgainstSchema(data, schema) {
    // Basic schema validation (simplified)
    // For full validation, would use ajv library
    try {
      if (schema.type) {
        const actualType = Array.isArray(data) ? 'array' : typeof data;
        if (schema.type !== actualType && !(schema.type === 'integer' && actualType === 'number' && Number.isInteger(data))) {
          return { valid: false, error: `Expected type "${schema.type}", got "${actualType}"` };
        }
      }

      if (schema.required && Array.isArray(schema.required)) {
        for (const key of schema.required) {
          if (!(key in data)) {
            return { valid: false, error: `Missing required property: "${key}"` };
          }
        }
      }

      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  function sendToFix() {
    const input = document.getElementById('validateInput').value;
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('fix-input', input);
      window.JSONToolbox.switchTab('fix');
      showStatus(t('sent_to_fix', 'Sent to Fix tab'), 'success');
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('validateInput').value = text;
      saveState();
      showStatus(t('pasted', 'Pasted from clipboard'), 'success');
    } catch (e) {
      showStatus(t('paste_error', 'Could not paste'), 'error');
    }
  }

  function clearAll() {
    document.getElementById('validateInput').value = '';
    document.getElementById('validateSchema').value = '';
    document.getElementById('validateResult').innerHTML = '';
    document.getElementById('validateFixActions').classList.add('hidden');
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      validate();
    }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('validate-input', document.getElementById('validateInput').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const saved = window.JSONToolbox.loadFromStorage('validate-input', '');
      if (saved) document.getElementById('validateInput').value = window.JSONToolbox.ensureString(saved);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  function showStatus(message, type) {
    if (window.JSONToolbox?.showStatus) window.JSONToolbox.showStatus(message, type);
  }

  function addStyles() {
    if (document.getElementById('validate-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'validate-module-styles';
    style.textContent = `
      .validate-module { display: flex; flex-direction: column; gap: 1rem; }
      .validate-module__input-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .validate-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .validate-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .validate-module__textarea {
        width: 100%; min-height: 180px; padding: 0.75rem;
        border: 1px solid var(--jt-panel-border); border-radius: 0.375rem;
        background: var(--jt-panel-bg); color: inherit;
        font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem;
        line-height: 1.5; resize: vertical;
      }
      .validate-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .validate-module__textarea--schema { min-height: 100px; }
      .validate-module__schema-section { margin-top: 0.5rem; }
      .validate-module__schema-toggle {
        display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem;
        background: var(--jt-tab-bg); border-radius: 0.375rem; cursor: pointer;
        font-size: 0.875rem; color: var(--jt-tab-text);
      }
      .validate-module__schema-toggle:hover { background: var(--jt-tab-bg-hover); }
      .validate-module__schema-content { padding-top: 0.5rem; }
      .validate-module__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .validate-module__result { min-height: 50px; }
      .validate-module__result-success, .validate-module__result-error {
        padding: 1rem; border-radius: 0.375rem;
      }
      .validate-module__result-success {
        background: var(--jt-privacy-bg); border: 1px solid var(--jt-privacy-border);
      }
      .validate-module__result-error {
        background: #ffebee; border: 1px solid #ef9a9a;
      }
      [data-theme="dark"] .validate-module__result-error {
        background: #b71c1c; border-color: #c62828;
      }
      .validate-module__result-header {
        display: flex; align-items: center; gap: 0.5rem;
        font-weight: 600; font-size: 1rem; margin-bottom: 0.75rem;
      }
      .validate-module__result-success .validate-module__result-header { color: var(--jt-privacy-text); }
      .validate-module__result-error .validate-module__result-header { color: #c62828; }
      [data-theme="dark"] .validate-module__result-error .validate-module__result-header { color: #ffcdd2; }
      .validate-module__result-details { display: flex; flex-wrap: wrap; gap: 1rem; }
      .validate-module__stat { display: flex; gap: 0.25rem; font-size: 0.875rem; }
      .validate-module__stat-label { color: var(--jt-tab-text); }
      .validate-module__stat-value { font-weight: 500; color: var(--jt-tab-text-active); }
      .validate-module__error-details { font-size: 0.875rem; }
      .validate-module__error-message { font-weight: 500; margin-bottom: 0.5rem; }
      .validate-module__error-location { color: var(--jt-tab-text); margin-bottom: 0.5rem; }
      .validate-module__error-context {
        background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 0.25rem;
        font-family: monospace; font-size: 0.75rem; overflow-x: auto; white-space: pre;
      }
      .validate-module__schema-result {
        display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem;
        padding: 0.5rem; border-radius: 0.25rem; font-size: 0.875rem;
      }
      .validate-module__schema-result--valid { background: rgba(46,125,50,0.1); color: #2e7d32; }
      .validate-module__schema-result--invalid { background: rgba(198,40,40,0.1); color: #c62828; }
      .validate-module__fix-actions { margin-top: 0.5rem; }
    `;
    document.head.appendChild(style);
  }

  window.ValidateModule = { init, validate };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'validate') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="validate"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
