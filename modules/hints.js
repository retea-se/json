/**
 * JSON Toolbox - Hints Module
 * Version: 1.0
 * 
 * Provides contextual hints, tips, and workflow guidance:
 * - Inline hints for empty states
 * - "What can I do here?" tooltips
 * - Example workflow suggestions
 * - First-time user onboarding
 */

(function() {
  'use strict';

  // ============================================
  // i18n Helper
  // ============================================
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  // ============================================
  // Hint Definitions
  // ============================================
  const HINTS = {
    format: {
      title: 'Format JSON',
      description: 'Beautify, minify, or sort your JSON data with customizable indentation.',
      quickTips: [
        'Use <kbd>Ctrl+Enter</kbd> to format quickly',
        'Try "Canonical" preset for consistent output',
        'Sorted keys help with diff comparisons'
      ],
      workflows: [
        { name: 'Format & Validate', steps: ['Paste JSON', 'Click Format', 'Send to Validate'] },
        { name: 'Minify for API', steps: ['Paste JSON', 'Select "None (minified)"', 'Copy output'] }
      ]
    },
    validate: {
      title: 'Validate JSON',
      description: 'Check JSON syntax and optionally validate against a JSON Schema.',
      quickTips: [
        'Schema validation is optional but powerful',
        'Error messages show exact line and column',
        'Invalid JSON? Send to Fix tab for repair'
      ],
      workflows: [
        { name: 'Validate & Fix', steps: ['Paste JSON', 'Click Validate', 'If invalid, Send to Fix'] },
        { name: 'Schema Validation', steps: ['Paste JSON', 'Expand Schema section', 'Paste JSON Schema', 'Validate'] }
      ]
    },
    fix: {
      title: 'Fix JSON',
      description: 'Automatically repair common JSON errors like trailing commas and unquoted keys.',
      quickTips: [
        'Works on copy-pasted JavaScript objects',
        'Removes comments automatically',
        'Converts Python True/False/None'
      ],
      workflows: [
        { name: 'Fix API Response', steps: ['Paste broken JSON', 'Click Repair', 'Copy fixed output'] },
        { name: 'JS Object to JSON', steps: ['Copy JS object literal', 'Paste and Repair', 'Get valid JSON'] }
      ]
    },
    csv: {
      title: 'CSV ↔ JSON',
      description: 'Convert between CSV and JSON formats with flexible delimiter options.',
      quickTips: [
        'First row becomes object keys by default',
        'Supports custom delimiters (tab, semicolon)',
        'JSON output can be sent to other tools'
      ],
      workflows: [
        { name: 'Excel to JSON', steps: ['Copy from Excel', 'Paste CSV', 'Convert to JSON'] },
        { name: 'JSON to Spreadsheet', steps: ['Paste JSON array', 'Switch to JSON→CSV', 'Copy CSV'] }
      ]
    },
    yaml: {
      title: 'YAML ↔ JSON',
      description: 'Convert between YAML and JSON formats for configuration files.',
      quickTips: [
        'Great for Kubernetes/Docker configs',
        'Preserves structure and types',
        'Flow style creates compact YAML'
      ],
      workflows: [
        { name: 'Edit Config', steps: ['Paste YAML', 'Convert to JSON', 'Edit in tree view', 'Convert back'] },
        { name: 'API to Config', steps: ['Paste JSON response', 'Convert to YAML', 'Save as config file'] }
      ]
    },
    xml: {
      title: 'XML ↔ JSON',
      description: 'Convert between XML and JSON formats preserving attributes.',
      quickTips: [
        'Attributes prefixed with @ symbol',
        'Text content in #text property',
        'Compact mode for cleaner output'
      ],
      workflows: [
        { name: 'Parse RSS', steps: ['Paste RSS/XML', 'Convert to JSON', 'Query with JSONPath'] },
        { name: 'Generate XML', steps: ['Create JSON structure', 'Convert to XML', 'Download'] }
      ]
    },
    query: {
      title: 'Query JSON',
      description: 'Extract data from JSON using JSONPath expressions.',
      quickTips: [
        '$.store.book[*].author - all authors',
        '$..price - all prices at any depth',
        '$..[?(@.price<10)] - filter by condition'
      ],
      workflows: [
        { name: 'Extract Data', steps: ['Paste JSON', 'Write JSONPath query', 'Get matching results'] },
        { name: 'Filter Array', steps: ['Paste array', 'Use filter expression', 'Get subset'] }
      ]
    },
    transform: {
      title: 'Transform JSON',
      description: 'Apply transformations like sorting, filtering, flattening, and more.',
      quickTips: [
        'Sort arrays by any property',
        'Flatten nested structures',
        'Remove duplicate values'
      ],
      workflows: [
        { name: 'Sort Data', steps: ['Paste JSON array', 'Select Sort', 'Choose sort key'] },
        { name: 'Deduplicate', steps: ['Paste array', 'Select Unique', 'Get unique values'] }
      ]
    },
    schema: {
      title: 'Generate Schema',
      description: 'Create JSON Schema from example JSON data.',
      quickTips: [
        'Great for API documentation',
        'Schema can validate future data',
        'Infers types from sample values'
      ],
      workflows: [
        { name: 'Document API', steps: ['Paste API response', 'Generate Schema', 'Export schema'] },
        { name: 'Create Validator', steps: ['Paste example JSON', 'Generate Schema', 'Use in Validate tab'] }
      ]
    },
    diff: {
      title: 'Compare JSON',
      description: 'Find differences between two JSON documents.',
      quickTips: [
        'Highlights added/removed/changed values',
        'Works with objects and arrays',
        'Use for debugging API changes'
      ],
      workflows: [
        { name: 'Compare Versions', steps: ['Paste old JSON (left)', 'Paste new JSON (right)', 'See differences'] },
        { name: 'Debug API', steps: ['Paste expected response', 'Paste actual response', 'Find mismatches'] }
      ]
    },
    pipeline: {
      title: 'Pipeline',
      description: 'Chain multiple operations together in a reusable workflow.',
      quickTips: [
        'Visual builder for complex workflows',
        'Export pipelines as JSON/YAML',
        'Deterministic: same input = same output'
      ],
      workflows: [
        { name: 'CSV to Sorted JSON', steps: ['Add csv.parse step', 'Add transform.sort step', 'Add json.stringify step'] },
        { name: 'Format & Minify', steps: ['Add json.parse step', 'Add json.stringify (minify)'] }
      ]
    }
  };

  // ============================================
  // Render Hint Panel
  // ============================================
  function createHintPanel(moduleId) {
    const hint = HINTS[moduleId];
    if (!hint) return null;

    const panel = document.createElement('div');
    panel.className = 'hints-panel';
    panel.innerHTML = `
      <div class="hints-panel__header">
        <i data-lucide="lightbulb" class="hints-panel__icon"></i>
        <span class="hints-panel__title">${hint.title}</span>
        <button type="button" class="hints-panel__close" aria-label="Close hints">
          <i data-lucide="x"></i>
        </button>
      </div>
      <p class="hints-panel__description">${hint.description}</p>
      
      <div class="hints-panel__section">
        <h4 class="hints-panel__section-title">
          <i data-lucide="zap"></i>
          ${t('hints_quick_tips', 'Quick Tips')}
        </h4>
        <ul class="hints-panel__tips">
          ${hint.quickTips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>

      <div class="hints-panel__section">
        <h4 class="hints-panel__section-title">
          <i data-lucide="workflow"></i>
          ${t('hints_workflows', 'Example Workflows')}
        </h4>
        <div class="hints-panel__workflows">
          ${hint.workflows.map(wf => `
            <div class="hints-panel__workflow">
              <span class="hints-panel__workflow-name">${wf.name}</span>
              <div class="hints-panel__workflow-steps">
                ${wf.steps.map((step, i) => `
                  <span class="hints-panel__step">
                    ${i > 0 ? '<i data-lucide="chevron-right"></i>' : ''}
                    ${step}
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Close button handler
    panel.querySelector('.hints-panel__close').addEventListener('click', () => {
      panel.classList.add('hints-panel--hiding');
      setTimeout(() => panel.remove(), 200);
      // Remember preference
      localStorage.setItem(`hints-hidden-${moduleId}`, 'true');
    });

    return panel;
  }

  // ============================================
  // Show Hint for Module
  // ============================================
  function showHintForModule(moduleId, container) {
    // Check if user dismissed this hint
    if (localStorage.getItem(`hints-hidden-${moduleId}`) === 'true') {
      return;
    }

    // Don't show if there's already content
    const input = container.querySelector('textarea');
    if (input && input.value.trim()) {
      return;
    }

    const panel = createHintPanel(moduleId);
    if (panel) {
      // Insert at the top of the module
      container.insertBefore(panel, container.firstChild);
      
      // Refresh icons
      if (window.JSONToolbox?.refreshIcons) {
        window.JSONToolbox.refreshIcons(panel);
      }
    }
  }

  // ============================================
  // Reset Hints
  // ============================================
  function resetAllHints() {
    Object.keys(HINTS).forEach(moduleId => {
      localStorage.removeItem(`hints-hidden-${moduleId}`);
    });
  }

  // ============================================
  // Add Styles
  // ============================================
  function addStyles() {
    if (document.getElementById('hints-module-styles')) return;

    const style = document.createElement('style');
    style.id = 'hints-module-styles';
    style.textContent = `
      .hints-panel {
        background: linear-gradient(135deg, var(--color-primary-bg, #f0f7ff) 0%, var(--color-surface) 100%);
        border: 1px solid var(--color-primary-light, #bfdbfe);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        margin-bottom: var(--space-xl);
        animation: hintsSlideIn 0.3s ease-out;
      }

      [data-theme="dark"] .hints-panel {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, var(--color-surface) 100%);
        border-color: rgba(59, 130, 246, 0.3);
      }

      .hints-panel--hiding {
        animation: hintsSlideOut 0.2s ease-in forwards;
      }

      @keyframes hintsSlideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes hintsSlideOut {
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }

      .hints-panel__header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
      }

      .hints-panel__icon {
        width: 20px;
        height: 20px;
        color: var(--color-primary);
      }

      .hints-panel__title {
        font-weight: var(--weight-semibold);
        font-size: var(--text-body-lg);
        color: var(--color-text);
        flex: 1;
      }

      .hints-panel__close {
        background: none;
        border: none;
        padding: var(--space-sm);
        cursor: pointer;
        color: var(--color-text-tertiary);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }

      .hints-panel__close:hover {
        background: var(--color-surface-elevated);
        color: var(--color-text);
      }

      .hints-panel__close i {
        width: 16px;
        height: 16px;
      }

      .hints-panel__description {
        color: var(--color-text-secondary);
        font-size: var(--text-body-sm);
        margin-bottom: var(--space-lg);
        line-height: var(--leading-relaxed);
      }

      .hints-panel__section {
        margin-top: var(--space-lg);
      }

      .hints-panel__section-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        font-size: var(--text-body-sm);
        font-weight: var(--weight-semibold);
        color: var(--color-text);
        margin-bottom: var(--space-md);
      }

      .hints-panel__section-title i {
        width: 14px;
        height: 14px;
        color: var(--color-primary);
      }

      .hints-panel__tips {
        margin: 0;
        padding-left: var(--space-xl);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
      }

      .hints-panel__tips li {
        margin-bottom: var(--space-sm);
      }

      .hints-panel__tips kbd {
        display: inline-block;
        padding: 2px 6px;
        font-family: var(--font-mono);
        font-size: 0.75rem;
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        box-shadow: 0 1px 1px rgba(0,0,0,0.05);
      }

      .hints-panel__workflows {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .hints-panel__workflow {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
      }

      .hints-panel__workflow-name {
        font-weight: var(--weight-medium);
        font-size: var(--text-body-sm);
        color: var(--color-text);
        display: block;
        margin-bottom: var(--space-sm);
      }

      .hints-panel__workflow-steps {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-sm);
      }

      .hints-panel__step {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
      }

      .hints-panel__step i {
        width: 12px;
        height: 12px;
        color: var(--color-text-tertiary);
      }

      /* Help button for showing hints */
      .hints-trigger {
        position: absolute;
        top: var(--space-md);
        right: var(--space-md);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-text-tertiary);
        transition: all var(--transition-fast);
      }

      .hints-trigger:hover {
        background: var(--color-primary-bg);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .hints-trigger i {
        width: 16px;
        height: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // Initialize
  // ============================================
  function init() {
    addStyles();

    // Listen for tab changes to show hints
    window.addEventListener('jsontoolbox:tabchange', (e) => {
      const moduleId = e.detail.tab;
      const container = document.getElementById(`content-${moduleId}`);
      
      // Small delay to let module render
      setTimeout(() => {
        if (container && HINTS[moduleId]) {
          showHintForModule(moduleId, container);
        }
      }, 100);
    });
  }

  // ============================================
  // Export API
  // ============================================
  window.JSONToolboxHints = {
    showHintForModule,
    createHintPanel,
    resetAllHints,
    HINTS
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
