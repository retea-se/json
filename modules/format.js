/**
 * JSON Toolbox - Format Module
 * Version: 1.0
 * 
 * Features:
 * - JSON beautify (pretty print)
 * - JSON minify
 * - Sorted keys
 * - Custom indentation
 * - Canonical format
 * - Live preview
 */

(function() {
  'use strict';

  // ============================================
  // i18n Helper
  // ============================================
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  // ============================================
  // Initialize Module
  // ============================================
  function init() {
    const panel = document.getElementById('content-format');
    if (!panel) return;

    panel.innerHTML = `
      <div class="format-module">
        <!-- Input Area -->
        <div class="format-module__input-area">
          <label class="format-module__label">
            <span class="format-module__label-text">${t('input_label', 'JSON Input')}</span>
          </label>
          <textarea 
            id="formatInput" 
            class="format-module__textarea"
            placeholder="${t('placeholder_json', 'Paste JSON here...')}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Format Presets -->
        <div class="format-module__presets">
          <span class="format-module__presets-label">${t('format_presets', 'Presets')}:</span>
          <button type="button" class="format-module__preset" data-preset="beautify">
            <i data-lucide="align-left"></i>
            ${t('format_beautify', 'Beautify')}
          </button>
          <button type="button" class="format-module__preset" data-preset="minify">
            <i data-lucide="minimize-2"></i>
            ${t('format_minify', 'Minify')}
          </button>
          <button type="button" class="format-module__preset" data-preset="sorted">
            <i data-lucide="arrow-down-a-z"></i>
            ${t('format_sorted', 'Sorted Keys')}
          </button>
          <button type="button" class="format-module__preset" data-preset="canonical">
            <i data-lucide="check-check"></i>
            ${t('format_canonical', 'Canonical')}
          </button>
        </div>

        <!-- Options -->
        <div class="format-module__options">
          <div class="format-module__option">
            <label class="format-module__option-label">
              <span>${t('format_indent', 'Indentation')}:</span>
              <select id="formatIndent" class="format-module__select">
                <option value="2">2 ${t('format_spaces', 'spaces')}</option>
                <option value="4">4 ${t('format_spaces', 'spaces')}</option>
                <option value="tab">${t('format_tab', 'Tab')}</option>
                <option value="0">${t('format_none', 'None (minified)')}</option>
              </select>
            </label>
          </div>
          <div class="format-module__option">
            <label class="format-module__checkbox-label">
              <input type="checkbox" id="formatSortKeys">
              <span>${t('format_sort_keys', 'Sort keys alphabetically')}</span>
            </label>
          </div>
          <div class="format-module__option">
            <label class="format-module__checkbox-label">
              <input type="checkbox" id="formatEscapeUnicode">
              <span>${t('format_escape_unicode', 'Escape unicode characters')}</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="format-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="formatBtn">
            <i data-lucide="sparkles"></i>
            ${t('format_apply', 'Format')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="formatClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="formatPasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
        </div>

        <!-- Output Area -->
        <div class="format-module__output-area">
          <label class="format-module__label">
            <span class="format-module__label-text">${t('output_label', 'Formatted Output')}</span>
            <span class="format-module__stats" id="formatStats"></span>
          </label>
          <textarea 
            id="formatOutput" 
            class="format-module__textarea format-module__textarea--output"
            readonly
            placeholder="${t('format_output_placeholder', 'Formatted JSON will appear here...')}"
          ></textarea>
        </div>

        <!-- Output Actions -->
        <div class="format-module__actions">
          <button type="button" class="json-toolbox__btn" id="formatCopyBtn">
            <i data-lucide="copy"></i>
            ${t('copy', 'Copy')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="formatDownloadBtn">
            <i data-lucide="download"></i>
            ${t('download', 'Download')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="formatSendToBtn">
            <i data-lucide="send"></i>
            ${t('send_to', 'Send to')}...
          </button>
        </div>
      </div>
    `;

    // Add module-specific styles
    addStyles();

    // Refresh Lucide icons
    window.JSONToolbox?.refreshIcons(panel);

    // Bind events
    bindEvents();

    // Restore from localStorage
    restoreState();
  }

  // ============================================
  // Event Binding
  // ============================================
  function bindEvents() {
    document.getElementById('formatBtn').addEventListener('click', formatJson);
    document.getElementById('formatClearBtn').addEventListener('click', clearAll);
    document.getElementById('formatPasteBtn').addEventListener('click', pasteFromClipboard);
    document.getElementById('formatCopyBtn').addEventListener('click', copyOutput);
    document.getElementById('formatDownloadBtn').addEventListener('click', downloadOutput);
    document.getElementById('formatSendToBtn').addEventListener('click', showSendToMenu);

    // Preset buttons
    document.querySelectorAll('.format-module__preset').forEach(btn => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Input change - save state
    document.getElementById('formatInput').addEventListener('input', debounce(saveState, 300));

    // Keyboard shortcuts
    document.getElementById('formatInput').addEventListener('keydown', handleKeydown);
  }

  // ============================================
  // JSON Formatting
  // ============================================
  function formatJson(options = {}) {
    const input = document.getElementById('formatInput').value.trim();
    const output = document.getElementById('formatOutput');
    const stats = document.getElementById('formatStats');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    try {
      // Parse JSON
      let data = JSON.parse(input);

      // Sort keys if requested
      const sortKeys = options.sortKeys ?? document.getElementById('formatSortKeys').checked;
      if (sortKeys) {
        data = sortObjectKeys(data);
      }

      // Get indent setting
      let indent = options.indent ?? document.getElementById('formatIndent').value;
      if (indent === 'tab') {
        indent = '\t';
      } else if (indent === '0') {
        indent = 0;
      } else {
        indent = parseInt(indent, 10);
      }

      // Escape unicode if requested
      const escapeUnicode = options.escapeUnicode ?? document.getElementById('formatEscapeUnicode').checked;

      // Stringify
      let result;
      if (indent === 0) {
        result = JSON.stringify(data);
      } else {
        result = JSON.stringify(data, null, indent);
      }

      // Escape unicode if needed
      if (escapeUnicode) {
        result = escapeUnicodeChars(result);
      }

      output.value = result;

      // Stats
      const inputSize = new Blob([input]).size;
      const outputSize = new Blob([result]).size;
      const diff = outputSize - inputSize;
      const diffStr = diff >= 0 ? `+${diff}` : diff;
      stats.textContent = `${formatBytes(outputSize)} (${diffStr} bytes)`;

      // Analytics: track successful format
      if (window.JTA) {
        const action = indent === 0 ? 'minify' : 'beautify';
        window.JTA.trackSuccess('format', action);
      }
      
      showStatus(t('success', 'Done!'), 'success');
      saveState();

    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('format', 'parse');
      }
      
      output.value = '';
      stats.textContent = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  // ============================================
  // Presets
  // ============================================
  function applyPreset(preset) {
    const input = document.getElementById('formatInput').value.trim();
    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    switch (preset) {
      case 'beautify':
        document.getElementById('formatIndent').value = '2';
        document.getElementById('formatSortKeys').checked = false;
        formatJson({ indent: 2, sortKeys: false });
        break;
      
      case 'minify':
        document.getElementById('formatIndent').value = '0';
        formatJson({ indent: 0, sortKeys: false });
        break;
      
      case 'sorted':
        document.getElementById('formatIndent').value = '2';
        document.getElementById('formatSortKeys').checked = true;
        formatJson({ indent: 2, sortKeys: true });
        break;
      
      case 'canonical':
        // Canonical: sorted keys, minified, escaped unicode
        document.getElementById('formatIndent').value = '0';
        document.getElementById('formatSortKeys').checked = true;
        document.getElementById('formatEscapeUnicode').checked = true;
        formatJson({ indent: 0, sortKeys: true, escapeUnicode: true });
        break;
    }
  }

  // ============================================
  // Sort Object Keys
  // ============================================
  function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sorted = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObjectKeys(obj[key]);
      });
      return sorted;
    }
    
    return obj;
  }

  // ============================================
  // Escape Unicode
  // ============================================
  function escapeUnicodeChars(str) {
    return str.replace(/[\u0080-\uffff]/g, (char) => {
      return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
  }

  // ============================================
  // Format Bytes
  // ============================================
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ============================================
  // Clipboard & Actions
  // ============================================
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('formatInput').value = text;
      saveState();
      showStatus(t('pasted', 'Pasted from clipboard'), 'success');
    } catch (e) {
      showStatus(t('paste_error', 'Could not paste from clipboard'), 'error');
    }
  }

  async function copyOutput() {
    const output = document.getElementById('formatOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to copy'), 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('format');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('formatOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to download'), 'error');
      return;
    }

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);

    // Analytics: track download
    if (window.JTA) {
      window.JTA.trackDownload('format', 'json');
    }
    
    showStatus(t('downloaded', 'Downloaded'), 'success');
  }

  function showSendToMenu() {
    const output = document.getElementById('formatOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to send'), 'error');
      return;
    }

    // Simple: send to Validate tab
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('validate-input', output);
      window.JSONToolbox.switchTab('validate');
      showStatus(t('sent_to_validate', 'Sent to Validate tab'), 'success');
    }
  }

  function clearAll() {
    document.getElementById('formatInput').value = '';
    document.getElementById('formatOutput').value = '';
    document.getElementById('formatStats').textContent = '';
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      formatJson();
    }
    // Ctrl+Shift+F to beautify
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      applyPreset('beautify');
    }
    // Ctrl+Shift+M to minify
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      applyPreset('minify');
    }
  }

  // ============================================
  // Local Storage
  // ============================================
  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('format-input', document.getElementById('formatInput').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const savedInput = window.JSONToolbox.loadFromStorage('format-input', '');
      if (savedInput) {
        // Ensure we have a string for textarea (loadFromStorage may parse JSON to objects)
        document.getElementById('formatInput').value = window.JSONToolbox.ensureString(savedInput);
      }
    }
  }

  // ============================================
  // Utilities
  // ============================================
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  function showStatus(message, type = 'success') {
    if (window.JSONToolbox && window.JSONToolbox.showStatus) {
      window.JSONToolbox.showStatus(message, type);
    }
  }

  // ============================================
  // Module Styles
  // ============================================
  function addStyles() {
    if (document.getElementById('format-module-styles')) return;

    const style = document.createElement('style');
    style.id = 'format-module-styles';
    style.textContent = `
      .format-module {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
      }

      .format-module__input-area,
      .format-module__output-area {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .format-module__label {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .format-module__label-text {
        font-weight: var(--weight-semibold);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .format-module__stats {
        font-size: var(--text-caption);
        color: var(--color-primary);
        margin-left: auto;
      }

      .format-module__textarea {
        width: 100%;
        min-height: 180px;
        padding: var(--space-lg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-text);
        font-family: var(--font-mono);
        font-size: var(--text-body-sm);
        line-height: var(--leading-relaxed);
        resize: vertical;
        transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      }

      .format-module__textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .format-module__textarea--output {
        background: var(--color-surface-elevated);
      }

      .format-module__presets {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }

      .format-module__presets-label {
        font-weight: var(--weight-medium);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .format-module__preset {
        display: inline-flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
        background: var(--color-background);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-secondary);
        font-size: var(--text-body-sm);
        font-weight: var(--weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .format-module__preset:hover {
        background: var(--color-surface-elevated);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .format-module__preset i {
        width: 14px;
        height: 14px;
      }

      .format-module__options {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xl);
        padding: var(--space-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }

      .format-module__option {
        display: flex;
        align-items: center;
      }

      .format-module__option-label {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .format-module__select {
        padding: var(--space-sm) var(--space-md);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-background);
        color: var(--color-text);
        font-size: var(--text-body-sm);
        transition: border-color var(--transition-fast);
      }

      .format-module__select:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .format-module__checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
        cursor: pointer;
      }

      .format-module__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md);
      }

      @media (max-width: 480px) {
        .format-module__presets {
          flex-direction: column;
          align-items: stretch;
        }

        .format-module__preset {
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // Export & Auto-init
  // ============================================
  window.FormatModule = { init, formatJson, sortObjectKeys };

  window.addEventListener('jsontoolbox:tabchange', (e) => {
    if (e.detail.tab === 'format') {
      init();
    }
  });

  if (document.querySelector('.json-toolbox__tab--active[data-tab="format"]')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

})();
