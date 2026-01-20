/**
 * JSON Toolbox - CSS Module
 * Version: 1.0
 * 
 * Features:
 * - CSS to JSON conversion
 * - Support for multiple selectors
 * - Handles @media queries
 * - Handles @keyframes
 * - Minified or beautified output
 * - Drag & drop file support
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
    const panel = document.getElementById('content-css');
    if (!panel) return;

    panel.innerHTML = `
      <div class="css-module">
        <!-- Input Area -->
        <div class="css-module__input-area">
          <label class="css-module__label">
            <span class="css-module__label-text">${t('label_css_input', 'CSS Input')}</span>
            <span class="css-module__hint">${t('css_hint', 'Paste CSS code or drag a .css file')}</span>
          </label>
          <div class="css-module__dropzone" id="cssDropzone">
            <textarea 
              id="cssInput" 
              class="css-module__textarea"
              placeholder="${t('placeholder_css', 'Paste CSS here...')}"
              spellcheck="false"
            ></textarea>
            <div class="css-module__drop-overlay" id="cssDropOverlay">
              <i data-lucide="file-down"></i>
              <span>${t('drop_file', 'Drop file here')}</span>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="css-module__options">
          <div class="css-module__option">
            <label class="css-module__checkbox-label">
              <input type="checkbox" id="cssMinify">
              <span>${t('css_minify_output', 'Minify output')}</span>
            </label>
          </div>
          <div class="css-module__option">
            <label class="css-module__checkbox-label">
              <input type="checkbox" id="cssIncludeComments">
              <span>${t('css_include_comments', 'Include comments')}</span>
            </label>
          </div>
          <div class="css-module__option">
            <label class="css-module__checkbox-label">
              <input type="checkbox" id="cssFlattenMedia">
              <span>${t('css_flatten_media', 'Flatten @media queries')}</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="css-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="cssConvertBtn">
            <i data-lucide="arrow-right"></i>
            ${t('convert', 'Convert')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="cssClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="cssPasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
        </div>

        <!-- Output Area -->
        <div class="css-module__output-area">
          <label class="css-module__label">
            <span class="css-module__label-text">${t('label_json_output', 'JSON Output')}</span>
            <span class="css-module__stats" id="cssOutputStats"></span>
          </label>
          <textarea 
            id="cssOutput" 
            class="css-module__textarea css-module__textarea--output"
            readonly
            placeholder="${t('css_output_placeholder', 'JSON output will appear here...')}"
          ></textarea>
        </div>

        <!-- Output Actions -->
        <div class="css-module__actions">
          <button type="button" class="json-toolbox__btn" id="cssCopyBtn">
            <i data-lucide="copy"></i>
            ${t('copy', 'Copy')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="cssDownloadBtn">
            <i data-lucide="download"></i>
            ${t('download', 'Download')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="cssSendToBtn">
            <i data-lucide="send"></i>
            ${t('send_to', 'Send to')} ${t('tab_format', 'Format')}
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
    document.getElementById('cssConvertBtn').addEventListener('click', convert);
    document.getElementById('cssClearBtn').addEventListener('click', clearAll);
    document.getElementById('cssPasteBtn').addEventListener('click', pasteFromClipboard);
    document.getElementById('cssCopyBtn').addEventListener('click', copyOutput);
    document.getElementById('cssDownloadBtn').addEventListener('click', downloadOutput);
    document.getElementById('cssSendToBtn').addEventListener('click', sendToFormat);

    // Input change - save state
    document.getElementById('cssInput').addEventListener('input', debounce(saveState, 300));

    // Drag & drop
    setupDragDrop();

    // Keyboard shortcuts
    document.getElementById('cssInput').addEventListener('keydown', handleKeydown);
  }

  // ============================================
  // CSS to JSON Conversion
  // ============================================
  function cssToJson(css, options = {}) {
    const result = {
      rules: {},
      mediaQueries: {},
      keyframes: {},
      fontFaces: [],
      imports: []
    };

    // Remove comments unless requested
    if (!options.includeComments) {
      css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Extract @imports
    const importRegex = /@import\s+(?:url\()?['"]?([^'")\s;]+)['"]?\)?[^;]*;/g;
    let importMatch;
    while ((importMatch = importRegex.exec(css)) !== null) {
      result.imports.push(importMatch[1]);
    }
    css = css.replace(importRegex, '');

    // Extract @font-face
    const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
    let fontFaceMatch;
    while ((fontFaceMatch = fontFaceRegex.exec(css)) !== null) {
      result.fontFaces.push(parseDeclarations(fontFaceMatch[1]));
    }
    css = css.replace(fontFaceRegex, '');

    // Extract @keyframes
    const keyframesRegex = /@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\}\s*\}/g;
    let keyframesMatch;
    while ((keyframesMatch = keyframesRegex.exec(css)) !== null) {
      const name = keyframesMatch[1];
      const body = keyframesMatch[2];
      result.keyframes[name] = parseKeyframeBody(body);
    }
    css = css.replace(keyframesRegex, '');

    // Extract @media queries
    const mediaRegex = /@media\s*([^{]+)\{([\s\S]*?)\}\s*\}/g;
    let mediaMatch;
    while ((mediaMatch = mediaRegex.exec(css)) !== null) {
      const query = mediaMatch[1].trim();
      const body = mediaMatch[2];
      
      if (options.flattenMedia) {
        // Flatten: merge media rules into main rules with media prefix
        const mediaRules = parseRules(body);
        Object.keys(mediaRules).forEach(selector => {
          const key = `@media ${query} { ${selector} }`;
          result.rules[key] = mediaRules[selector];
        });
      } else {
        result.mediaQueries[query] = parseRules(body);
      }
    }
    css = css.replace(mediaRegex, '');

    // Parse remaining rules
    result.rules = { ...result.rules, ...parseRules(css) };

    // Clean up empty sections
    if (Object.keys(result.mediaQueries).length === 0) delete result.mediaQueries;
    if (Object.keys(result.keyframes).length === 0) delete result.keyframes;
    if (result.fontFaces.length === 0) delete result.fontFaces;
    if (result.imports.length === 0) delete result.imports;

    // If only rules exist, simplify output
    if (Object.keys(result).length === 1 && result.rules) {
      return result.rules;
    }

    return result;
  }

  function parseRules(css) {
    const rules = {};
    const regex = /([^{]+)\{([^}]+)\}/g;
    let match;
    
    while ((match = regex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = parseDeclarations(match[2]);
      
      if (selector && Object.keys(declarations).length > 0) {
        // Handle multiple selectors separated by comma
        if (selector.includes(',')) {
          const selectors = selector.split(',').map(s => s.trim());
          selectors.forEach(s => {
            rules[s] = { ...declarations };
          });
        } else {
          rules[selector] = declarations;
        }
      }
    }
    
    return rules;
  }

  function parseDeclarations(body) {
    const props = {};
    const lines = body.split(';');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key && value) {
          props[key] = value;
        }
      }
    });
    
    return props;
  }

  function parseKeyframeBody(body) {
    const frames = {};
    const regex = /([\d%,\s]+|from|to)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = regex.exec(body)) !== null) {
      const position = match[1].trim();
      frames[position] = parseDeclarations(match[2]);
    }
    
    return frames;
  }

  // ============================================
  // Main Convert Function
  // ============================================
  function convert() {
    const input = document.getElementById('cssInput').value.trim();
    const output = document.getElementById('cssOutput');
    const stats = document.getElementById('cssOutputStats');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    try {
      const minify = document.getElementById('cssMinify').checked;
      const includeComments = document.getElementById('cssIncludeComments').checked;
      const flattenMedia = document.getElementById('cssFlattenMedia').checked;

      const json = cssToJson(input, { includeComments, flattenMedia });
      const result = minify 
        ? JSON.stringify(json) 
        : JSON.stringify(json, null, 2);

      output.value = result;
      
      // Count rules
      const ruleCount = typeof json === 'object' 
        ? Object.keys(json.rules || json).length 
        : 0;
      stats.textContent = `${ruleCount} ${t('css_rules', 'rules')} to JSON`;

      showStatus(t('success', 'Done!'), 'success');
      saveState();
      if (window.JTA) window.JTA.trackSuccess('css', 'convert');

    } catch (e) {
      output.value = '';
      stats.textContent = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
      if (window.JTA) window.JTA.trackError('css', 'convert', e.message);
    }
  }

  // ============================================
  // Drag & Drop
  // ============================================
  function setupDragDrop() {
    const dropzone = document.getElementById('cssDropzone');
    const overlay = document.getElementById('cssDropOverlay');
    const input = document.getElementById('cssInput');

    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('css-module__drop-overlay--active');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.remove('css-module__drop-overlay--active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        readFile(files[0]);
      }
    });
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('cssInput').value = e.target.result;
      saveState();
    };
    reader.onerror = () => {
      showStatus(t('css_file_error', 'Could not read file'), 'error');
    };
    reader.readAsText(file);
  }

  // ============================================
  // Clipboard & Actions
  // ============================================
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('cssInput').value = text;
      saveState();
      showStatus(t('css_pasted', 'Pasted from clipboard'), 'success');
    } catch (e) {
      showStatus(t('paste_error', 'Could not paste from clipboard'), 'error');
    }
  }

  async function copyOutput() {
    const output = document.getElementById('cssOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to copy'), 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      showStatus(t('copied', 'Copied!'), 'success');
      if (window.JTA) window.JTA.trackCopy('css');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('cssOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to download'), 'error');
      return;
    }

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'css-converted.json';
    a.click();
    URL.revokeObjectURL(url);

    showStatus(t('css_downloaded', 'Downloaded'), 'success');
    if (window.JTA) window.JTA.trackDownload('css', 'css-converted.json');
  }

  function sendToFormat() {
    const output = document.getElementById('cssOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to send'), 'error');
      return;
    }

    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('format-input', output);
      window.JSONToolbox.switchTab('format');
      showStatus(t('css_sent_to_format', 'Sent to Format tab'), 'success');
    }
  }

  function clearAll() {
    document.getElementById('cssInput').value = '';
    document.getElementById('cssOutput').value = '';
    document.getElementById('cssOutputStats').textContent = '';
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      convert();
    }
  }

  // ============================================
  // Local Storage
  // ============================================
  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('css-input', document.getElementById('cssInput').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const savedInput = window.JSONToolbox.loadFromStorage('css-input', '');
      if (savedInput) {
        document.getElementById('cssInput').value = savedInput;
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
    if (document.getElementById('css-module-styles')) return;

    const style = document.createElement('style');
    style.id = 'css-module-styles';
    style.textContent = `
      .css-module {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
      }

      .css-module__input-area,
      .css-module__output-area {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .css-module__label {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .css-module__label-text {
        font-weight: var(--weight-semibold);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .css-module__hint {
        font-size: var(--text-caption);
        color: var(--color-text-tertiary);
      }

      .css-module__stats {
        font-size: var(--text-caption);
        color: var(--color-primary);
        margin-left: auto;
      }

      .css-module__dropzone {
        position: relative;
      }

      .css-module__textarea {
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

      .css-module__textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .css-module__textarea--output {
        background: var(--color-surface-elevated);
      }

      .css-module__drop-overlay {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-md);
        background: rgba(37, 99, 235, 0.08);
        border: 2px dashed var(--color-primary);
        border-radius: var(--radius-md);
        color: var(--color-primary);
        font-weight: var(--weight-medium);
        pointer-events: none;
      }

      .css-module__drop-overlay--active {
        display: flex;
      }

      .css-module__options {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xl);
        padding: var(--space-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }

      .css-module__option {
        display: flex;
        align-items: center;
      }

      .css-module__checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
        cursor: pointer;
      }

      .css-module__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md);
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // Export & Auto-init
  // ============================================
  window.CSSModule = { init, convert, cssToJson };

  window.addEventListener('jsontoolbox:tabchange', (e) => {
    if (e.detail.tab === 'css') {
      init();
    }
  });

  if (document.querySelector('.json-toolbox__tab--active[data-tab="css"]')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

})();
