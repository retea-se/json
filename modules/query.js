/**
 * JSON Toolbox - Query Module
 * Version: 1.0
 * 
 * Features:
 * - JSONPath queries
 * - Live query results
 * - Common query examples
 * - Uses jsonpath-plus library
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  function init() {
    const panel = document.getElementById('content-query');
    if (!panel) return;

    panel.innerHTML = `
      <div class="query-module">
        <!-- JSON Input -->
        <div class="query-module__input-area">
          <label class="query-module__label">
            <span class="query-module__label-text">JSON Input</span>
          </label>
          <textarea 
            id="queryInput" 
            class="query-module__textarea"
            placeholder="${t('placeholder_json', 'Paste JSON here...')}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Query Input -->
        <div class="query-module__query-area">
          <label class="query-module__label">
            <span class="query-module__label-text">${t('query_path', 'JSONPath Query')}</span>
          </label>
          <div class="query-module__query-row">
            <input 
              type="text" 
              id="queryPath" 
              class="query-module__query-input"
              placeholder="${t('query_placeholder', '$.store.book[*].author')}"
              spellcheck="false"
            >
            <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="queryBtn">
              <i data-lucide="search"></i>
              ${t('query_execute', 'Query')}
            </button>
          </div>
        </div>

        <!-- Examples -->
        <div class="query-module__examples">
          <span class="query-module__examples-label">${t('query_examples', 'Examples')}:</span>
          <button type="button" class="query-module__example" data-query="$.*">$.*</button>
          <button type="button" class="query-module__example" data-query="$..[*]">$..[*]</button>
          <button type="button" class="query-module__example" data-query="$..name">$..name</button>
          <button type="button" class="query-module__example" data-query="$[0]">$[0]</button>
          <button type="button" class="query-module__example" data-query="$[?(@.price<10)]">$[?(@.price&lt;10)]</button>
        </div>

        <!-- Help -->
        <details class="query-module__help">
          <summary class="query-module__help-toggle">
            <i data-lucide="circle-help"></i>
            ${t('query_syntax_help', 'JSONPath Syntax Help')}
          </summary>
          <div class="query-module__help-content">
            <table class="query-module__help-table">
              <tr><td><code>$</code></td><td>${t('query_help_root', 'Root object')}</td></tr>
              <tr><td><code>.</code></td><td>${t('query_help_child', 'Child operator')}</td></tr>
              <tr><td><code>..</code></td><td>${t('query_help_recursive', 'Recursive descent')}</td></tr>
              <tr><td><code>*</code></td><td>${t('query_help_wildcard', 'Wildcard (all elements)')}</td></tr>
              <tr><td><code>[n]</code></td><td>${t('query_help_index', 'Array index')}</td></tr>
              <tr><td><code>[start:end]</code></td><td>${t('query_help_slice', 'Array slice')}</td></tr>
              <tr><td><code>[?()]</code></td><td>${t('query_help_filter', 'Filter expression')}</td></tr>
            </table>
          </div>
        </details>

        <!-- Result -->
        <div class="query-module__result hidden" id="queryResult">
          <label class="query-module__label">
            <span class="query-module__label-text">${t('query_result', 'Query Result')}</span>
            <span class="query-module__stats" id="queryStats"></span>
          </label>
          <textarea 
            id="queryOutput" 
            class="query-module__textarea query-module__textarea--output"
            readonly
          ></textarea>
          <div class="query-module__actions">
            <button type="button" class="json-toolbox__btn" id="queryCopyBtn">
              <i data-lucide="copy"></i>
              ${t('copy', 'Copy')}
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
    document.getElementById('queryBtn').addEventListener('click', executeQuery);
    document.getElementById('queryCopyBtn')?.addEventListener('click', copyResult);
    document.getElementById('queryInput').addEventListener('input', debounce(saveState, 300));
    document.getElementById('queryPath').addEventListener('input', debounce(saveState, 300));
    document.getElementById('queryPath').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); executeQuery(); }
    });

    document.querySelectorAll('.query-module__example').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('queryPath').value = btn.dataset.query;
        executeQuery();
      });
    });
  }

  function executeQuery() {
    const input = document.getElementById('queryInput').value.trim();
    const path = document.getElementById('queryPath').value.trim();
    const resultDiv = document.getElementById('queryResult');
    const output = document.getElementById('queryOutput');
    const stats = document.getElementById('queryStats');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    if (!path) {
      showStatus(t('query_no_path', 'Please enter a JSONPath query.'), 'error');
      return;
    }

    try {
      const data = JSON.parse(input);
      let result;

      // Use jsonpath-plus if available
      if (window.JSONPath) {
        result = window.JSONPath.JSONPath({ path: path, json: data });
      } else {
        // Simple fallback for basic queries
        result = simpleQuery(data, path);
      }

      resultDiv.classList.remove('hidden');
      
      if (Array.isArray(result)) {
        stats.textContent = `${result.length} ${t('query_matches', 'match(es)')}`;
        output.value = JSON.stringify(result, null, 2);
      } else {
        stats.textContent = result !== undefined ? '1 match' : '0 matches';
        output.value = result !== undefined ? JSON.stringify(result, null, 2) : 'No matches';
      }

      // Analytics: track successful query
      if (window.JTA) {
        const matchCount = Array.isArray(result) ? result.length : (result !== undefined ? 1 : 0);
        window.JTA.trackSuccess('query', 'execute', matchCount);
      }
      showStatus(t('query_complete', 'Query complete'), 'success');
      saveState();

    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('query', 'execute');
      }
      resultDiv.classList.add('hidden');
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  // Simple JSONPath fallback for basic queries
  function simpleQuery(data, path) {
    // Handle root
    if (path === '$') return data;
    
    // Remove $ prefix
    path = path.replace(/^\$\.?/, '');
    
    // Handle simple paths like "store.book" or "users[0].name"
    const parts = path.split(/\.|\[|\]/).filter(Boolean);
    
    let current = data;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      
      // Handle wildcard
      if (part === '*') {
        if (Array.isArray(current)) {
          return current;
        }
        return Object.values(current);
      }
      
      // Handle numeric index
      if (/^\d+$/.test(part)) {
        current = current[parseInt(part, 10)];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  async function copyResult() {
    const output = document.getElementById('queryOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('query');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('query-input', document.getElementById('queryInput').value);
      window.JSONToolbox.saveToStorage('query-path', document.getElementById('queryPath').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const input = window.JSONToolbox.loadFromStorage('query-input', '');
      const path = window.JSONToolbox.loadFromStorage('query-path', '');
      if (input) document.getElementById('queryInput').value = window.JSONToolbox.ensureString(input);
      if (path) document.getElementById('queryPath').value = path; // path is always string
    }
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); };
  }

  function showStatus(message, type) {
    if (window.JSONToolbox?.showStatus) window.JSONToolbox.showStatus(message, type);
  }

  function addStyles() {
    if (document.getElementById('query-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'query-module-styles';
    style.textContent = `
      .query-module { display: flex; flex-direction: column; gap: 1rem; }
      .query-module__input-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .query-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .query-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .query-module__stats { font-size: 0.75rem; color: var(--jt-tab-text-active); margin-left: auto; }
      .query-module__textarea { width: 100%; min-height: 150px; padding: 0.75rem; border: 1px solid var(--jt-panel-border); border-radius: 0.375rem; background: var(--jt-panel-bg); color: inherit; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem; line-height: 1.5; resize: vertical; }
      .query-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .query-module__textarea--output { background: var(--jt-tab-bg); }
      .query-module__query-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .query-module__query-row { display: flex; gap: 0.5rem; }
      .query-module__query-input { flex: 1; padding: 0.625rem 0.75rem; border: 1px solid var(--jt-panel-border); border-radius: 0.375rem; background: var(--jt-panel-bg); color: inherit; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem; }
      .query-module__query-input:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .query-module__examples { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--jt-tab-bg); border-radius: 0.375rem; }
      .query-module__examples-label { font-weight: 500; font-size: 0.875rem; color: var(--jt-tab-text); }
      .query-module__example { padding: 0.25rem 0.5rem; background: var(--jt-panel-bg); border: 1px solid var(--jt-panel-border); border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; cursor: pointer; color: var(--jt-tab-text); }
      .query-module__example:hover { border-color: var(--jt-tab-text-active); color: var(--jt-tab-text-active); }
      .query-module__help { margin-top: 0.5rem; }
      .query-module__help-toggle { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--jt-tab-bg); border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; color: var(--jt-tab-text); }
      .query-module__help-toggle:hover { background: var(--jt-tab-bg-hover); }
      .query-module__help-content { padding: 0.75rem; margin-top: 0.5rem; }
      .query-module__help-table { width: 100%; font-size: 0.8125rem; }
      .query-module__help-table td { padding: 0.25rem 0.5rem; }
      .query-module__help-table code { background: var(--jt-tab-bg); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; }
      .query-module__actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    `;
    document.head.appendChild(style);
  }

  window.QueryModule = { init, executeQuery };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'query') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="query"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
