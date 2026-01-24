/**
 * JSON Toolbox - Handoff Module
 * Version: 1.0
 * 
 * Provides cross-module data transfer functionality:
 * - "Send to..." dropdown menu
 * - Storage key mapping between modules
 * - Data format preservation
 */

(function() {
  'use strict';

  // ============================================
  // i18n Helper
  // ============================================
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  // ============================================
  // Storage Key Mapping
  // ============================================
  // Maps tab names to their localStorage input keys
  const STORAGE_KEYS = {
    'format': 'format-input',
    'validate': 'validate-input',
    'fix': 'fix-input',
    'diff': 'diff-input-a',
    'query': 'query-input',
    'transform': 'transform-input',
    'schema': 'schema-input',
    'yaml': 'yaml-input',
    'xml': 'xml-input',
    'csv': 'csv-input',
    'css': 'css-input',
    'pipeline': 'pipeline-input'
  };

  // ============================================
  // Target Definitions
  // ============================================
  // Define available send targets with their metadata
  const ALL_TARGETS = {
    format: { name: 'tab_format', fallback: 'Format', icon: 'indent-increase' },
    validate: { name: 'tab_validate', fallback: 'Validate', icon: 'check-circle' },
    fix: { name: 'tab_fix', fallback: 'Fix', icon: 'wrench' },
    diff: { name: 'tab_diff', fallback: 'Diff', icon: 'git-compare' },
    query: { name: 'tab_query', fallback: 'Query', icon: 'search' },
    transform: { name: 'tab_transform', fallback: 'Transform', icon: 'shuffle' },
    schema: { name: 'tab_schema', fallback: 'Schema', icon: 'file-json' },
    yaml: { name: 'tab_yaml', fallback: 'YAML', icon: 'file-text' },
    xml: { name: 'tab_xml', fallback: 'XML', icon: 'file-code' },
    csv: { name: 'tab_csv', fallback: 'CSV', icon: 'table' },
    css: { name: 'tab_css', fallback: 'CSS', icon: 'palette' },
    pipeline: { name: 'tab_pipeline', fallback: 'Pipeline', icon: 'git-branch' }
  };

  // ============================================
  // Get Targets for Module
  // ============================================
  /**
   * Get relevant send-to targets for a specific module
   * @param {string} sourceModule - The source module name
   * @returns {Array} Array of target objects
   */
  function getTargetsForModule(sourceModule) {
    // Define which targets make sense for each source
    const targetMap = {
      // JSON output modules -> JSON consumers
      format: ['validate', 'fix', 'transform', 'query', 'schema', 'pipeline', 'yaml', 'xml'],
      validate: ['format', 'fix', 'transform', 'query', 'schema', 'pipeline'],
      fix: ['format', 'validate', 'transform', 'query', 'schema', 'pipeline'],
      query: ['format', 'validate', 'fix', 'transform', 'schema', 'pipeline'],
      transform: ['format', 'validate', 'fix', 'query', 'schema', 'pipeline'],
      schema: ['format', 'validate', 'pipeline'],
      
      // Conversion modules
      yaml: ['format', 'validate', 'transform', 'query', 'pipeline'],
      xml: ['format', 'validate', 'transform', 'query', 'pipeline'],
      csv: ['format', 'validate', 'transform', 'query', 'pipeline'],
      
      // Pipeline can send to most places
      pipeline: ['format', 'validate', 'fix', 'transform', 'query'],
      
      // Diff is special - usually outputs comparison, not data
      diff: ['format', 'validate'],
      
      // CSS is standalone
      css: ['format']
    };

    const targetIds = targetMap[sourceModule] || ['format', 'validate'];
    
    return targetIds.map(id => ({
      id,
      name: t(ALL_TARGETS[id].name, ALL_TARGETS[id].fallback),
      icon: ALL_TARGETS[id].icon
    }));
  }

  // ============================================
  // Show Send-To Dropdown
  // ============================================
  /**
   * Show the send-to dropdown menu
   * @param {HTMLElement} anchorElement - Button to anchor the dropdown to
   * @param {string} sourceModule - The source module name
   * @param {string} data - The data to send
   * @param {Function} onSuccess - Callback on successful send
   */
  function showSendToDropdown(anchorElement, sourceModule, data, onSuccess) {
    // Remove any existing dropdown
    closeAllDropdowns();

    if (!data) {
      showStatus(t('no_output', 'No output to send'), 'error');
      return;
    }

    const targets = getTargetsForModule(sourceModule);
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'send-to-menu';
    dropdown.setAttribute('role', 'menu');
    dropdown.innerHTML = `
      <div class="send-to-menu__header">
        <span>${t('send_to', 'Send to')}...</span>
      </div>
      <div class="send-to-menu__items">
        ${targets.map(target => `
          <button type="button" class="send-to-menu__item" data-target="${target.id}" role="menuitem">
            <i data-lucide="${target.icon}"></i>
            <span>${target.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Position dropdown
    const rect = anchorElement.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.zIndex = '1000';

    // Bind item clicks
    dropdown.querySelectorAll('.send-to-menu__item').forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.target;
        sendDataToTab(targetTab, data, sourceModule);
        closeAllDropdowns();
        if (onSuccess) onSuccess(targetTab);
      });
    });

    // Add to DOM
    document.body.appendChild(dropdown);

    // Refresh icons
    if (window.JSONToolbox?.refreshIcons) {
      window.JSONToolbox.refreshIcons(dropdown);
    }

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);
    }, 10);

    // Adjust position if off-screen
    requestAnimationFrame(() => {
      const dropdownRect = dropdown.getBoundingClientRect();
      if (dropdownRect.right > window.innerWidth) {
        dropdown.style.left = `${rect.right - dropdownRect.width}px`;
      }
      if (dropdownRect.bottom > window.innerHeight) {
        dropdown.style.top = `${rect.top - dropdownRect.height - 4}px`;
      }
    });
  }

  // ============================================
  // Send Data to Tab
  // ============================================
  /**
   * Send data to a target tab
   * @param {string} targetTab - The target tab name
   * @param {string} data - The data to send
   * @param {string} sourceModule - The source module for analytics
   */
  function sendDataToTab(targetTab, data, sourceModule) {
    const storageKey = STORAGE_KEYS[targetTab];
    
    if (!storageKey) {
      showStatus(t('unknown_target', 'Unknown target'), 'error');
      return;
    }

    if (window.JSONToolbox) {
      // Save data to target's storage key
      window.JSONToolbox.saveToStorage(storageKey, data);
      
      // Switch to target tab
      window.JSONToolbox.switchTab(targetTab);
      
      // Analytics
      if (window.JTA) {
        window.JTA.trackEvent('handoff', 'send_to', {
          source: sourceModule,
          target: targetTab
        });
      }

      showStatus(
        t('sent_to_tab', 'Sent to {tab}').replace('{tab}', t(`tab_${targetTab}`, targetTab)),
        'success'
      );
    }
  }

  // ============================================
  // Close Dropdowns
  // ============================================
  function closeAllDropdowns() {
    document.querySelectorAll('.send-to-menu').forEach(menu => menu.remove());
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleEscapeKey);
  }

  function handleOutsideClick(e) {
    if (!e.target.closest('.send-to-menu') && !e.target.closest('[id$="SendToBtn"]')) {
      closeAllDropdowns();
    }
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  }

  // ============================================
  // Status Helper
  // ============================================
  function showStatus(message, type = 'success') {
    if (window.JSONToolbox?.showStatus) {
      window.JSONToolbox.showStatus(message, type);
    }
  }

  // ============================================
  // Export API
  // ============================================
  window.JSONToolboxHandoff = {
    showSendToDropdown,
    sendDataToTab,
    closeAllDropdowns,
    getTargetsForModule,
    STORAGE_KEYS
  };

})();
