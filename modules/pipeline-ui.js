/**
 * JSON Toolbox - Pipeline UI Module
 * Version: 1.0.0
 * 
 * User interface for building and running pipelines.
 * Provides visual pipeline builder and manifest editor.
 * 
 * @see docs/pipelines.md for specification
 */

(function() {
  'use strict';

  // ============================================
  // Module State
  // ============================================
  
  let currentManifest = null;
  let lastResult = null;

  // ============================================
  // i18n Helper
  // ============================================
  
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  // ============================================
  // Initialize Module
  // ============================================
  
  function init() {
    const panel = document.getElementById('content-pipeline');
    if (!panel) return;

    panel.innerHTML = `
      <div class="pipeline-module">
        <!-- Mode Toggle -->
        <div class="pipeline-module__mode">
          <button type="button" class="pipeline-module__mode-btn pipeline-module__mode-btn--active" data-mode="visual">
            <i data-lucide="workflow"></i>
            ${t('pipeline_visual', 'Visual Builder')}
          </button>
          <button type="button" class="pipeline-module__mode-btn" data-mode="manifest">
            <i data-lucide="file-json"></i>
            ${t('pipeline_manifest', 'Manifest Editor')}
          </button>
        </div>

        <!-- Visual Builder Mode -->
        <div class="pipeline-module__visual" id="pipelineVisual">
          <!-- Pipeline Info -->
          <div class="pipeline-module__info">
            <div class="pipeline-module__field">
              <label>${t('pipeline_name', 'Name')}:</label>
              <input type="text" id="pipelineName" placeholder="my-pipeline" pattern="^[a-z][a-z0-9-]*$">
            </div>
            <div class="pipeline-module__field">
              <label>${t('pipeline_version', 'Version')}:</label>
              <input type="text" id="pipelineVersion" value="1.0.0" pattern="^\\d+\\.\\d+\\.\\d+$">
            </div>
          </div>

          <!-- Steps Builder -->
          <div class="pipeline-module__builder">
            <div class="pipeline-module__steps-header">
              <h3>${t('pipeline_steps', 'Pipeline Steps')}</h3>
              <button type="button" class="pipeline-module__add-btn" id="addStepBtn">
                <i data-lucide="plus"></i>
                ${t('pipeline_add_step', 'Add Step')}
              </button>
            </div>
            <div class="pipeline-module__steps" id="pipelineSteps">
              <!-- Steps will be rendered here -->
              <div class="pipeline-module__empty">
                ${t('pipeline_no_steps', 'No steps yet. Click "Add Step" to start building your pipeline.')}
              </div>
            </div>
          </div>

          <!-- Input Data -->
          <div class="pipeline-module__input-section">
            <label class="pipeline-module__label">
              <span>${t('pipeline_input', 'Input Data')}</span>
            </label>
            <textarea 
              id="pipelineInput" 
              class="pipeline-module__textarea"
              placeholder="${t('pipeline_input_placeholder', 'Enter input data here...')}"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- Manifest Editor Mode -->
        <div class="pipeline-module__manifest hidden" id="pipelineManifest">
          <label class="pipeline-module__label">
            <span>${t('pipeline_manifest_json', 'Pipeline Manifest (JSON)')}</span>
          </label>
          <textarea 
            id="manifestEditor" 
            class="pipeline-module__textarea pipeline-module__textarea--manifest"
            placeholder='${t('pipeline_manifest_placeholder', '{"name": "my-pipeline", "version": "1.0.0", "steps": [...]}')}'
            spellcheck="false"
          ></textarea>
          <div class="pipeline-module__manifest-actions">
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="formatManifestBtn">
              <i data-lucide="align-left"></i>
              ${t('format', 'Format')}
            </button>
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="validateManifestBtn">
              <i data-lucide="check-circle"></i>
              ${t('validate', 'Validate')}
            </button>
            <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="loadExampleBtn">
              <i data-lucide="file-text"></i>
              ${t('pipeline_load_example', 'Load Example')}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="pipeline-module__actions">
          <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="runPipelineBtn">
            <i data-lucide="play"></i>
            ${t('pipeline_run', 'Run Pipeline')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="clearPipelineBtn">
            <i data-lucide="trash-2"></i>
            ${t('clear', 'Clear')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="exportManifestBtn">
            <i data-lucide="download"></i>
            ${t('pipeline_export', 'Export Manifest')}
          </button>
        </div>

        <!-- Output Section -->
        <div class="pipeline-module__output-section">
          <label class="pipeline-module__label">
            <span>${t('pipeline_output', 'Output')}</span>
            <span class="pipeline-module__stats" id="pipelineStats"></span>
          </label>
          <textarea 
            id="pipelineOutput" 
            class="pipeline-module__textarea pipeline-module__textarea--output"
            readonly
            placeholder="${t('pipeline_output_placeholder', 'Pipeline output will appear here...')}"
          ></textarea>
        </div>

        <!-- Output Actions -->
        <div class="pipeline-module__actions">
          <button type="button" class="json-toolbox__btn" id="copyOutputBtn">
            <i data-lucide="copy"></i>
            ${t('copy', 'Copy')}
          </button>
          <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="downloadOutputBtn">
            <i data-lucide="download"></i>
            ${t('download', 'Download')}
          </button>
        </div>

        <!-- Step Execution Log -->
        <div class="pipeline-module__log-section hidden" id="executionLog">
          <label class="pipeline-module__label">
            <span>${t('pipeline_execution_log', 'Execution Log')}</span>
          </label>
          <div class="pipeline-module__log" id="logContent"></div>
        </div>
      </div>

      <!-- Add Step Modal -->
      <div class="pipeline-module__modal hidden" id="addStepModal">
        <div class="pipeline-module__modal-content">
          <div class="pipeline-module__modal-header">
            <h3>${t('pipeline_select_operator', 'Select Operator')}</h3>
            <button type="button" class="pipeline-module__modal-close" id="closeModalBtn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="pipeline-module__modal-body">
            <div class="pipeline-module__operator-search">
              <input type="text" id="operatorSearch" placeholder="${t('pipeline_search_operators', 'Search operators...')}">
            </div>
            <div class="pipeline-module__operator-list" id="operatorList">
              <!-- Operators will be rendered here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Step Modal -->
      <div class="pipeline-module__modal hidden" id="editStepModal">
        <div class="pipeline-module__modal-content">
          <div class="pipeline-module__modal-header">
            <h3>${t('pipeline_edit_step', 'Edit Step')}</h3>
            <button type="button" class="pipeline-module__modal-close" id="closeEditModalBtn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="pipeline-module__modal-body">
            <div class="pipeline-module__edit-operator" id="editOperatorName"></div>
            <div class="pipeline-module__edit-params" id="editParamsContainer">
              <!-- Param fields will be rendered here -->
            </div>
            <div class="pipeline-module__edit-actions">
              <button type="button" class="json-toolbox__btn json-toolbox__btn--primary" id="saveStepParamsBtn">
                <i data-lucide="check"></i>
                ${t('save', 'Save')}
              </button>
              <button type="button" class="json-toolbox__btn json-toolbox__btn--secondary" id="cancelEditBtn">
                ${t('cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    addStyles();
    window.JSONToolbox?.refreshIcons(panel);
    bindEvents();
    restoreState();
    renderOperatorList();
  }

  // ============================================
  // Event Binding
  // ============================================
  
  function bindEvents() {
    // Mode toggle
    document.querySelectorAll('.pipeline-module__mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Add step
    document.getElementById('addStepBtn')?.addEventListener('click', showAddStepModal);
    document.getElementById('closeModalBtn')?.addEventListener('click', hideAddStepModal);
    
    // Operator search
    document.getElementById('operatorSearch')?.addEventListener('input', filterOperators);

    // Run pipeline
    document.getElementById('runPipelineBtn')?.addEventListener('click', runPipeline);
    
    // Clear
    document.getElementById('clearPipelineBtn')?.addEventListener('click', clearAll);
    
    // Export manifest
    document.getElementById('exportManifestBtn')?.addEventListener('click', exportManifest);
    
    // Format manifest
    document.getElementById('formatManifestBtn')?.addEventListener('click', formatManifest);
    
    // Validate manifest
    document.getElementById('validateManifestBtn')?.addEventListener('click', validateManifest);
    
    // Load example
    document.getElementById('loadExampleBtn')?.addEventListener('click', loadExample);
    
    // Copy output
    document.getElementById('copyOutputBtn')?.addEventListener('click', copyOutput);
    
    // Download output
    document.getElementById('downloadOutputBtn')?.addEventListener('click', downloadOutput);

    // Close modal on outside click
    document.getElementById('addStepModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'addStepModal') hideAddStepModal();
    });

    // Edit step modal
    document.getElementById('closeEditModalBtn')?.addEventListener('click', hideEditStepModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', hideEditStepModal);
    document.getElementById('saveStepParamsBtn')?.addEventListener('click', saveStepParams);
    document.getElementById('editStepModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'editStepModal') hideEditStepModal();
    });

    // Input change - save state
    document.getElementById('pipelineInput')?.addEventListener('input', debounce(saveState, 300));
    document.getElementById('manifestEditor')?.addEventListener('input', debounce(saveState, 300));
    document.getElementById('pipelineName')?.addEventListener('input', debounce(saveState, 300));
    document.getElementById('pipelineVersion')?.addEventListener('input', debounce(saveState, 300));
  }

  // ============================================
  // Mode Toggle
  // ============================================
  
  function setMode(mode) {
    document.querySelectorAll('.pipeline-module__mode-btn').forEach(btn => {
      btn.classList.toggle('pipeline-module__mode-btn--active', btn.dataset.mode === mode);
    });

    document.getElementById('pipelineVisual').classList.toggle('hidden', mode !== 'visual');
    document.getElementById('pipelineManifest').classList.toggle('hidden', mode !== 'manifest');

    // Sync manifest editor with visual builder
    if (mode === 'manifest') {
      const manifest = buildManifestFromVisual();
      document.getElementById('manifestEditor').value = JSON.stringify(manifest, null, 2);
    }
  }

  // ============================================
  // Step Management
  // ============================================
  
  let steps = [];

  function renderSteps() {
    const container = document.getElementById('pipelineSteps');
    if (!container) return;

    if (steps.length === 0) {
      container.innerHTML = `
        <div class="pipeline-module__empty">
          ${t('pipeline_no_steps', 'No steps yet. Click "Add Step" to start building your pipeline.')}
        </div>
      `;
      return;
    }

    container.innerHTML = steps.map((step, i) => `
      <div class="pipeline-module__step" data-index="${i}">
        <div class="pipeline-module__step-header">
          <span class="pipeline-module__step-number">${i + 1}</span>
          <span class="pipeline-module__step-operator">${step.operator}</span>
          <div class="pipeline-module__step-actions">
            <button type="button" class="pipeline-module__step-btn" data-action="edit" data-index="${i}" title="${t('edit', 'Edit')}">
              <i data-lucide="edit-2"></i>
            </button>
            <button type="button" class="pipeline-module__step-btn" data-action="delete" data-index="${i}" title="${t('delete', 'Delete')}">
              <i data-lucide="trash-2"></i>
            </button>
            ${i > 0 ? `<button type="button" class="pipeline-module__step-btn" data-action="up" data-index="${i}" title="${t('move_up', 'Move Up')}"><i data-lucide="chevron-up"></i></button>` : ''}
            ${i < steps.length - 1 ? `<button type="button" class="pipeline-module__step-btn" data-action="down" data-index="${i}" title="${t('move_down', 'Move Down')}"><i data-lucide="chevron-down"></i></button>` : ''}
          </div>
        </div>
        ${Object.keys(step.params || {}).length > 0 ? `
          <div class="pipeline-module__step-params">
            ${Object.entries(step.params).map(([k, v]) => `<span class="pipeline-module__param">${k}: ${JSON.stringify(v)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('<div class="pipeline-module__step-arrow"><i data-lucide="arrow-down"></i></div>');

    window.JSONToolbox?.refreshIcons(container);

    // Bind step actions
    container.querySelectorAll('.pipeline-module__step-btn').forEach(btn => {
      btn.addEventListener('click', () => handleStepAction(btn.dataset.action, parseInt(btn.dataset.index)));
    });
  }

  function handleStepAction(action, index) {
    switch (action) {
      case 'delete':
        steps.splice(index, 1);
        renderSteps();
        saveState();
        break;
      case 'up':
        if (index > 0) {
          [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
          renderSteps();
          saveState();
        }
        break;
      case 'down':
        if (index < steps.length - 1) {
          [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
          renderSteps();
          saveState();
        }
        break;
      case 'edit':
        showEditStepModal(index);
        break;
    }
  }

  function addStep(operatorId, params = {}) {
    steps.push({ operator: operatorId, params });
    renderSteps();
    hideAddStepModal();
    saveState();
  }

  // ============================================
  // Edit Step Modal
  // ============================================

  let editingStepIndex = null;

  function showEditStepModal(index) {
    editingStepIndex = index;
    const step = steps[index];
    if (!step) return;

    const meta = window.OperatorRegistry?.getMeta(step.operator);
    const modal = document.getElementById('editStepModal');
    const operatorName = document.getElementById('editOperatorName');
    const paramsContainer = document.getElementById('editParamsContainer');

    // Show operator name
    operatorName.innerHTML = `<code>${step.operator}</code>`;

    // Build param form
    const paramDefs = meta?.params || {};
    const currentParams = step.params || {};

    if (Object.keys(paramDefs).length === 0) {
      paramsContainer.innerHTML = `<div class="pipeline-module__no-params">${t('pipeline_no_params', 'This operator has no parameters')}</div>`;
    } else {
      paramsContainer.innerHTML = Object.entries(paramDefs).map(([key, def]) => {
        const currentValue = currentParams[key] !== undefined ? currentParams[key] : (def.default ?? '');
        const valueStr = typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue);
        const typeHint = def.type || 'string';
        
        return `
          <div class="pipeline-module__param-field">
            <label class="pipeline-module__param-label">
              <span class="pipeline-module__param-name">${key}</span>
              <span class="pipeline-module__param-type">${typeHint}</span>
            </label>
            ${typeHint === 'boolean' ? `
              <select class="pipeline-module__param-input" data-param="${key}" data-type="${typeHint}">
                <option value="" ${currentValue === '' || currentValue === null ? 'selected' : ''}>(default)</option>
                <option value="true" ${currentValue === true || currentValue === 'true' ? 'selected' : ''}>true</option>
                <option value="false" ${currentValue === false || currentValue === 'false' ? 'selected' : ''}>false</option>
              </select>
            ` : `
              <input type="text" 
                class="pipeline-module__param-input" 
                data-param="${key}" 
                data-type="${typeHint}"
                value="${valueStr.replace(/"/g, '&quot;')}"
                placeholder="${def.description || ''}"
              >
            `}
            ${def.description ? `<div class="pipeline-module__param-desc">${def.description}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    modal?.classList.remove('hidden');
    window.JSONToolbox?.refreshIcons(modal);
  }

  function hideEditStepModal() {
    document.getElementById('editStepModal')?.classList.add('hidden');
    editingStepIndex = null;
  }

  function saveStepParams() {
    if (editingStepIndex === null) return;

    const step = steps[editingStepIndex];
    if (!step) return;

    const inputs = document.querySelectorAll('#editParamsContainer .pipeline-module__param-input');
    const newParams = {};

    inputs.forEach(input => {
      const key = input.dataset.param;
      const type = input.dataset.type;
      let value = input.value.trim();

      // Skip empty values (use default)
      if (value === '' || value === '(default)') return;

      // Parse by type
      if (type === 'boolean') {
        if (value === 'true') newParams[key] = true;
        else if (value === 'false') newParams[key] = false;
      } else if (type === 'number') {
        const num = Number(value);
        if (!isNaN(num)) newParams[key] = num;
      } else if (type === 'array' || type === 'object') {
        try {
          newParams[key] = JSON.parse(value);
        } catch {
          newParams[key] = value;
        }
      } else {
        newParams[key] = value;
      }
    });

    step.params = newParams;
    renderSteps();
    hideEditStepModal();
    saveState();
    showStatus(t('pipeline_params_saved', 'Parameters saved'), 'success');
  }

  // ============================================
  // Operator Selection Modal
  // ============================================
  
  function showAddStepModal() {
    document.getElementById('addStepModal')?.classList.remove('hidden');
    document.getElementById('operatorSearch')?.focus();
  }

  function hideAddStepModal() {
    document.getElementById('addStepModal')?.classList.add('hidden');
    document.getElementById('operatorSearch').value = '';
    renderOperatorList();
  }

  function renderOperatorList(filter = '') {
    const container = document.getElementById('operatorList');
    if (!container || !window.OperatorRegistry) return;

    const operators = window.OperatorRegistry.listWithMeta();
    const filtered = filter 
      ? operators.filter(op => op.id.toLowerCase().includes(filter.toLowerCase()) || 
                               (op.description || '').toLowerCase().includes(filter.toLowerCase()))
      : operators;

    // Group by namespace
    const grouped = {};
    filtered.forEach(op => {
      const ns = op.id.split('.')[0];
      if (!grouped[ns]) grouped[ns] = [];
      grouped[ns].push(op);
    });

    container.innerHTML = Object.entries(grouped).map(([ns, ops]) => `
      <div class="pipeline-module__operator-group">
        <div class="pipeline-module__operator-ns">${ns.toUpperCase()}</div>
        ${ops.map(op => `
          <button type="button" class="pipeline-module__operator-item" data-operator="${op.id}">
            <span class="pipeline-module__operator-id">${op.id}</span>
            <span class="pipeline-module__operator-desc">${op.description || ''}</span>
          </button>
        `).join('')}
      </div>
    `).join('');

    // Bind click events
    container.querySelectorAll('.pipeline-module__operator-item').forEach(btn => {
      btn.addEventListener('click', () => addStep(btn.dataset.operator));
    });
  }

  function filterOperators(e) {
    renderOperatorList(e.target.value);
  }

  // ============================================
  // Build Manifest
  // ============================================
  
  function buildManifestFromVisual() {
    return {
      name: document.getElementById('pipelineName')?.value || 'unnamed-pipeline',
      version: document.getElementById('pipelineVersion')?.value || '1.0.0',
      steps: steps.map(s => {
        const step = { operator: s.operator };
        if (Object.keys(s.params || {}).length > 0) {
          step.params = s.params;
        }
        return step;
      })
    };
  }

  function getManifest() {
    const visualMode = !document.getElementById('pipelineVisual')?.classList.contains('hidden');
    
    if (visualMode) {
      return buildManifestFromVisual();
    } else {
      try {
        return JSON.parse(document.getElementById('manifestEditor')?.value || '{}');
      } catch (e) {
        throw new Error('Invalid manifest JSON: ' + e.message);
      }
    }
  }

  // ============================================
  // Run Pipeline
  // ============================================
  
  function runPipeline() {
    const input = document.getElementById('pipelineInput')?.value || '';
    const output = document.getElementById('pipelineOutput');
    const stats = document.getElementById('pipelineStats');
    const logSection = document.getElementById('executionLog');
    const logContent = document.getElementById('logContent');

    if (!input.trim()) {
      showStatus(t('pipeline_no_input', 'Please provide input data'), 'error');
      return;
    }

    try {
      const manifest = getManifest();

      if (!manifest.steps || manifest.steps.length === 0) {
        showStatus(t('pipeline_no_steps_error', 'Pipeline has no steps'), 'error');
        return;
      }

      // Create engine with metrics
      const engine = new window.PipelineEngine({
        collectMetrics: true,
        validateTypes: true
      });

      // Execute pipeline
      const result = engine.execute(manifest, input);
      lastResult = result;

      if (result.success) {
        // Format output
        let outputText = result.output;
        if (typeof outputText === 'object') {
          outputText = JSON.stringify(outputText, null, 2);
        }
        output.value = outputText;

        // Show stats
        const duration = result.metrics?.totalDuration?.toFixed(1) || 0;
        stats.textContent = `${manifest.steps.length} ${t('pipeline_steps_run', 'steps')} in ${duration}ms`;

        // Analytics
        if (window.JTA) {
          window.JTA.trackSuccess('pipeline', manifest.name, manifest.steps.length);
        }

        showStatus(t('pipeline_success', 'Pipeline executed successfully'), 'success');
      } else {
        output.value = '';
        stats.textContent = t('pipeline_failed', 'Failed');

        // Analytics
        if (window.JTA) {
          window.JTA.trackError('pipeline', result.error?.code || 'UNKNOWN');
        }

        showStatus(`${t('error', 'Error')}: ${result.error?.message || 'Unknown error'}`, 'error');
      }

      // Show execution log
      renderExecutionLog(result, logSection, logContent);

    } catch (e) {
      output.value = '';
      stats.textContent = '';
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  function renderExecutionLog(result, section, content) {
    section?.classList.remove('hidden');
    
    const stepsHtml = (result.steps || []).map((step, i) => `
      <div class="pipeline-module__log-step ${step.success ? 'pipeline-module__log-step--success' : 'pipeline-module__log-step--error'}">
        <span class="pipeline-module__log-icon">${step.success ? '✓' : '✗'}</span>
        <span class="pipeline-module__log-operator">${step.operator}</span>
        <span class="pipeline-module__log-type">${step.inputType} → ${step.outputType}</span>
        ${step.metrics ? `<span class="pipeline-module__log-duration">${step.metrics.duration.toFixed(1)}ms</span>` : ''}
        ${step.error ? `<span class="pipeline-module__log-error">${step.error.message}</span>` : ''}
      </div>
    `).join('');

    content.innerHTML = stepsHtml || `<div class="pipeline-module__log-empty">${t('pipeline_no_log', 'No execution data')}</div>`;
  }

  // ============================================
  // Manifest Operations
  // ============================================
  
  function formatManifest() {
    const editor = document.getElementById('manifestEditor');
    try {
      const json = JSON.parse(editor.value);
      editor.value = JSON.stringify(json, null, 2);
      showStatus(t('formatted', 'Formatted'), 'success');
    } catch (e) {
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  function validateManifest() {
    try {
      const manifest = JSON.parse(document.getElementById('manifestEditor')?.value || '{}');
      const engine = new window.PipelineEngine();
      const result = engine.validate(manifest);

      if (result.valid) {
        showStatus(t('pipeline_manifest_valid', 'Manifest is valid'), 'success');
      } else {
        const errors = result.errors.map(e => e.message).join('; ');
        showStatus(`${t('pipeline_manifest_invalid', 'Invalid')}: ${errors}`, 'error');
      }
    } catch (e) {
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  function loadExample() {
    const example = {
      name: "csv-to-json-sorted",
      version: "1.0.0",
      description: "Parse CSV and sort by name",
      steps: [
        { operator: "csv.parse", params: { header: true } },
        { operator: "transform.sort", params: { key: "name", order: "asc" } },
        { operator: "json.stringify", params: { indent: 2 } }
      ]
    };

    document.getElementById('manifestEditor').value = JSON.stringify(example, null, 2);
    document.getElementById('pipelineInput').value = 'name,age,city\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago';
    
    // Also update visual mode
    document.getElementById('pipelineName').value = example.name;
    document.getElementById('pipelineVersion').value = example.version;
    steps = example.steps.map(s => ({ operator: s.operator, params: s.params || {} }));
    renderSteps();

    showStatus(t('pipeline_example_loaded', 'Example loaded'), 'success');
  }

  function exportManifest() {
    try {
      const manifest = getManifest();
      const json = JSON.stringify(manifest, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${manifest.name || 'pipeline'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus(t('pipeline_exported', 'Manifest exported'), 'success');
    } catch (e) {
      showStatus(`${t('error', 'Error')}: ${e.message}`, 'error');
    }
  }

  // ============================================
  // Output Operations
  // ============================================
  
  async function copyOutput() {
    const output = document.getElementById('pipelineOutput')?.value;
    if (!output) {
      showStatus(t('no_output', 'No output to copy'), 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      if (window.JTA) window.JTA.trackCopy('pipeline');
      showStatus(t('copied', 'Copied!'), 'success');
    } catch (e) {
      showStatus(t('copy_error', 'Could not copy'), 'error');
    }
  }

  function downloadOutput() {
    const output = document.getElementById('pipelineOutput')?.value;
    if (!output) {
      showStatus(t('no_output', 'No output to download'), 'error');
      return;
    }

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline-output.json';
    a.click();
    URL.revokeObjectURL(url);

    if (window.JTA) window.JTA.trackDownload('pipeline', 'json');
    showStatus(t('downloaded', 'Downloaded'), 'success');
  }

  // ============================================
  // Clear
  // ============================================
  
  function clearAll() {
    steps = [];
    renderSteps();
    document.getElementById('pipelineName').value = '';
    document.getElementById('pipelineVersion').value = '1.0.0';
    document.getElementById('pipelineInput').value = '';
    document.getElementById('pipelineOutput').value = '';
    document.getElementById('manifestEditor').value = '';
    document.getElementById('pipelineStats').textContent = '';
    document.getElementById('executionLog')?.classList.add('hidden');
    saveState();
    showStatus(t('cleared', 'Cleared'), 'success');
  }

  // ============================================
  // State Persistence
  // ============================================
  
  function saveState() {
    if (window.JSONToolbox) {
      window.JSONToolbox.saveToStorage('pipeline-steps', steps);
      window.JSONToolbox.saveToStorage('pipeline-name', document.getElementById('pipelineName')?.value || '');
      window.JSONToolbox.saveToStorage('pipeline-version', document.getElementById('pipelineVersion')?.value || '1.0.0');
      window.JSONToolbox.saveToStorage('pipeline-input', document.getElementById('pipelineInput')?.value || '');
    }
  }

  function restoreState() {
    if (window.JSONToolbox) {
      steps = window.JSONToolbox.loadFromStorage('pipeline-steps', []);
      renderSteps();

      const name = window.JSONToolbox.loadFromStorage('pipeline-name', '');
      const version = window.JSONToolbox.loadFromStorage('pipeline-version', '1.0.0');
      const input = window.JSONToolbox.loadFromStorage('pipeline-input', '');

      if (name) document.getElementById('pipelineName').value = name;
      if (version) document.getElementById('pipelineVersion').value = version;
      if (input) document.getElementById('pipelineInput').value = input;
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

  function showStatus(message, type) {
    if (window.JSONToolbox?.showStatus) {
      window.JSONToolbox.showStatus(message, type);
    }
  }

  // ============================================
  // Module Styles
  // ============================================
  
  function addStyles() {
    if (document.getElementById('pipeline-module-styles')) return;

    const style = document.createElement('style');
    style.id = 'pipeline-module-styles';
    style.textContent = `
      .pipeline-module {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl, 1.5rem);
      }

      .pipeline-module__mode {
        display: flex;
        gap: var(--space-xs, 0.25rem);
        padding: var(--space-xs, 0.25rem);
        background: var(--color-surface, #f8f9fa);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-lg, 0.5rem);
        width: fit-content;
      }

      .pipeline-module__mode-btn {
        display: flex;
        align-items: center;
        gap: var(--space-sm, 0.5rem);
        padding: var(--space-md, 0.75rem) var(--space-xl, 1.25rem);
        background: transparent;
        border: none;
        border-radius: var(--radius-md, 0.375rem);
        cursor: pointer;
        font-weight: var(--weight-medium, 500);
        font-size: var(--text-body-sm, 0.875rem);
        color: var(--color-text-secondary, #64748b);
        transition: all 0.15s ease;
      }

      .pipeline-module__mode-btn:hover {
        background: var(--color-surface-elevated, #f1f5f9);
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__mode-btn--active {
        background: var(--color-primary, #2563eb);
        color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .pipeline-module__mode-btn i {
        width: 16px;
        height: 16px;
      }

      .pipeline-module__info {
        display: flex;
        gap: var(--space-lg, 1rem);
        flex-wrap: wrap;
      }

      .pipeline-module__field {
        display: flex;
        align-items: center;
        gap: var(--space-sm, 0.5rem);
      }

      .pipeline-module__field label {
        font-size: var(--text-body-sm, 0.875rem);
        color: var(--color-text-secondary, #64748b);
      }

      .pipeline-module__field input {
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-sm, 0.25rem);
        font-size: var(--text-body-sm, 0.875rem);
        width: 150px;
        background: var(--jt-input-bg, var(--color-surface, #ffffff));
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__builder {
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-md, 0.375rem);
        overflow: hidden;
      }

      .pipeline-module__steps-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-md, 0.75rem) var(--space-lg, 1rem);
        background: var(--color-surface, #f8f9fa);
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }

      .pipeline-module__steps-header h3 {
        margin: 0;
        font-size: var(--text-body-sm, 0.875rem);
        font-weight: var(--weight-semibold, 600);
      }

      .pipeline-module__add-btn {
        display: flex;
        align-items: center;
        gap: var(--space-xs, 0.25rem);
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        background: var(--color-primary, #2563eb);
        color: white;
        border: none;
        border-radius: var(--radius-sm, 0.25rem);
        font-size: var(--text-caption, 0.75rem);
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .pipeline-module__add-btn:hover {
        background: var(--color-primary-dark, #1d4ed8);
      }

      .pipeline-module__add-btn i {
        width: 14px;
        height: 14px;
      }

      .pipeline-module__steps {
        padding: var(--space-lg, 1rem);
        min-height: 100px;
        display: flex;
        flex-direction: column;
        gap: var(--space-sm, 0.5rem);
        align-items: center;
      }

      .pipeline-module__empty {
        color: var(--color-text-tertiary, #94a3b8);
        font-size: var(--text-body-sm, 0.875rem);
        text-align: center;
        padding: var(--space-xl, 1.5rem);
      }

      .pipeline-module__step {
        width: 100%;
        max-width: 400px;
        background: var(--color-surface, #f8f9fa);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-md, 0.375rem);
        overflow: hidden;
      }

      .pipeline-module__step-header {
        display: flex;
        align-items: center;
        gap: var(--space-md, 0.75rem);
        padding: var(--space-md, 0.75rem);
      }

      .pipeline-module__step-number {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-primary, #2563eb);
        color: white;
        border-radius: 50%;
        font-size: var(--text-caption, 0.75rem);
        font-weight: var(--weight-semibold, 600);
      }

      .pipeline-module__step-operator {
        flex: 1;
        font-family: var(--font-mono, monospace);
        font-size: var(--text-body-sm, 0.875rem);
      }

      .pipeline-module__step-actions {
        display: flex;
        gap: var(--space-xs, 0.25rem);
      }

      .pipeline-module__step-btn {
        padding: var(--space-xs, 0.25rem);
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--color-text-tertiary, #94a3b8);
        border-radius: var(--radius-sm, 0.25rem);
        transition: all 0.15s ease;
      }

      .pipeline-module__step-btn:hover {
        background: var(--color-surface-elevated, #f1f5f9);
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__step-btn i {
        width: 14px;
        height: 14px;
      }

      .pipeline-module__step-params {
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        background: var(--color-surface, var(--jt-panel-bg, #ffffff));
        border-top: 1px solid var(--color-border, #e2e8f0);
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs, 0.25rem);
      }

      .pipeline-module__param {
        font-size: var(--text-caption, 0.75rem);
        font-family: var(--font-mono, monospace);
        padding: 2px 6px;
        background: var(--color-surface-elevated, #f1f5f9);
        border-radius: var(--radius-sm, 0.25rem);
        color: var(--color-text-secondary, #64748b);
      }

      .pipeline-module__step-arrow {
        color: var(--color-text-tertiary, #94a3b8);
      }

      .pipeline-module__step-arrow i {
        width: 20px;
        height: 20px;
      }

      .pipeline-module__label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: var(--weight-semibold, 600);
        font-size: var(--text-body-sm, 0.875rem);
        color: var(--color-text-secondary, #64748b);
      }

      .pipeline-module__stats {
        font-weight: var(--weight-normal, 400);
        color: var(--color-primary, #2563eb);
      }

      .pipeline-module__textarea {
        width: 100%;
        min-height: 120px;
        padding: var(--space-md, 0.75rem);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-md, 0.375rem);
        background: var(--color-surface, #f8f9fa);
        color: var(--color-text, #1e293b);
        font-family: var(--font-mono, monospace);
        font-size: var(--text-body-sm, 0.875rem);
        line-height: 1.5;
        resize: vertical;
      }

      .pipeline-module__textarea:focus {
        outline: none;
        border-color: var(--color-primary, #2563eb);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .pipeline-module__textarea--output {
        background: var(--color-surface-elevated, #f1f5f9);
      }

      .pipeline-module__textarea--manifest {
        min-height: 200px;
      }

      .pipeline-module__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md, 0.75rem);
      }

      .pipeline-module__manifest-actions {
        display: flex;
        gap: var(--space-sm, 0.5rem);
        margin-top: var(--space-sm, 0.5rem);
      }

      /* Execution Log */
      .pipeline-module__log {
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-md, 0.375rem);
        overflow: hidden;
      }

      .pipeline-module__log-step {
        display: flex;
        align-items: center;
        gap: var(--space-md, 0.75rem);
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        font-size: var(--text-body-sm, 0.875rem);
      }

      .pipeline-module__log-step:last-child {
        border-bottom: none;
      }

      .pipeline-module__log-step--success {
        background: rgba(34, 197, 94, 0.05);
      }

      .pipeline-module__log-step--error {
        background: rgba(239, 68, 68, 0.05);
      }

      .pipeline-module__log-icon {
        width: 20px;
        text-align: center;
      }

      .pipeline-module__log-step--success .pipeline-module__log-icon {
        color: var(--color-success, #22c55e);
      }

      .pipeline-module__log-step--error .pipeline-module__log-icon {
        color: var(--color-error, #ef4444);
      }

      .pipeline-module__log-operator {
        font-family: var(--font-mono, monospace);
        flex: 1;
      }

      .pipeline-module__log-type {
        color: var(--color-text-tertiary, #94a3b8);
        font-size: var(--text-caption, 0.75rem);
      }

      .pipeline-module__log-duration {
        color: var(--color-text-secondary, #64748b);
        font-size: var(--text-caption, 0.75rem);
      }

      .pipeline-module__log-error {
        color: var(--color-error, #ef4444);
        font-size: var(--text-caption, 0.75rem);
      }

      /* Modal */
      .pipeline-module__modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .pipeline-module__modal-content {
        background: var(--color-surface, var(--jt-panel-bg, #ffffff));
        border-radius: var(--radius-lg, 0.5rem);
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .pipeline-module__modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-lg, 1rem);
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }

      .pipeline-module__modal-header h3 {
        margin: 0;
        font-size: var(--text-body, 1rem);
      }

      .pipeline-module__modal-close {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--color-text-tertiary, #94a3b8);
        padding: var(--space-xs, 0.25rem);
      }

      .pipeline-module__modal-close:hover {
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__modal-body {
        padding: var(--space-lg, 1rem);
        overflow-y: auto;
      }

      .pipeline-module__operator-search {
        margin-bottom: var(--space-lg, 1rem);
      }

      .pipeline-module__operator-search input {
        width: 100%;
        padding: var(--space-md, 0.75rem);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-md, 0.375rem);
        font-size: var(--text-body-sm, 0.875rem);
        background: var(--jt-input-bg, var(--color-surface, #ffffff));
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__operator-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg, 1rem);
      }

      .pipeline-module__operator-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs, 0.25rem);
      }

      .pipeline-module__operator-ns {
        font-size: var(--text-caption, 0.75rem);
        font-weight: var(--weight-semibold, 600);
        color: var(--color-text-tertiary, #94a3b8);
        padding: var(--space-xs, 0.25rem) 0;
      }

      .pipeline-module__operator-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        background: var(--color-surface, #f8f9fa);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-sm, 0.25rem);
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        width: 100%;
      }

      .pipeline-module__operator-item:hover {
        background: var(--color-surface-elevated, #f1f5f9);
        border-color: var(--color-primary, #2563eb);
      }

      .pipeline-module__operator-id {
        font-family: var(--font-mono, monospace);
        font-size: var(--text-body-sm, 0.875rem);
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__operator-desc {
        font-size: var(--text-caption, 0.75rem);
        color: var(--color-text-tertiary, #94a3b8);
      }

      /* Edit Step Modal */
      .pipeline-module__edit-operator {
        margin-bottom: var(--space-lg, 1rem);
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        background: var(--color-surface, #f8f9fa);
        border-radius: var(--radius-sm, 0.25rem);
      }

      .pipeline-module__edit-operator code {
        font-family: var(--font-mono, monospace);
        font-size: var(--text-body-sm, 0.875rem);
        color: var(--color-primary, #2563eb);
      }

      .pipeline-module__edit-params {
        display: flex;
        flex-direction: column;
        gap: var(--space-md, 0.75rem);
        margin-bottom: var(--space-lg, 1rem);
      }

      .pipeline-module__param-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs, 0.25rem);
      }

      .pipeline-module__param-label {
        display: flex;
        align-items: center;
        gap: var(--space-sm, 0.5rem);
      }

      .pipeline-module__param-name {
        font-family: var(--font-mono, monospace);
        font-size: var(--text-body-sm, 0.875rem);
        font-weight: var(--weight-medium, 500);
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__param-type {
        font-size: var(--text-caption, 0.75rem);
        color: var(--color-text-tertiary, #94a3b8);
        padding: 1px 6px;
        background: var(--color-surface, #f8f9fa);
        border-radius: var(--radius-sm, 0.25rem);
      }

      .pipeline-module__param-input {
        padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-md, 0.375rem);
        font-size: var(--text-body-sm, 0.875rem);
        font-family: var(--font-mono, monospace);
        background: var(--jt-input-bg, var(--color-surface, #ffffff));
        color: var(--color-text, #1e293b);
      }

      .pipeline-module__param-input:focus {
        outline: none;
        border-color: var(--color-primary, #2563eb);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
      }

      .pipeline-module__param-desc {
        font-size: var(--text-caption, 0.75rem);
        color: var(--color-text-tertiary, #94a3b8);
        font-style: italic;
      }

      .pipeline-module__no-params {
        padding: var(--space-lg, 1rem);
        text-align: center;
        color: var(--color-text-tertiary, #94a3b8);
        font-size: var(--text-body-sm, 0.875rem);
      }

      .pipeline-module__edit-actions {
        display: flex;
        gap: var(--space-sm, 0.5rem);
        justify-content: flex-end;
        padding-top: var(--space-md, 0.75rem);
        border-top: 1px solid var(--color-border, #e2e8f0);
      }

      .hidden {
        display: none !important;
      }

      @media (max-width: 480px) {
        .pipeline-module__mode {
          width: 100%;
        }

        .pipeline-module__mode-btn {
          flex: 1;
          justify-content: center;
        }

        .pipeline-module__info {
          flex-direction: column;
        }

        .pipeline-module__field input {
          flex: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // Export & Auto-init
  // ============================================
  
  window.PipelineModule = { init, runPipeline, getManifest, buildManifestFromVisual };

  window.addEventListener('jsontoolbox:tabchange', (e) => {
    if (e.detail.tab === 'pipeline') {
      init();
    }
  });

  if (document.querySelector('.json-toolbox__tab--active[data-tab="pipeline"]')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

})();
