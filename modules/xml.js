/**
 * JSON Toolbox - XML Module
 * Version: 1.0
 * 
 * Features:
 * - XML to JSON conversion
 * - JSON to XML conversion
 * - Configurable attribute handling
 * - Compact vs full output modes
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;
  let direction = 'xml-to-json';

  function init() {
    const panel = document.getElementById('content-xml');
    if (!panel) return;

    panel.innerHTML = `
      <div class="xml-module">
        <!-- Direction Toggle -->
        <div class="xml-module__direction">
          <button type="button" class="xml-module__dir-btn xml-module__dir-btn--active" data-dir="xml-to-json">
            ${t('direction_xml_to_json', 'XML to JSON')}
          </button>
          <button type="button" class="xml-module__dir-btn" data-dir="json-to-xml">
            ${t('direction_json_to_xml', 'JSON to XML')}
          </button>
        </div>

        <!-- Input -->
        <div class="xml-module__input-area">
          <label class="xml-module__label">
            <span class="xml-module__label-text" id="xmlInputLabel">${t('label_xml_input', 'XML Input')}</span>
          </label>
          <textarea 
            id="xmlInput" 
            class="xml-module__textarea"
            placeholder="${t('placeholder_xml', 'Paste XML here...')}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Options -->
        <div class="xml-module__options">
          <div class="xml-module__option">
            <label class="xml-module__checkbox-label">
              <input type="checkbox" id="xmlCompact">
              <span>${t('xml_compact', 'Compact output')}</span>
            </label>
          </div>
          <div class="xml-module__option">
            <label class="xml-module__checkbox-label">
              <input type="checkbox" id="xmlAttributes" checked>
              <span>${t('xml_preserve_attributes', 'Preserve attributes')}</span>
            </label>
          </div>
          <div class="xml-module__option">
            <label class="xml-module__checkbox-label">
              <input type="checkbox" id="xmlTrim" checked>
              <span>${t('xml_trim', 'Trim whitespace')}</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="xml-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="xmlConvertBtn">
            <i data-lucide="arrow-right-left"></i>
            ${t('convert', 'Convert')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="xmlClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="xmlPasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
        </div>

        <!-- Output -->
        <div class="xml-module__output-area">
          <label class="xml-module__label">
            <span class="xml-module__label-text" id="xmlOutputLabel">${t('label_json_output', 'JSON Output')}</span>
            <span class="xml-module__stats" id="xmlStats"></span>
          </label>
          <textarea 
            id="xmlOutput" 
            class="xml-module__textarea xml-module__textarea--output"
            readonly
          ></textarea>
        </div>

        <!-- Output Actions -->
        <div class="xml-module__actions">
          <button type="button" class="json-toolbox__btn" id="xmlCopyBtn">
            <i data-lucide="copy"></i>
            ${t('copy', 'Copy')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="xmlDownloadBtn">
            <i data-lucide="download"></i>
            ${t('download', 'Download')}
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
    document.querySelectorAll('.xml-module__dir-btn').forEach(btn => {
      btn.addEventListener('click', () => setDirection(btn.dataset.dir));
    });
    document.getElementById('xmlConvertBtn').addEventListener('click', convert);
    document.getElementById('xmlClearBtn').addEventListener('click', clearAll);
    document.getElementById('xmlPasteBtn').addEventListener('click', pasteFromClipboard);
    document.getElementById('xmlCopyBtn').addEventListener('click', copyOutput);
    document.getElementById('xmlDownloadBtn').addEventListener('click', downloadOutput);
    document.getElementById('xmlInput').addEventListener('input', debounce(saveState, 300));
    document.getElementById('xmlInput').addEventListener('keydown', handleKeydown);
  }

  function setDirection(dir) {
    direction = dir;
    document.querySelectorAll('.xml-module__dir-btn').forEach(btn => {
      btn.classList.toggle('xml-module__dir-btn--active', btn.dataset.dir === dir);
    });
    const inputLabel = document.getElementById('xmlInputLabel');
    const outputLabel = document.getElementById('xmlOutputLabel');
    const input = document.getElementById('xmlInput');

    if (dir === 'xml-to-json') {
      inputLabel.textContent = t('label_xml_input', 'XML Input');
      outputLabel.textContent = t('label_json_output', 'JSON Output');
      input.placeholder = t('placeholder_xml', 'Paste XML here...');
    } else {
      inputLabel.textContent = t('label_json_input', 'JSON Input');
      outputLabel.textContent = t('label_xml_output', 'XML Output');
      input.placeholder = t('placeholder_json', 'Paste JSON here...');
    }
    document.getElementById('xmlOutput').value = '';
    document.getElementById('xmlStats').textContent = '';
  }

  function convert() {
    const input = document.getElementById('xmlInput').value.trim();
    const output = document.getElementById('xmlOutput');
    const stats = document.getElementById('xmlStats');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    const compact = document.getElementById('xmlCompact').checked;
    const preserveAttrs = document.getElementById('xmlAttributes').checked;
    const trim = document.getElementById('xmlTrim').checked;

    try {
      let result;
      if (direction === 'xml-to-json') {
        const json = xmlToJson(input, { compact, preserveAttrs, trim });
        result = compact ? JSON.stringify(json) : JSON.stringify(json, null, 2);
        stats.textContent = 'XML to JSON';
      } else {
        const data = JSON.parse(input);
        result = jsonToXml(data, { compact, preserveAttrs });
        stats.textContent = 'JSON to XML';
      }
      output.value = result;
      // Analytics: track successful conversion
      if (window.JTA) {
        window.JTA.trackSuccess('xml', direction);
      }
      showStatus(t('success', 'Done!'), 'success');
      saveState();
    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('xml', 'conversion');
      }
      output.value = '';
      stats.textContent = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  // Simple XML to JSON parser
  function xmlToJson(xml, options = {}) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent.substring(0, 100));
    }

    return nodeToJson(doc.documentElement, options);
  }

  function nodeToJson(node, options = {}) {
    const result = {};
    
    // Handle attributes
    if (options.preserveAttrs && node.attributes && node.attributes.length > 0) {
      result['@attributes'] = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        result['@attributes'][attr.name] = attr.value;
      }
    }

    // Handle child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      if (child.nodeType === Node.TEXT_NODE) {
        const text = options.trim ? child.textContent.trim() : child.textContent;
        if (text) {
          if (Object.keys(result).length === 0 || (Object.keys(result).length === 1 && result['@attributes'])) {
            result['#text'] = text;
          }
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childJson = nodeToJson(child, options);
        const name = child.nodeName;
        
        if (result[name]) {
          if (!Array.isArray(result[name])) {
            result[name] = [result[name]];
          }
          result[name].push(childJson);
        } else {
          result[name] = childJson;
        }
      }
    }

    // Simplify text-only nodes
    if (Object.keys(result).length === 1 && result['#text']) {
      return result['#text'];
    }

    return result;
  }

  // Simple JSON to XML converter
  function jsonToXml(data, options = {}, indent = 0) {
    const spaces = options.compact ? '' : '  '.repeat(indent);
    const nl = options.compact ? '' : '\n';
    
    if (typeof data !== 'object' || data === null) {
      return escapeXml(String(data));
    }

    if (Array.isArray(data)) {
      return data.map(item => jsonToXml(item, options, indent)).join(nl);
    }

    let xml = '';
    for (const [key, value] of Object.entries(data)) {
      if (key === '@attributes') continue;
      if (key === '#text') {
        xml += escapeXml(String(value));
        continue;
      }

      const attrs = data['@attributes'] ? Object.entries(data['@attributes'])
        .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`)
        .join('') : '';

      if (Array.isArray(value)) {
        value.forEach(item => {
          const content = jsonToXml(item, options, indent + 1);
          if (typeof item === 'object' && item !== null) {
            xml += `${spaces}<${key}${attrs}>${nl}${content}${nl}${spaces}</${key}>${nl}`;
          } else {
            xml += `${spaces}<${key}${attrs}>${content}</${key}>${nl}`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        const content = jsonToXml(value, options, indent + 1);
        xml += `${spaces}<${key}${attrs}>${nl}${content}${spaces}</${key}>${nl}`;
      } else {
        xml += `${spaces}<${key}${attrs}>${escapeXml(String(value))}</${key}>${nl}`;
      }
    }
    return xml;
  }

  function escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('xmlInput').value = text;
      saveState();
      showStatus(t('pasted', 'Pasted'), 'success');
    } catch (e) {
      showStatus(t('paste_error', 'Could not paste'), 'error');
    }
  }

  async function copyOutput() {
    const output = document.getElementById('xmlOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('xml');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('xmlOutput').value;
    if (!output) { showStatus(t('no_output', 'No output'), 'error'); return; }
    const ext = direction === 'xml-to-json' ? 'json' : 'xml';
    const mime = direction === 'xml-to-json' ? 'application/json' : 'application/xml';
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    // Analytics: track download
    if (window.JTA) {
      window.JTA.trackDownload('xml', ext);
    }
    showStatus(t('downloaded', 'Downloaded'), 'success');
  }

  function clearAll() {
    document.getElementById('xmlInput').value = '';
    document.getElementById('xmlOutput').value = '';
    document.getElementById('xmlStats').textContent = '';
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); convert(); }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('xml-input', document.getElementById('xmlInput').value);
      window.JSONToolbox.saveToStorage('xml-direction', direction);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const saved = window.JSONToolbox.loadFromStorage('xml-input', '');
      const savedDir = window.JSONToolbox.loadFromStorage('xml-direction', 'xml-to-json');
      if (saved) document.getElementById('xmlInput').value = saved;
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
    if (document.getElementById('xml-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'xml-module-styles';
    style.textContent = `
      .xml-module { display: flex; flex-direction: column; gap: 1rem; }
      .xml-module__direction { display: flex; gap: 0.25rem; padding: 0.25rem; background: var(--jt-tab-bg); border-radius: 0.5rem; width: fit-content; }
      .xml-module__dir-btn { padding: 0.5rem 1rem; background: transparent; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 500; color: var(--jt-tab-text); transition: all 0.15s ease; }
      .xml-module__dir-btn:hover { background: var(--jt-tab-bg-hover); }
      .xml-module__dir-btn--active { background: var(--jt-tab-bg-active); color: var(--jt-tab-text-active); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .xml-module__input-area, .xml-module__output-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .xml-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .xml-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .xml-module__stats { font-size: 0.75rem; color: var(--jt-tab-text-active); margin-left: auto; }
      .xml-module__textarea { width: 100%; min-height: 180px; padding: 0.75rem; border: 1px solid var(--jt-panel-border); border-radius: 0.375rem; background: var(--jt-panel-bg); color: inherit; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem; line-height: 1.5; resize: vertical; }
      .xml-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .xml-module__textarea--output { background: var(--jt-tab-bg); }
      .xml-module__options { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0.75rem; background: var(--jt-tab-bg); border-radius: 0.375rem; }
      .xml-module__option { display: flex; align-items: center; }
      .xml-module__checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
      .xml-module__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    `;
    document.head.appendChild(style);
  }

  window.XMLModule = { init, convert, xmlToJson, jsonToXml };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'xml') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="xml"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
