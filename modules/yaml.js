/**
 * JSON Toolbox - YAML Module
 * Version: 1.0
 * 
 * Features:
 * - YAML to JSON conversion
 * - JSON to YAML conversion
 * - Uses js-yaml library
 * - Configurable output options
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;
  let direction = 'yaml-to-json';

  function init() {
    const panel = document.getElementById('content-yaml');
    if (!panel) return;

    panel.innerHTML = `
      <div class="yaml-module">
        <!-- Direction Toggle -->
        <div class="yaml-module__direction">
          <button type="button" class="yaml-module__dir-btn yaml-module__dir-btn--active" data-dir="yaml-to-json">
            ${t('direction_yaml_to_json', 'YAML to JSON')}
          </button>
          <button type="button" class="yaml-module__dir-btn" data-dir="json-to-yaml">
            ${t('direction_json_to_yaml', 'JSON to YAML')}
          </button>
        </div>

        <!-- Input -->
        <div class="yaml-module__input-area">
          <label class="yaml-module__label">
            <span class="yaml-module__label-text" id="yamlInputLabel">${t('label_yaml_input', 'YAML Input')}</span>
          </label>
          <textarea 
            id="yamlInput" 
            class="yaml-module__textarea"
            placeholder="${t('placeholder_yaml', 'Paste YAML here...')}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Options -->
        <div class="yaml-module__options">
          <div class="yaml-module__option">
            <label class="yaml-module__option-label">
              <span>${t('yaml_indent', 'Indent')}:</span>
              <select id="yamlIndent" class="yaml-module__select">
                <option value="2">2 ${t('format_spaces', 'spaces')}</option>
                <option value="4">4 ${t('format_spaces', 'spaces')}</option>
              </select>
            </label>
          </div>
          <div class="yaml-module__option">
            <label class="yaml-module__checkbox-label">
              <input type="checkbox" id="yamlFlowLevel">
              <span>${t('yaml_flow_style', 'Flow style (compact)')}</span>
            </label>
          </div>
          <div class="yaml-module__option">
            <label class="yaml-module__checkbox-label">
              <input type="checkbox" id="yamlNoRefs" checked>
              <span>${t('yaml_no_refs', 'Avoid YAML references')}</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="yaml-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="yamlConvertBtn">
            <i data-lucide="arrow-right-left"></i>
            ${t('convert', 'Convert')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="yamlClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="yamlPasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
        </div>

        <!-- Output -->
        <div class="yaml-module__output-area">
          <label class="yaml-module__label">
            <span class="yaml-module__label-text" id="yamlOutputLabel">${t('label_json_output', 'JSON Output')}</span>
            <span class="yaml-module__stats" id="yamlStats"></span>
          </label>
          <textarea 
            id="yamlOutput" 
            class="yaml-module__textarea yaml-module__textarea--output"
            readonly
          ></textarea>
        </div>

        <!-- Output Actions -->
        <div class="yaml-module__actions">
          <button type="button" class="json-toolbox__btn" id="yamlCopyBtn">
            <i data-lucide="copy"></i>
            ${t('copy', 'Copy')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="yamlDownloadBtn">
            <i data-lucide="download"></i>
            ${t('download', 'Download')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="yamlSendToBtn">
            <i data-lucide="send"></i>
            ${t('send_to', 'Send to')}...
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
    document.querySelectorAll('.yaml-module__dir-btn').forEach(btn => {
      btn.addEventListener('click', () => setDirection(btn.dataset.dir));
    });
    document.getElementById('yamlConvertBtn').addEventListener('click', convert);
    document.getElementById('yamlClearBtn').addEventListener('click', clearAll);
    document.getElementById('yamlPasteBtn').addEventListener('click', pasteFromClipboard);
    document.getElementById('yamlCopyBtn').addEventListener('click', copyOutput);
    document.getElementById('yamlDownloadBtn').addEventListener('click', downloadOutput);
    document.getElementById('yamlSendToBtn').addEventListener('click', showSendToMenu);
    document.getElementById('yamlInput').addEventListener('input', debounce(saveState, 300));
    document.getElementById('yamlInput').addEventListener('keydown', handleKeydown);
  }

  function setDirection(dir) {
    direction = dir;
    document.querySelectorAll('.yaml-module__dir-btn').forEach(btn => {
      btn.classList.toggle('yaml-module__dir-btn--active', btn.dataset.dir === dir);
    });
    const inputLabel = document.getElementById('yamlInputLabel');
    const outputLabel = document.getElementById('yamlOutputLabel');
    const input = document.getElementById('yamlInput');

    if (dir === 'yaml-to-json') {
      inputLabel.textContent = t('label_yaml_input', 'YAML Input');
      outputLabel.textContent = t('label_json_output', 'JSON Output');
      input.placeholder = t('placeholder_yaml', 'Paste YAML here...');
    } else {
      inputLabel.textContent = t('label_json_input', 'JSON Input');
      outputLabel.textContent = t('label_yaml_output', 'YAML Output');
      input.placeholder = t('placeholder_json', 'Paste JSON here...');
    }
    document.getElementById('yamlOutput').value = '';
    document.getElementById('yamlStats').textContent = '';
  }

  function convert() {
    const input = document.getElementById('yamlInput').value.trim();
    const output = document.getElementById('yamlOutput');
    const stats = document.getElementById('yamlStats');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    const indent = parseInt(document.getElementById('yamlIndent').value, 10);
    const flowLevel = document.getElementById('yamlFlowLevel').checked ? 0 : -1;
    const noRefs = document.getElementById('yamlNoRefs').checked;

    try {
      let result;

      if (direction === 'yaml-to-json') {
        // Check if js-yaml is loaded
        if (!window.jsyaml) {
          throw new Error('js-yaml library not loaded. Please refresh the page.');
        }
        const data = window.jsyaml.load(input);
        result = JSON.stringify(data, null, 2);
        stats.textContent = 'YAML to JSON';
      } else {
        // JSON to YAML
        if (!window.jsyaml) {
          throw new Error('js-yaml library not loaded. Please refresh the page.');
        }
        const data = JSON.parse(input);
        result = window.jsyaml.dump(data, {
          indent: indent,
          flowLevel: flowLevel,
          noRefs: noRefs,
          lineWidth: -1, // No line width limit
          quotingType: '"',
          forceQuotes: false
        });
        stats.textContent = 'JSON to YAML';
      }

      output.value = result;
      // Analytics: track successful conversion
      if (window.JTA) {
        window.JTA.trackSuccess('yaml', direction);
      }
      showStatus(t('success', 'Done!'), 'success');
      saveState();

    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('yaml', 'conversion');
      }
      output.value = '';
      stats.textContent = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('yamlInput').value = text;
      saveState();
      showStatus(t('pasted', 'Pasted'), 'success');
    } catch (e) {
      showStatus(t('paste_error', 'Could not paste'), 'error');
    }
  }

  async function copyOutput() {
    const output = document.getElementById('yamlOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('yaml');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('yamlOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    const ext = direction === 'yaml-to-json' ? 'json' : 'yaml';
    const mime = direction === 'yaml-to-json' ? 'application/json' : 'text/yaml';
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    // Analytics: track download
    if (window.JTA) {
      window.JTA.trackDownload('yaml', ext);
    }
    showStatus(t('downloaded', 'Downloaded'), 'success');
  }

  function showSendToMenu() {
    const output = document.getElementById('yamlOutput').value;
    if (!output) { showStatus(t('no_output', 'No output to send'), 'error'); return; }
    const btn = document.getElementById('yamlSendToBtn');
    if (window.JSONToolboxHandoff) {
      window.JSONToolboxHandoff.showSendToDropdown(btn, 'yaml', output);
    }
  }

  function clearAll() {
    document.getElementById('yamlInput').value = '';
    document.getElementById('yamlOutput').value = '';
    document.getElementById('yamlStats').textContent = '';
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); convert(); }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('yaml-input', document.getElementById('yamlInput').value);
      window.JSONToolbox.saveToStorage('yaml-direction', direction);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const saved = window.JSONToolbox.loadFromStorage('yaml-input', '');
      const savedDir = window.JSONToolbox.loadFromStorage('yaml-direction', 'yaml-to-json');
      if (saved) document.getElementById('yamlInput').value = saved;
      if (savedDir) setDirection(savedDir);
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
    if (document.getElementById('yaml-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'yaml-module-styles';
    style.textContent = `
      .yaml-module { display: flex; flex-direction: column; gap: 1rem; }
      .yaml-module__direction { display: flex; gap: 0.25rem; padding: 0.25rem; background: var(--jt-tab-bg); border-radius: 0.5rem; width: fit-content; }
      .yaml-module__dir-btn { padding: 0.5rem 1rem; background: transparent; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 500; color: var(--jt-tab-text); transition: all 0.15s ease; }
      .yaml-module__dir-btn:hover { background: var(--jt-tab-bg-hover); }
      .yaml-module__dir-btn--active { background: var(--jt-tab-bg-active); color: var(--jt-tab-text-active); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .yaml-module__input-area, .yaml-module__output-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .yaml-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .yaml-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .yaml-module__stats { font-size: 0.75rem; color: var(--jt-tab-text-active); margin-left: auto; }
      .yaml-module__textarea { width: 100%; min-height: 180px; padding: 0.75rem; border: 1px solid var(--jt-panel-border); border-radius: 0.375rem; background: var(--jt-panel-bg); color: inherit; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem; line-height: 1.5; resize: vertical; }
      .yaml-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .yaml-module__textarea--output { background: var(--jt-tab-bg); }
      .yaml-module__options { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0.75rem; background: var(--jt-tab-bg); border-radius: 0.375rem; }
      .yaml-module__option { display: flex; align-items: center; }
      .yaml-module__option-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
      .yaml-module__select { padding: 0.25rem 0.5rem; border: 1px solid var(--jt-panel-border); border-radius: 0.25rem; background: var(--jt-panel-bg); color: inherit; font-size: 0.875rem; }
      .yaml-module__checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
      .yaml-module__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    `;
    document.head.appendChild(style);
  }

  window.YAMLModule = { init, convert };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'yaml') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="yaml"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
