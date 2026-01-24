/**
 * JSON Toolbox - CSV Module
 * Version: 1.0
 * 
 * Features:
 * - CSV to JSON conversion (with PapaParse)
 * - JSON to CSV conversion
 * - Column filter (select/deselect columns)
 * - Transpose (rows ↔ columns)
 * - Live preview
 * - Auto-detect delimiter (tab, comma, semicolon)
 * - Drag & drop file support
 * - Clipboard paste support
 */

(function() {
  'use strict';

  // ============================================
  // Module State
  // ============================================
  let currentData = null;
  let selectedColumns = [];
  let direction = 'csv-to-json'; // or 'json-to-csv'
  let isTransposed = false;

  // ============================================
  // i18n Helper
  // ============================================
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  // ============================================
  // Initialize Module
  // ============================================
  function init() {
    const panel = document.getElementById('content-csv');
    if (!panel) return;

    panel.innerHTML = `
      <div class="csv-module">
        <!-- Direction Toggle -->
        <div class="csv-module__direction">
          <button type="button" class="csv-module__dir-btn csv-module__dir-btn--active" data-dir="csv-to-json">
            ${t('direction_csv_to_json', 'CSV to JSON')}
          </button>
          <button type="button" class="csv-module__dir-btn" data-dir="json-to-csv">
            ${t('direction_json_to_csv', 'JSON to CSV')}
          </button>
        </div>

        <!-- Input Area -->
        <div class="csv-module__input-area">
          <label class="csv-module__label">
            <span class="csv-module__label-text" id="inputLabel">${t('label_csv_input', 'CSV Input')}</span>
            <span class="csv-module__hint" id="inputHint">${t('csv_hint', 'Paste from Excel, drag a file, or type directly')}</span>
          </label>
          <div class="csv-module__dropzone" id="csvDropzone">
            <textarea 
              id="csvInput" 
              class="csv-module__textarea"
              placeholder="${t('placeholder_csv', 'Paste CSV data here...')}"
              spellcheck="false"
            ></textarea>
            <div class="csv-module__drop-overlay" id="dropOverlay">
              <i data-lucide="file-down"></i>
              <span>${t('drop_file', 'Drop file here')}</span>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="csv-module__options">
          <div class="csv-module__option">
            <label class="csv-module__option-label">
              <span>${t('csv_delimiter', 'Delimiter')}:</span>
              <select id="csvDelimiter" class="csv-module__select">
                <option value="auto">${t('csv_auto_detect', 'Auto-detect')}</option>
                <option value=",">${t('csv_comma', 'Comma')} (,)</option>
                <option value="	">${t('csv_tab', 'Tab')} (\\t)</option>
                <option value=";">${t('csv_semicolon', 'Semicolon')} (;)</option>
                <option value="|">${t('csv_pipe', 'Pipe')} (|)</option>
              </select>
            </label>
          </div>
          <div class="csv-module__option">
            <label class="csv-module__checkbox-label">
              <input type="checkbox" id="csvHeader" checked>
              <span>${t('csv_first_row_header', 'First row is header')}</span>
            </label>
          </div>
          <div class="csv-module__option">
            <label class="csv-module__checkbox-label">
              <input type="checkbox" id="csvTranspose">
              <span>${t('csv_transpose', 'Transpose (swap rows/columns)')}</span>
            </label>
          </div>
        </div>

        <!-- Column Filter (shown after parsing) -->
        <div class="csv-module__columns hidden" id="columnFilter">
          <label class="csv-module__label">${t('csv_select_columns', 'Select columns')}:</label>
          <div class="csv-module__column-list" id="columnList"></div>
          <div class="csv-module__column-actions">
            <button type="button" class="csv-module__small-btn" id="selectAllCols">${t('csv_select_all', 'Select all')}</button>
            <button type="button" class="csv-module__small-btn" id="deselectAllCols">${t('csv_deselect_all', 'Deselect all')}</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="csv-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="csvConvertBtn">
            <i data-lucide="arrow-right-left"></i>
            <span id="convertBtnText">${t('convert', 'Convert')}</span>
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="csvClearBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="csvPasteBtn">
            <i data-lucide="clipboard-paste"></i>
            ${t('paste', 'Paste')}
          </button>
          <div id="csvSampleSelector"></div>
        </div>

        <!-- Output Area -->
        <div class="csv-module__output-area">
          <label class="csv-module__label">
            <span class="csv-module__label-text" id="outputLabel">${t('label_json_output', 'JSON Output')}</span>
            <span class="csv-module__stats" id="outputStats"></span>
          </label>
          <textarea 
            id="csvOutput" 
            class="csv-module__textarea csv-module__textarea--output"
            readonly
            placeholder="${t('csv_output_placeholder', 'Converted output will appear here...')}"
          ></textarea>
        </div>

        <!-- Output Actions -->
        <div class="csv-module__actions">
          <button type="button" class="json-toolbox__btn" id="csvCopyBtn">
            <i data-lucide="copy"></i>
            ${t('copy', 'Copy')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="csvDownloadBtn">
            <i data-lucide="download"></i>
            ${t('download', 'Download')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="csvSendToBtn">
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
    // Direction toggle
    document.querySelectorAll('.csv-module__dir-btn').forEach(btn => {
      btn.addEventListener('click', () => setDirection(btn.dataset.dir));
    });

    // Convert button
    document.getElementById('csvConvertBtn').addEventListener('click', convert);

    // Clear button
    document.getElementById('csvClearBtn').addEventListener('click', clearAll);

    // Paste button
    document.getElementById('csvPasteBtn').addEventListener('click', pasteFromClipboard);

    // Copy button
    document.getElementById('csvCopyBtn').addEventListener('click', copyOutput);

    // Download button
    document.getElementById('csvDownloadBtn').addEventListener('click', downloadOutput);

    // Send to button
    document.getElementById('csvSendToBtn').addEventListener('click', showSendToMenu);

    // Sample data selector
    initSampleSelector();

    // Column select/deselect all
    document.getElementById('selectAllCols')?.addEventListener('click', () => toggleAllColumns(true));
    document.getElementById('deselectAllCols')?.addEventListener('click', () => toggleAllColumns(false));

    // Transpose checkbox
    document.getElementById('csvTranspose').addEventListener('change', (e) => {
      isTransposed = e.target.checked;
      if (currentData) convert();
    });

    // Input change - live preview & save
    const input = document.getElementById('csvInput');
    input.addEventListener('input', debounce(() => {
      saveState();
      // Auto-parse for column filter in CSV→JSON mode
      if (direction === 'csv-to-json' && input.value.trim()) {
        parseAndShowColumns();
      }
    }, 300));

    // Drag & drop
    setupDragDrop();

    // Keyboard shortcuts
    document.getElementById('csvInput').addEventListener('keydown', handleKeydown);
    document.getElementById('csvOutput').addEventListener('keydown', handleKeydown);
  }

  // ============================================
  // Direction Toggle
  // ============================================
  function setDirection(dir) {
    direction = dir;
    
    // Update UI
    document.querySelectorAll('.csv-module__dir-btn').forEach(btn => {
      btn.classList.toggle('csv-module__dir-btn--active', btn.dataset.dir === dir);
    });

    const inputLabel = document.getElementById('inputLabel');
    const outputLabel = document.getElementById('outputLabel');
    const inputEl = document.getElementById('csvInput');
    const columnFilter = document.getElementById('columnFilter');

    if (dir === 'csv-to-json') {
      inputLabel.textContent = t('label_csv_input', 'CSV Input');
      outputLabel.textContent = t('label_json_output', 'JSON Output');
      inputEl.placeholder = t('placeholder_csv', 'Paste CSV data here...');
      columnFilter.classList.remove('hidden');
    } else {
      inputLabel.textContent = t('label_json_input', 'JSON Input');
      outputLabel.textContent = t('label_csv_output', 'CSV Output');
      inputEl.placeholder = t('placeholder_json', 'Paste JSON array here...');
      columnFilter.classList.add('hidden');
    }

    // Clear output
    document.getElementById('csvOutput').value = '';
    document.getElementById('outputStats').textContent = '';
  }

  // ============================================
  // CSV to JSON Conversion
  // ============================================
  function csvToJson(csvText, options = {}) {
    const delimiter = options.delimiter === 'auto' ? detectDelimiter(csvText) : options.delimiter;
    const hasHeader = options.hasHeader !== false;

    // Use PapaParse if available, otherwise fallback
    if (window.Papa) {
      const result = window.Papa.parse(csvText, {
        delimiter: delimiter,
        header: hasHeader,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
        transform: (value) => value.trim()
      });

      if (result.errors.length > 0) {
        console.warn('CSV parse warnings:', result.errors);
      }

      return {
        data: result.data,
        headers: hasHeader ? result.meta.fields : null,
        delimiter: result.meta.delimiter,
        rows: result.data.length
      };
    }

    // Fallback parser
    return fallbackCsvParse(csvText, delimiter, hasHeader);
  }

  function fallbackCsvParse(csvText, delimiter, hasHeader) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { data: [], headers: null, rows: 0 };

    const parseRow = (line) => {
      // Simple CSV parsing (doesn't handle quoted fields with delimiters inside)
      return line.split(delimiter).map(cell => cell.trim());
    };

    const headers = hasHeader ? parseRow(lines[0]) : null;
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const data = dataLines.map(line => {
      const values = parseRow(line);
      if (headers) {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] ?? '';
        });
        return obj;
      }
      return values;
    });

    return { data, headers, delimiter, rows: data.length };
  }

  // ============================================
  // JSON to CSV Conversion
  // ============================================
  function jsonToCsv(jsonData, options = {}) {
    const delimiter = options.delimiter || ',';
    
    // Parse if string
    let data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Handle non-array
    if (!Array.isArray(data)) {
      if (typeof data === 'object') {
        data = [data];
      } else {
        throw new Error('Input must be a JSON array or object');
      }
    }

    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Filter columns if specified
    const cols = options.columns || headers;

    // Build CSV
    const escapeCell = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Quote if contains delimiter, quote, or newline
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = [cols.join(delimiter)];
    data.forEach(row => {
      const values = cols.map(col => escapeCell(row[col]));
      rows.push(values.join(delimiter));
    });

    return rows.join('\n');
  }

  // ============================================
  // Transpose
  // ============================================
  function transpose(data) {
    if (!Array.isArray(data) || data.length === 0) return data;

    // For array of objects
    if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
      const headers = Object.keys(data[0]);
      const transposed = headers.map(header => {
        const row = { _key: header };
        data.forEach((item, i) => {
          row[`row_${i + 1}`] = item[header];
        });
        return row;
      });
      return transposed;
    }

    // For array of arrays
    if (Array.isArray(data[0])) {
      const maxLen = Math.max(...data.map(row => row.length));
      const transposed = [];
      for (let i = 0; i < maxLen; i++) {
        transposed.push(data.map(row => row[i] ?? ''));
      }
      return transposed;
    }

    return data;
  }

  // ============================================
  // Main Convert Function
  // ============================================
  function convert() {
    const input = document.getElementById('csvInput').value.trim();
    const output = document.getElementById('csvOutput');
    const stats = document.getElementById('outputStats');

    if (!input) {
      showStatus(t('no_input', 'No input provided.'), 'error');
      return;
    }

    try {
      let result;

      if (direction === 'csv-to-json') {
        const delimiter = document.getElementById('csvDelimiter').value;
        const hasHeader = document.getElementById('csvHeader').checked;

        const parsed = csvToJson(input, { delimiter, hasHeader });
        let data = parsed.data;

        // Apply column filter
        if (selectedColumns.length > 0 && parsed.headers) {
          data = data.map(row => {
            const filtered = {};
            selectedColumns.forEach(col => {
              if (row.hasOwnProperty(col)) {
                filtered[col] = row[col];
              }
            });
            return filtered;
          });
        }

        // Apply transpose
        if (isTransposed) {
          data = transpose(data);
        }

        result = JSON.stringify(data, null, 2);
        stats.textContent = `${parsed.rows} ${t('csv_rows', 'rows')} to JSON`;
        output.value = result;

      } else {
        // JSON to CSV
        const delimiter = document.getElementById('csvDelimiter').value;
        const actualDelimiter = delimiter === 'auto' ? ',' : delimiter;

        let data = JSON.parse(input);

        // Apply transpose
        if (isTransposed) {
          data = transpose(data);
        }

        result = jsonToCsv(data, { 
          delimiter: actualDelimiter,
          columns: selectedColumns.length > 0 ? selectedColumns : null
        });

        const rowCount = result.split('\n').length - 1;
        stats.textContent = `JSON to ${rowCount} ${t('csv_rows', 'rows')}`;
        output.value = result;
      }

      // Analytics: track successful conversion
      if (window.JTA) {
        window.JTA.trackSuccess('csv', direction, result.split('\n').length);
      }
      
      showStatus(t('success', 'Done!'), 'success');
      saveState();

    } catch (e) {
      // Analytics: track error
      if (window.JTA) {
        window.JTA.trackError('csv', 'conversion');
      }
      
      output.value = '';
      stats.textContent = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  // ============================================
  // Column Filter
  // ============================================
  function parseAndShowColumns() {
    const input = document.getElementById('csvInput').value.trim();
    if (!input) return;

    try {
      const delimiter = document.getElementById('csvDelimiter').value;
      const hasHeader = document.getElementById('csvHeader').checked;
      
      if (!hasHeader) {
        document.getElementById('columnFilter').classList.add('hidden');
        return;
      }

      const parsed = csvToJson(input, { delimiter, hasHeader: true });
      
      if (parsed.headers && parsed.headers.length > 0) {
        currentData = parsed;
        
        // Initialize selected columns if empty
        if (selectedColumns.length === 0) {
          selectedColumns = [...parsed.headers];
        }

        renderColumnCheckboxes(parsed.headers);
        document.getElementById('columnFilter').classList.remove('hidden');
      }
    } catch (e) {
      console.warn('Could not parse for column filter:', e);
    }
  }

  function renderColumnCheckboxes(headers) {
    const list = document.getElementById('columnList');
    list.innerHTML = headers.map(h => `
      <label class="csv-module__column-item">
        <input type="checkbox" value="${escapeHtml(h)}" ${selectedColumns.includes(h) ? 'checked' : ''}>
        <span>${escapeHtml(h)}</span>
      </label>
    `).join('');

    // Bind change events
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        updateSelectedColumns();
      });
    });
  }

  function updateSelectedColumns() {
    const checkboxes = document.querySelectorAll('#columnList input[type="checkbox"]');
    selectedColumns = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }

  function toggleAllColumns(select) {
    const checkboxes = document.querySelectorAll('#columnList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = select);
    updateSelectedColumns();
  }

  // ============================================
  // Drag & Drop
  // ============================================
  function setupDragDrop() {
    const dropzone = document.getElementById('csvDropzone');
    const overlay = document.getElementById('dropOverlay');
    const input = document.getElementById('csvInput');

    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('csv-module__drop-overlay--active');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.remove('csv-module__drop-overlay--active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        readFile(files[0]);
      }
    });

    // Also handle paste event for file
    input.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.kind === 'file') {
            e.preventDefault();
            readFile(item.getAsFile());
            return;
          }
        }
      }
    });
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('csvInput').value = e.target.result;
      if (direction === 'csv-to-json') {
        parseAndShowColumns();
      }
      saveState();
    };
    reader.onerror = () => {
      showStatus(t('csv_file_error', 'Could not read file'), 'error');
    };
    reader.readAsText(file);
  }

  // ============================================
  // Clipboard Operations
  // ============================================
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('csvInput').value = text;
      if (direction === 'csv-to-json') {
        parseAndShowColumns();
      }
      saveState();
      showStatus(t('csv_pasted', 'Pasted from clipboard'), 'success');
    } catch (e) {
      showStatus(t('csv_paste_error', 'Could not paste from clipboard'), 'error');
    }
  }

  async function copyOutput() {
    const output = document.getElementById('csvOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to copy'), 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      // Analytics: track copy
      if (window.JTA) {
        window.JTA.trackCopy('csv');
      }
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  // ============================================
  // Download
  // ============================================
  function downloadOutput() {
    const output = document.getElementById('csvOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to download'), 'error');
      return;
    }

    const ext = direction === 'csv-to-json' ? 'json' : 'csv';
    const mime = direction === 'csv-to-json' ? 'application/json' : 'text/csv';
    const filename = `converted.${ext}`;

    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Analytics: track download
    if (window.JTA) {
      window.JTA.trackDownload('csv', ext);
    }
    
    showStatus(`${t('csv_downloaded', 'Downloaded')} ${filename}`, 'success');
  }

  // ============================================
  // Send To (other tabs)
  // ============================================
  function showSendToMenu() {
    const output = document.getElementById('csvOutput').value;
    if (!output) {
      showStatus(t('no_output', 'No output to send'), 'error');
      return;
    }

    // Only JSON output can be sent to other modules
    if (direction !== 'csv-to-json') {
      showStatus(t('csv_no_send_targets', 'No valid targets for CSV output'), 'error');
      return;
    }

    // Use shared handoff module
    const btn = document.getElementById('csvSendToBtn');
    if (window.JSONToolboxHandoff) {
      window.JSONToolboxHandoff.showSendToDropdown(btn, 'csv', output);
    }
  }

  // ============================================
  // Clear
  // ============================================
  function clearAll() {
    document.getElementById('csvInput').value = '';
    document.getElementById('csvOutput').value = '';
    document.getElementById('outputStats').textContent = '';
    selectedColumns = [];
    currentData = null;
    document.getElementById('columnFilter').classList.add('hidden');
    saveState();
    showStatus(t('csv_cleared', 'Cleared'), 'success');
  }

  // ============================================
  // Keyboard Shortcuts
  // ============================================
  function handleKeydown(e) {
    // Ctrl+Enter to convert
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
      window.JSONToolbox.saveToStorage('csv-input', document.getElementById('csvInput').value);
      window.JSONToolbox.saveToStorage('csv-direction', direction);
      window.JSONToolbox.saveToStorage('csv-columns', selectedColumns);
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      const savedInput = window.JSONToolbox.loadFromStorage('csv-input', '');
      const savedDir = window.JSONToolbox.loadFromStorage('csv-direction', 'csv-to-json');
      const savedCols = window.JSONToolbox.loadFromStorage('csv-columns', []);

      if (savedInput) {
        document.getElementById('csvInput').value = savedInput;
      }
      if (savedDir) {
        setDirection(savedDir);
      }
      if (Array.isArray(savedCols)) {
        selectedColumns = savedCols;
      }

      // Parse columns if we have input
      if (savedInput && savedDir === 'csv-to-json') {
        setTimeout(parseAndShowColumns, 100);
      }
    }
  }

  // ============================================
  // Utilities
  // ============================================
  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const counts = {
      ',': (firstLine.match(/,/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length
    };
    
    // Return delimiter with highest count
    return Object.entries(counts).reduce((a, b) => counts[a[0]] >= counts[b[0]] ? a : b)[0];
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

  function showStatus(message, type = 'success') {
    if (window.JSONToolbox && window.JSONToolbox.showStatus) {
      window.JSONToolbox.showStatus(message, type);
    }
  }

  // ============================================
  // Module Styles
  // ============================================
  function addStyles() {
    if (document.getElementById('csv-module-styles')) return;

    const style = document.createElement('style');
    style.id = 'csv-module-styles';
    style.textContent = `
      .csv-module {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
      }

      .csv-module__direction {
        display: flex;
        gap: var(--space-xs);
        padding: var(--space-xs);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        width: fit-content;
      }

      .csv-module__dir-btn {
        padding: var(--space-md) var(--space-xl);
        background: transparent;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: var(--weight-medium);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
        transition: all var(--transition-fast);
      }

      .csv-module__dir-btn:hover {
        background: var(--color-surface-elevated);
        color: var(--color-text);
      }

      .csv-module__dir-btn--active {
        background: var(--color-primary);
        color: white;
        box-shadow: var(--elevation-1);
      }

      .csv-module__input-area,
      .csv-module__output-area {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .csv-module__label {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .csv-module__label-text {
        font-weight: var(--weight-semibold);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .csv-module__hint {
        font-size: var(--text-caption);
        color: var(--color-text-tertiary);
      }

      .csv-module__stats {
        font-size: var(--text-caption);
        color: var(--color-primary);
        margin-left: auto;
      }

      .csv-module__dropzone {
        position: relative;
      }

      .csv-module__textarea {
        width: 100%;
        min-height: 150px;
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

      .csv-module__textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .csv-module__textarea--output {
        background: var(--color-surface-elevated);
      }

      .csv-module__drop-overlay {
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

      .csv-module__drop-overlay--active {
        display: flex;
      }

      .csv-module__drop-overlay i {
        width: 32px;
        height: 32px;
      }

      .csv-module__options {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xl);
        padding: var(--space-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }

      .csv-module__option {
        display: flex;
        align-items: center;
      }

      .csv-module__option-label {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .csv-module__select {
        padding: var(--space-sm) var(--space-md);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-background);
        color: var(--color-text);
        font-size: var(--text-body-sm);
        transition: border-color var(--transition-fast);
      }

      .csv-module__select:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .csv-module__checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
        cursor: pointer;
      }

      .csv-module__columns {
        padding: var(--space-lg);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }

      .csv-module__column-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md);
        margin: var(--space-md) 0;
      }

      .csv-module__column-item {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        padding: var(--space-sm) var(--space-md);
        background: var(--color-background);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: var(--text-caption);
        cursor: pointer;
        transition: border-color var(--transition-fast);
      }

      .csv-module__column-item:hover {
        border-color: var(--color-primary);
      }

      .csv-module__column-actions {
        display: flex;
        gap: var(--space-md);
      }

      .csv-module__small-btn {
        padding: var(--space-sm) var(--space-md);
        background: transparent;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: var(--text-caption);
        cursor: pointer;
        color: var(--color-text-secondary);
        transition: all var(--transition-fast);
      }

      .csv-module__small-btn:hover {
        background: var(--color-surface-elevated);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .csv-module__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md);
      }

      @media (max-width: 480px) {
        .csv-module__options {
          flex-direction: column;
          gap: var(--space-md);
        }

        .csv-module__direction {
          width: 100%;
        }

        .csv-module__dir-btn {
          flex: 1;
          text-align: center;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // Sample Data Selector
  // ============================================
  function initSampleSelector() {
    const container = document.getElementById('csvSampleSelector');
    if (!container || !window.JSONToolboxSamples) return;

    const selector = window.JSONToolboxSamples.createSampleSelector('csv', (data, sampleId) => {
      const input = document.getElementById('csvInput');
      if (input) {
        input.value = data;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        if (direction === 'csv-to-json') {
          parseAndShowColumns();
        }
        saveState();
        showStatus(t('sample_loaded', 'Sample loaded'), 'success');
      }
    });

    if (selector) {
      container.appendChild(selector);
    }
  }

  // ============================================
  // Export & Auto-init
  // ============================================
  window.CSVModule = { init, convert, csvToJson, jsonToCsv, transpose };

  // Auto-init when tab is shown
  window.addEventListener('jsontoolbox:tabchange', (e) => {
    if (e.detail.tab === 'csv') {
      init();
    }
  });

  // Init if already on CSV tab
  if (document.querySelector('.json-toolbox__tab--active[data-tab="csv"]')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

})();
