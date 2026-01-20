/**
 * JSON Toolbox - Diff Module
 * Version: 1.0
 * 
 * Features:
 * - Visual JSON diff comparison
 * - Side-by-side or unified view
 * - Highlight additions, deletions, changes
 * - Deep object comparison
 */

(function() {
  'use strict';

  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  function init() {
    const panel = document.getElementById('content-diff');
    if (!panel) return;

    panel.innerHTML = `
      <div class="diff-module">
        <div class="diff-module__inputs">
          <!-- Left Input -->
          <div class="diff-module__input-area">
            <label class="diff-module__label">
              <span class="diff-module__label-text">${t('diff_left_label', 'JSON A (Left)')}</span>
            </label>
            <textarea 
              id="diffLeft" 
              class="diff-module__textarea"
              placeholder="${t('diff_placeholder_left', 'Paste first JSON here...')}"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Right Input -->
          <div class="diff-module__input-area">
            <label class="diff-module__label">
              <span class="diff-module__label-text">${t('diff_right_label', 'JSON B (Right)')}</span>
            </label>
            <textarea 
              id="diffRight" 
              class="diff-module__textarea"
              placeholder="${t('diff_placeholder_right', 'Paste second JSON here...')}"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- Options -->
        <div class="diff-module__options">
          <div class="diff-module__option">
            <label class="diff-module__checkbox-label">
              <input type="checkbox" id="diffIgnoreOrder">
              <span>${t('diff_ignore_order', 'Ignore array order')}</span>
            </label>
          </div>
          <div class="diff-module__option">
            <label class="diff-module__checkbox-label">
              <input type="checkbox" id="diffIgnoreWhitespace" checked>
              <span>${t('diff_ignore_whitespace', 'Ignore whitespace')}</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="diff-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="diffCompareBtn">
            <i data-lucide="git-compare-arrows"></i>
            ${t('diff_compare', 'Compare')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="diffSwapBtn">
            <i data-lucide="arrow-left-right"></i>
            ${t('diff_swap', 'Swap')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="diffClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
        </div>

        <!-- Result -->
        <div class="diff-module__result hidden" id="diffResult">
          <div class="diff-module__result-header" id="diffResultHeader"></div>
          <div class="diff-module__result-content" id="diffResultContent"></div>
        </div>
      </div>
    `;

    addStyles();
    window.JSONToolbox?.refreshIcons(panel);
    bindEvents();
    restoreState();
  }

  function bindEvents() {
    document.getElementById('diffCompareBtn').addEventListener('click', compare);
    document.getElementById('diffSwapBtn').addEventListener('click', swap);
    document.getElementById('diffClearBtn').addEventListener('click', clearAll);
    document.getElementById('diffLeft').addEventListener('input', debounce(saveState, 300));
    document.getElementById('diffRight').addEventListener('input', debounce(saveState, 300));
    document.getElementById('diffLeft').addEventListener('keydown', handleKeydown);
    document.getElementById('diffRight').addEventListener('keydown', handleKeydown);
  }

  function compare() {
    const leftInput = document.getElementById('diffLeft').value.trim();
    const rightInput = document.getElementById('diffRight').value.trim();
    const resultDiv = document.getElementById('diffResult');
    const resultHeader = document.getElementById('diffResultHeader');
    const resultContent = document.getElementById('diffResultContent');

    if (!leftInput || !rightInput) {
      showStatus(t('diff_need_both', 'Please provide both JSON inputs.'), 'error');
      return;
    }

    try {
      const left = JSON.parse(leftInput);
      const right = JSON.parse(rightInput);

      const ignoreOrder = document.getElementById('diffIgnoreOrder').checked;
      const diff = deepDiff(left, right, '', ignoreOrder);

      resultDiv.classList.remove('hidden');

      if (diff.length === 0) {
        resultHeader.innerHTML = `
          <div class="diff-module__identical">
            <i data-lucide="check-circle"></i>
            <span>${t('diff_identical', 'JSON objects are identical')}</span>
          </div>
        `;
        resultContent.innerHTML = '';
      } else {
        resultHeader.innerHTML = `
          <div class="diff-module__different">
            <i data-lucide="alert-circle"></i>
            <span>${diff.length} ${t('diff_differences', 'difference(s) found')}</span>
          </div>
        `;
        resultContent.innerHTML = renderDiff(diff);
      }

      // Analytics: track successful diff
      if (window.JTA) {
        window.JTA.trackSuccess('diff', 'compare', diff.length);
      }
      showStatus(t('diff_complete', 'Comparison complete'), 'success');
      saveState();

    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('diff', 'compare');
      }
      resultDiv.classList.add('hidden');
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  function deepDiff(left, right, path = '', ignoreOrder = false) {
    const diffs = [];

    // Type mismatch
    const leftType = Array.isArray(left) ? 'array' : typeof left;
    const rightType = Array.isArray(right) ? 'array' : typeof right;

    if (leftType !== rightType) {
      diffs.push({
        type: 'type',
        path: path || '(root)',
        left: { type: leftType, value: left },
        right: { type: rightType, value: right }
      });
      return diffs;
    }

    // Primitives
    if (leftType !== 'object' && leftType !== 'array') {
      if (left !== right) {
        diffs.push({
          type: 'value',
          path: path || '(root)',
          left: left,
          right: right
        });
      }
      return diffs;
    }

    // Arrays
    if (leftType === 'array') {
      if (ignoreOrder) {
        // Compare as sets (simplified)
        const leftSet = new Set(left.map(JSON.stringify));
        const rightSet = new Set(right.map(JSON.stringify));
        
        left.forEach((item, i) => {
          const str = JSON.stringify(item);
          if (!rightSet.has(str)) {
            diffs.push({ type: 'removed', path: `${path}[${i}]`, value: item });
          }
        });
        
        right.forEach((item, i) => {
          const str = JSON.stringify(item);
          if (!leftSet.has(str)) {
            diffs.push({ type: 'added', path: `${path}[${i}]`, value: item });
          }
        });
      } else {
        const maxLen = Math.max(left.length, right.length);
        for (let i = 0; i < maxLen; i++) {
          if (i >= left.length) {
            diffs.push({ type: 'added', path: `${path}[${i}]`, value: right[i] });
          } else if (i >= right.length) {
            diffs.push({ type: 'removed', path: `${path}[${i}]`, value: left[i] });
          } else {
            diffs.push(...deepDiff(left[i], right[i], `${path}[${i}]`, ignoreOrder));
          }
        }
      }
      return diffs;
    }

    // Objects
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in left)) {
        diffs.push({ type: 'added', path: newPath, value: right[key] });
      } else if (!(key in right)) {
        diffs.push({ type: 'removed', path: newPath, value: left[key] });
      } else {
        diffs.push(...deepDiff(left[key], right[key], newPath, ignoreOrder));
      }
    }

    return diffs;
  }

  function renderDiff(diffs) {
    return `
      <table class="diff-module__table">
        <thead>
          <tr>
            <th>${t('diff_path', 'Path')}</th>
            <th>${t('diff_change', 'Change')}</th>
            <th>${t('diff_left', 'Left')}</th>
            <th>${t('diff_right', 'Right')}</th>
          </tr>
        </thead>
        <tbody>
          ${diffs.map(d => {
            let changeType = '';
            let leftVal = '';
            let rightVal = '';
            
            switch (d.type) {
              case 'added':
                changeType = `<span class="diff-module__badge diff-module__badge--added">${t('diff_added', 'Added')}</span>`;
                rightVal = formatValue(d.value);
                break;
              case 'removed':
                changeType = `<span class="diff-module__badge diff-module__badge--removed">${t('diff_removed', 'Removed')}</span>`;
                leftVal = formatValue(d.value);
                break;
              case 'value':
                changeType = `<span class="diff-module__badge diff-module__badge--changed">${t('diff_changed', 'Changed')}</span>`;
                leftVal = formatValue(d.left);
                rightVal = formatValue(d.right);
                break;
              case 'type':
                changeType = `<span class="diff-module__badge diff-module__badge--type">${t('diff_type_change', 'Type')}</span>`;
                leftVal = `${d.left.type}: ${formatValue(d.left.value)}`;
                rightVal = `${d.right.type}: ${formatValue(d.right.value)}`;
                break;
            }
            
            return `
              <tr>
                <td class="diff-module__path">${escapeHtml(d.path)}</td>
                <td>${changeType}</td>
                <td class="diff-module__value">${leftVal}</td>
                <td class="diff-module__value">${rightVal}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  function formatValue(val) {
    if (val === undefined) return '';
    if (val === null) return '<span class="diff-module__null">null</span>';
    if (typeof val === 'string') return `"${escapeHtml(val)}"`;
    if (typeof val === 'object') {
      const str = JSON.stringify(val);
      return str.length > 50 ? escapeHtml(str.substring(0, 47)) + '...' : escapeHtml(str);
    }
    return String(val);
  }

  function swap() {
    const left = document.getElementById('diffLeft');
    const right = document.getElementById('diffRight');
    const temp = left.value;
    left.value = right.value;
    right.value = temp;
    saveState();
    showStatus(t('diff_swapped', 'Swapped'), 'success');
  }

  function clearAll() {
    document.getElementById('diffLeft').value = '';
    document.getElementById('diffRight').value = '';
    document.getElementById('diffResult').classList.add('hidden');
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  function handleKeydown(e) {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); compare(); }
  }

  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('diff-left', document.getElementById('diffLeft').value);
      window.JSONToolbox.saveToStorage('diff-right', document.getElementById('diffRight').value);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const left = window.JSONToolbox.loadFromStorage('diff-left', '');
      const right = window.JSONToolbox.loadFromStorage('diff-right', '');
      if (left) document.getElementById('diffLeft').value = window.JSONToolbox.ensureString(left);
      if (right) document.getElementById('diffRight').value = window.JSONToolbox.ensureString(right);
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
    if (document.getElementById('diff-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'diff-module-styles';
    style.textContent = `
      .diff-module { display: flex; flex-direction: column; gap: 1rem; }
      .diff-module__inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      @media (max-width: 768px) { .diff-module__inputs { grid-template-columns: 1fr; } }
      .diff-module__input-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .diff-module__label { display: flex; align-items: center; gap: 0.5rem; }
      .diff-module__label-text { font-weight: 600; color: var(--jt-tab-text); }
      .diff-module__textarea { width: 100%; min-height: 150px; padding: 0.75rem; border: 1px solid var(--jt-panel-border); border-radius: 0.375rem; background: var(--jt-panel-bg); color: inherit; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.875rem; line-height: 1.5; resize: vertical; }
      .diff-module__textarea:focus { outline: 2px solid var(--jt-tab-text-active); outline-offset: -1px; }
      .diff-module__options { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0.75rem; background: var(--jt-tab-bg); border-radius: 0.375rem; }
      .diff-module__checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
      .diff-module__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .diff-module__result { margin-top: 0.5rem; }
      .diff-module__result-header { margin-bottom: 1rem; }
      .diff-module__identical { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--jt-privacy-bg); border-radius: 0.375rem; color: var(--jt-privacy-text); font-weight: 500; }
      .diff-module__different { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #fff3e0; border-radius: 0.375rem; color: #e65100; font-weight: 500; }
      [data-theme="dark"] .diff-module__different { background: #e65100; color: #fff3e0; }
      .diff-module__table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
      .diff-module__table th, .diff-module__table td { padding: 0.5rem; border: 1px solid var(--jt-panel-border); text-align: left; }
      .diff-module__table th { background: var(--jt-tab-bg); font-weight: 600; }
      .diff-module__path { font-family: monospace; word-break: break-all; }
      .diff-module__value { font-family: monospace; font-size: 0.75rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
      .diff-module__badge { display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; }
      .diff-module__badge--added { background: #c8e6c9; color: #2e7d32; }
      .diff-module__badge--removed { background: #ffcdd2; color: #c62828; }
      .diff-module__badge--changed { background: #fff9c4; color: #f57f17; }
      .diff-module__badge--type { background: #e1bee7; color: #7b1fa2; }
      [data-theme="dark"] .diff-module__badge--added { background: #2e7d32; color: #c8e6c9; }
      [data-theme="dark"] .diff-module__badge--removed { background: #c62828; color: #ffcdd2; }
      [data-theme="dark"] .diff-module__badge--changed { background: #f57f17; color: #fff9c4; }
      [data-theme="dark"] .diff-module__badge--type { background: #7b1fa2; color: #e1bee7; }
      .diff-module__null { color: #9e9e9e; font-style: italic; }
    `;
    document.head.appendChild(style);
  }

  window.DiffModule = { init, compare, deepDiff };
  window.addEventListener('jsontoolbox:tabchange', (e) => { if (e.detail.tab === 'diff') init(); });
  if (document.querySelector('.json-toolbox__tab--active[data-tab="diff"]')) {
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  }
})();
