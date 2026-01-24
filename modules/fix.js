/**
 * JSON Toolbox - Fix Module
 * Version: 1.0
 * 
 * Features:
 * - Repair broken JSON automatically
 * - Fix common issues:
 *   - Trailing commas
 *   - Single quotes
 *   - Missing quotes on keys
 *   - Comments (// and block comments)
 *   - Unquoted strings
 *   - Python-style booleans/None
 * - Uses jsonrepair library when available
 * - Fallback to built-in repairs
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  function init() {
    const panel = document.getElementById('content-fix');
    if (!panel) return;

    panel.innerHTML = `
      <div class="fix-module">
        <!-- Input Area -->
        <div class="fix-module__input-area">
          <label class="fix-module__label">
            <span class="fix-module__label-text">${t('fix_input_label', 'Broken JSON Input')}</span>
          </label>
          <textarea 
            id="fixInput" 
            class="fix-module__textarea"
            placeholder="${t('fix_placeholder', 'Paste broken JSON here...')}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Common Issues Info -->
        <div class="fix-module__info">
          <div class="fix-module__info-header">
            <i data-lucide="info"></i>
            <span>${t('fix_can_fix', 'Can fix')}:</span>
          </div>
          <ul class="fix-module__issues-list">
            <li>${t('fix_trailing_commas', 'Trailing commas')}</li>
            <li>${t('fix_single_quotes', 'Single quotes')}</li>
            <li>${t('fix_unquoted_keys', 'Unquoted property keys')}</li>
            <li>${t('fix_comments', 'Comments (// and /* */)')}</li>
            <li>${t('fix_python', 'Python True/False/None')}</li>
            <li>${t('fix_newlines', 'Newlines in strings')}</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="fix-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="fixBtn">
            <i data-lucide="wrench"></i>
            ${t('fix_repair', 'Repair JSON')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="fixClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="fixPasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
        </div>

        <!-- Result Area -->
        <div class="fix-module__result hidden" id="fixResultSection">
          <div class="fix-module__result-header" id="fixResultHeader">
            <!-- Header inserted dynamically -->
          </div>
          <div class="fix-module__output-area">
            <label class="fix-module__label">
              <span class="fix-module__label-text">${t('fix_repaired', 'Repaired JSON')}</span>
            </label>
            <textarea 
              id="fixOutput" 
              class="fix-module__textarea fix-module__textarea--output"
              readonly
            ></textarea>
          </div>
          <div class="fix-module__actions">
            <button type="button" class="json-toolbox__btn" id="fixCopyBtn">
              <i data-lucide="copy"></i>
              ${t('copy', 'Copy')}
            </button>
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="fixDownloadBtn">
              <i data-lucide="download"></i>
              ${t('download', 'Download')}
            </button>
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="fixSendToBtn">
              <i data-lucide="send"></i>
              ${t('send_to', 'Send to')}...
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
    document.getElementById('fixBtn').addEventListener('click', repair);
    document.getElementById('fixClearBtn').addEventListener('click', clearAll);
    document.getElementById('fixPasteBtn').addEventListener('click', pasteFromClipboard);
    document.getElementById('fixCopyBtn')?.addEventListener('click', copyOutput);
    document.getElementById('fixDownloadBtn')?.addEventListener('click', downloadOutput);
    document.getElementById('fixSendToBtn')?.addEventListener('click', sendToFormat);

    document.getElementById('fixInput').addEventListener('input', debounce(saveState, 300));
    document.getElementById('fixInput').addEventListener('keydown', handleKeydown);
  }

  function repair() {
    const input = document.getElementById('fixInput').value;
    const resultSection = document.getElementById('fixResultSection');
    const resultHeader = document.getElementById('fixResultHeader');
    const output = document.getElementById('fixOutput');

    if (!input.trim()) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    // First check if it's already valid
    try {
      JSON.parse(input);
      resultSection.classList.remove('hidden');
      resultHeader.innerHTML = `
        <div class="fix-module__result-already-valid">
          <i data-lucide="check-circle"></i>
          <span>${t('fix_already_valid', 'JSON is already valid!')}</span>
        </div>
      `;
      output.value = JSON.stringify(JSON.parse(input), null, 2);
      showStatus(t('fix_no_repair_needed', 'No repair needed'), 'success');
      return;
    } catch (originalError) {
      // Try to repair
    }

    try {
      let repaired;
      let method = 'built-in';

      // Try jsonrepair library if available
      if (window.jsonrepair) {
        try {
          repaired = window.jsonrepair(input);
          method = 'jsonrepair';
        } catch (e) {
          // Fall back to built-in
          repaired = builtInRepair(input);
        }
      } else {
        repaired = builtInRepair(input);
      }

      // Verify the repair worked
      const parsed = JSON.parse(repaired);
      const formatted = JSON.stringify(parsed, null, 2);

      resultSection.classList.remove('hidden');
      resultHeader.innerHTML = `
        <div class="fix-module__result-success">
          <i data-lucide="check-circle"></i>
          <span>${t('fix_success', 'JSON repaired successfully!')}</span>
          <span class="fix-module__method">(${method})</span>
        </div>
      `;
      // Analytics: track successful repair
      if (window.JTA) {
        window.JTA.trackSuccess('fix', method);
      }
      
      output.value = formatted;
      showStatus(t('fix_repaired_success', 'JSON has been repaired'), 'success');
      saveState();

    } catch (e) {
      resultSection.classList.remove('hidden');
      resultHeader.innerHTML = `
        <div class="fix-module__result-error">
          <i data-lucide="x-circle"></i>
          <span>${t('fix_failed', 'Could not repair JSON')}</span>
        </div>
        <div class="fix-module__error-message">${escapeHtml(e.message)}</div>
      `;
      // Analytics: track repair failure
      if (window.JTA) {
        window.JTA.trackError('fix', 'repair');
      }
      
      output.value = '';
      showStatus(t('fix_repair_failed', 'Repair failed'), 'error');
    }
  }

  function builtInRepair(input) {
    let json = input;

    // Remove BOM
    json = json.replace(/^\uFEFF/, '');

    // Remove single-line comments
    json = json.replace(/\/\/[^\n\r]*/g, '');

    // Remove multi-line comments
    json = json.replace(/\/\*[\s\S]*?\*\//g, '');

    // Replace single quotes with double quotes (but not inside strings)
    json = replaceSingleQuotes(json);

    // Fix unquoted property keys
    json = json.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Fix trailing commas in arrays and objects
    json = json.replace(/,(\s*[\]}])/g, '$1');

    // Fix Python-style booleans and None
    json = json.replace(/\bTrue\b/g, 'true');
    json = json.replace(/\bFalse\b/g, 'false');
    json = json.replace(/\bNone\b/g, 'null');

    // Fix undefined
    json = json.replace(/\bundefined\b/g, 'null');

    // Fix NaN and Infinity
    json = json.replace(/\bNaN\b/g, 'null');
    json = json.replace(/\bInfinity\b/g, 'null');
    json = json.replace(/\b-Infinity\b/g, 'null');

    // Fix missing commas between array elements (simple cases)
    json = json.replace(/}(\s*){/g, '},$1{');
    json = json.replace(/](\s*)\[/g, '],$1[');
    json = json.replace(/"(\s*)"/g, '",$1"');
    json = json.replace(/(\d)(\s*)"/, '$1,$2"');
    json = json.replace(/"(\s*)(\d)/, '",$1$2');

    // Fix newlines in strings
    json = json.replace(/[\n\r]+/g, (match, offset) => {
      // Check if we're inside a string
      const before = json.substring(0, offset);
      const quotes = (before.match(/"/g) || []).length;
      if (quotes % 2 === 1) {
        return '\\n';
      }
      return match;
    });

    return json;
  }

  function replaceSingleQuotes(str) {
    let result = '';
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let escape = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const prev = str[i - 1];

      if (escape) {
        result += char;
        escape = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escape = true;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        if (!inSingleQuote) {
          inSingleQuote = true;
          result += '"';
        } else {
          inSingleQuote = false;
          result += '"';
        }
        continue;
      }

      result += char;
    }

    return result;
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('fixInput').value = text;
      saveState();
      showStatus(t('pasted', 'Pasted from clipboard'), 'success');
    } catch (e) {
      showStatus(t('paste_error', 'Could not paste'), 'error');
    }
  }

  async function copyOutput() {
    const output = document.getElementById('fixOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to copy'), 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('fix');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('fixOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to download'), 'error');
      return;
    }
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repaired.json';
    a.click();
    URL.revokeObjectURL(url);
    // Analytics: track download
    if (window.JTA) {
      window.JTA.trackDownload('fix', 'json');
    }
    showStatus(t('downloaded', 'Downloaded'), 'success');
  }

  function sendToFormat() {
    const output = document.getElementById('fixOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to send'), 'error');
      return;
    }
    const btn = document.getElementById('fixSendToBtn');
    if (window.JSONToolboxHandoff) {
      window.JSONToolboxHandoff.showSendToDropdown(btn, 'fix', output);
    }
  }

  function clearAll() {
    document.getElementById('fixInput').value = '';
    document.getElementById('fixOutput').value = '';
    document.getElementById('fixResultSection').classList.add('hidden');
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      repair();
    }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('fix-input', document.getElementById('fixInput').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const saved = window.JSONToolbox.loadFromStorage('fix-input', '');
      if (saved) document.getElementById('fixInput').value = window.JSONToolbox.ensureString(saved);
    }
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
    if (document.getElementById('fix-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'fix-module-styles';
    style.textContent = `
      .fix-module { display: flex; flex-direction: column; gap: 1rem; }
      .fix-module__input-area, .fix-module__output-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .fix-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .fix-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .fix-module__textarea {
        width: 100%; min-height: 180px; padding: 0.75rem;
        border: 1px solid var(--jt-panel-border); border-radius: 0.375rem;
        background: var(--jt-panel-bg); color: inherit;
        font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem;
        line-height: 1.5; resize: vertical;
      }
      .fix-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .fix-module__textarea--output { background: var(--jt-tab-bg); }
      .fix-module__info {
        padding: 0.75rem; background: var(--jt-tab-bg); border-radius: 0.375rem;
      }
      .fix-module__info-header {
        display: flex; align-items: center; gap: 0.5rem;
        font-weight: 500; font-size: 0.875rem; margin-bottom: 0.5rem;
      }
      .fix-module__issues-list {
        display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem;
        margin: 0; padding-left: 1.25rem; font-size: 0.8125rem;
        color: var(--jt-tab-text);
      }
      .fix-module__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .fix-module__result { margin-top: 0.5rem; }
      .fix-module__result-header { margin-bottom: 1rem; }
      .fix-module__result-success, .fix-module__result-already-valid {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.75rem; background: var(--jt-privacy-bg); border-radius: 0.375rem;
        color: var(--jt-privacy-text); font-weight: 500;
      }
      .fix-module__result-error {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.75rem; background: var(--color-error-bg, #fce8ea); border-radius: 0.375rem;
        color: var(--color-error, #dc3545); font-weight: 500;
      }
      [data-theme="dark"] .fix-module__result-error { background: var(--color-error-bg, #211414); color: var(--color-error, #ff6b6b); }
      .fix-module__error-message { margin-top: 0.5rem; font-size: 0.875rem; color: var(--jt-tab-text); }
      .fix-module__method { font-weight: 400; font-size: 0.75rem; opacity: 0.7; }
    `;
    document.head.appendChild(style);
  }

  window.FixModule = { init, repair, builtInRepair };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'fix') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="fix"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
