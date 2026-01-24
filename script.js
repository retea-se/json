/**
 * JSON Toolbox - Main Script
 * Version: 2.0.0
 * 
 * Handles:
 * - Tab navigation with keyboard support
 * - URL hash routing
 * - Local storage persistence (with compliance mode support)
 * - Clear saved data functionality
 * - Compliance mode (Phase0: Trust Repair)
 */

(function() {
  'use strict';

  // ============================================
  // Constants
  // ============================================
  const STORAGE_PREFIX = 'json-toolbox-';
  const DEFAULT_TAB = 'csv';
  const VALID_TABS = window.jsonToolboxTabs || [
    'csv', 'css', 'xml', 'yaml', 'format', 'validate', 
    'fix', 'diff', 'query', 'schema', 'transform', 'utilities', 'tree'
  ];

  // ============================================
  // Compliance Mode Detection (Phase0: Trust Repair)
  // ============================================
  const COMPLIANCE_MODE = window.JSON_TOOLBOX_COMPLIANCE === true;
  
  if (COMPLIANCE_MODE) {
    console.info('[JSON Toolbox] Running in compliance mode - no persistent storage');
  }

  // ============================================
  // StorageAdapter (Phase0: Trust Repair)
  // Compliance-aware storage abstraction
  // ============================================
  const StorageAdapter = {
    /**
     * Get value from storage
     * @param {string} key - Key (without prefix)
     * @param {*} defaultValue - Default if not found
     * @returns {*} Value or default
     */
    get(key, defaultValue = null) {
      if (COMPLIANCE_MODE) {
        return defaultValue;
      }
      try {
        const data = localStorage.getItem(STORAGE_PREFIX + key);
        if (data === null) return defaultValue;
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      } catch (e) {
        console.error('[StorageAdapter] Read error:', e);
        return defaultValue;
      }
    },

    /**
     * Set value in storage
     * @param {string} key - Key (without prefix)
     * @param {*} value - Value to store
     * @returns {boolean} Success
     */
    set(key, value) {
      if (COMPLIANCE_MODE) {
        return true; // Silently succeed but don't persist
      }
      try {
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        // Check size limit (~1MB per key)
        if (data.length > 1024 * 1024) {
          console.warn('[StorageAdapter] Data too large (>1MB)');
          return false;
        }
        localStorage.setItem(STORAGE_PREFIX + key, data);
        return true;
      } catch (e) {
        console.error('[StorageAdapter] Write error:', e);
        return false;
      }
    },

    /**
     * Remove value from storage
     * @param {string} key - Key (without prefix)
     * @returns {boolean} Success
     */
    remove(key) {
      if (COMPLIANCE_MODE) {
        return true;
      }
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
        return true;
      } catch (e) {
        console.error('[StorageAdapter] Remove error:', e);
        return false;
      }
    },

    /**
     * Clear all JSON Toolbox storage
     * @returns {boolean} Success
     */
    clearAll() {
      if (COMPLIANCE_MODE) {
        return true;
      }
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        return true;
      } catch (e) {
        console.error('[StorageAdapter] Clear error:', e);
        return false;
      }
    },

    /**
     * Check if in compliance mode
     * @returns {boolean}
     */
    isComplianceMode() {
      return COMPLIANCE_MODE;
    }
  };

  // Export StorageAdapter globally for modules
  window.JSONToolboxStorage = StorageAdapter;

  // ============================================
  // State
  // ============================================
  let currentTab = DEFAULT_TAB;
  let initialized = false;

  // ============================================
  // DOM Elements
  // ============================================
  const tabButtons = document.querySelectorAll('.json-toolbox__tab');
  const tabPanels = document.querySelectorAll('.json-toolbox__panel');
  const clearButton = document.getElementById('clearSavedData');

  // ============================================
  // Tab Navigation
  // ============================================
  
  /**
   * Switch to a specific tab
   * @param {string} tabId - The tab identifier
   * @param {boolean} updateHash - Whether to update URL hash
   */
  function switchTab(tabId, updateHash = true) {
    // Validate tab exists
    if (!VALID_TABS.includes(tabId)) {
      tabId = DEFAULT_TAB;
    }

    // Update tab buttons
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('json-toolbox__tab--active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update tab panels
    tabPanels.forEach(panel => {
      const panelId = panel.id.replace('panel-', '');
      const isActive = panelId === tabId;
      panel.classList.toggle('hidden', !isActive);
    });

    // Update state
    currentTab = tabId;

    // Update URL hash
    if (updateHash && window.history && window.history.replaceState) {
      const newUrl = window.location.pathname + window.location.search + '#' + tabId;
      window.history.replaceState(null, '', newUrl);
    }

    // Dispatch custom event for module initialization
    window.dispatchEvent(new CustomEvent('jsontoolbox:tabchange', {
      detail: { tab: tabId }
    }));

    // Analytics: track tab switch
    if (window.JTA) {
      window.JTA.trackTabChange(tabId);
    }
  }

  /**
   * Get tab ID from URL hash
   * @returns {string} Tab ID or default
   */
  function getTabFromHash() {
    const hash = window.location.hash.slice(1); // Remove #
    return VALID_TABS.includes(hash) ? hash : DEFAULT_TAB;
  }

  /**
   * Handle tab button click
   * @param {Event} event
   */
  function handleTabClick(event) {
    const button = event.currentTarget;
    const tabId = button.dataset.tab;
    switchTab(tabId);
  }

  /**
   * Handle keyboard navigation between tabs
   * @param {KeyboardEvent} event
   */
  function handleTabKeydown(event) {
    const currentIndex = VALID_TABS.indexOf(currentTab);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : VALID_TABS.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < VALID_TABS.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = VALID_TABS.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      const newTabId = VALID_TABS[newIndex];
      switchTab(newTabId);
      // Focus the new tab button
      const newTabButton = document.querySelector(`[data-tab="${newTabId}"]`);
      if (newTabButton) {
        newTabButton.focus();
      }
    }
  }

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  let helpModalOpen = false;
  let anyModalOpen = false; // Track any open modal

  /**
   * Handle global keyboard shortcuts
   * @param {KeyboardEvent} event
   */
  function handleGlobalKeydown(event) {
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
    
    // ----------------------------------------
    // Escape - Close modals / reset context
    // ----------------------------------------
    if (event.key === 'Escape') {
      // Close help modal
      if (helpModalOpen) {
        closeHelpModal();
        event.preventDefault();
        return;
      }
      // Close any open modal (send-to menus, sample selectors, etc.)
      const openMenus = document.querySelectorAll('.send-to-menu:not(.hidden), .sample-selector__menu:not(.hidden), .jt-modal-overlay');
      if (openMenus.length > 0) {
        openMenus.forEach(menu => {
          if (menu.classList.contains('jt-modal-overlay')) {
            menu.remove();
          } else {
            menu.classList.add('hidden');
          }
        });
        event.preventDefault();
        return;
      }
      // Blur current input (reset focus)
      if (isInputFocused) {
        document.activeElement.blur();
        event.preventDefault();
        return;
      }
    }

    // ----------------------------------------
    // ? - Show keyboard shortcuts help
    // ----------------------------------------
    if ((event.key === '?' || (event.shiftKey && event.key === '/')) && !isInputFocused) {
      event.preventDefault();
      toggleHelpModal();
      return;
    }

    // ----------------------------------------
    // Cmd/Ctrl+Enter - Run current operation
    // ----------------------------------------
    if (cmdOrCtrl && event.key === 'Enter') {
      event.preventDefault();
      runCurrentOperation();
      return;
    }

    // ----------------------------------------
    // Cmd/Ctrl+K - Clear current tab
    // ----------------------------------------
    if (cmdOrCtrl && event.key === 'k') {
      event.preventDefault();
      clearCurrentTab();
      return;
    }

    // ----------------------------------------
    // Cmd/Ctrl+Shift+V - Smart paste (when not in input)
    // ----------------------------------------
    if (cmdOrCtrl && event.shiftKey && event.key === 'V' && !isInputFocused) {
      event.preventDefault();
      smartPaste();
      return;
    }

    // ----------------------------------------
    // Ctrl+1-9 for quick tab switching
    // ----------------------------------------
    if (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
      const num = parseInt(event.key, 10);
      if (num >= 1 && num <= 9 && num <= VALID_TABS.length) {
        event.preventDefault();
        if (window.JTA) {
          window.JTA.trackShortcut('ctrl+' + num);
        }
        switchTab(VALID_TABS[num - 1]);
        return;
      }
    }

    // ----------------------------------------
    // Ctrl+Tab / Ctrl+Shift+Tab - Cycle tabs
    // ----------------------------------------
    if (event.key === 'Tab' && event.ctrlKey) {
      event.preventDefault();
      const currentIndex = VALID_TABS.indexOf(currentTab);
      const newIndex = event.shiftKey
        ? (currentIndex > 0 ? currentIndex - 1 : VALID_TABS.length - 1)
        : (currentIndex < VALID_TABS.length - 1 ? currentIndex + 1 : 0);
      switchTab(VALID_TABS[newIndex]);
    }
  }

  /**
   * Run the current tab's primary operation
   */
  function runCurrentOperation() {
    // Find and click the primary action button for the current tab
    const panel = document.getElementById(`panel-${currentTab}`);
    if (!panel) return;

    // Look for primary buttons in order of priority
    const primaryBtn = panel.querySelector(
      '[id$="ConvertBtn"], [id$="RunBtn"], [id$="FormatBtn"], [id$="ValidateBtn"], ' +
      '[id$="FixBtn"], [id$="CompareBtn"], [id$="QueryBtn"], [id$="GenerateBtn"], ' +
      '.json-toolbox__btn--primary, button[type="submit"]'
    );

    if (primaryBtn && !primaryBtn.disabled) {
      primaryBtn.click();
      showStatus(window.i18n?.shortcut_executed || 'Action executed', 'success');
      if (window.JTA) {
        window.JTA.trackShortcut('ctrl+enter');
      }
    }
  }

  /**
   * Clear the current tab's inputs
   */
  function clearCurrentTab() {
    const panel = document.getElementById(`panel-${currentTab}`);
    if (!panel) return;

    // Find and click the clear button
    const clearBtn = panel.querySelector('[id$="ClearBtn"], [id*="Clear"], .csv-module__clear-btn');
    if (clearBtn) {
      clearBtn.click();
      if (window.JTA) {
        window.JTA.trackShortcut('ctrl+k');
      }
    }
  }

  /**
   * Smart paste - paste and auto-detect format
   */
  async function smartPaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      // Find the input textarea for the current tab
      const panel = document.getElementById(`panel-${currentTab}`);
      if (!panel) return;

      const input = panel.querySelector('textarea:not([readonly])') || 
                    panel.querySelector('input[type="text"]');
      
      if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Auto-detect and pretty-print if JSON
        if (isValidJson(text)) {
          try {
            const parsed = JSON.parse(text);
            input.value = JSON.stringify(parsed, null, 2);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          } catch (e) {
            // Keep original text
          }
        }
        
        showStatus(window.i18n?.pasted || 'Pasted', 'success');
        if (window.JTA) {
          window.JTA.trackShortcut('ctrl+shift+v');
        }
      }
    } catch (e) {
      console.warn('Clipboard access denied:', e);
    }
  }

  /**
   * Check if string is valid JSON
   */
  function isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // Keyboard Shortcuts Help Modal
  // ============================================

  function toggleHelpModal() {
    if (helpModalOpen) {
      closeHelpModal();
    } else {
      openHelpModal();
    }
  }

  function openHelpModal() {
    if (document.getElementById('jt-help-modal')) return;

    // Platform-aware key labels
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? '⌘' : 'Ctrl';
    
    // Grouped shortcuts in VSCode style
    const shortcutGroups = [
      {
        title: window.i18n?.shortcut_group_navigation || 'Navigation',
        icon: 'compass',
        shortcuts: [
          { keys: 'Ctrl+1-9', desc: window.i18n?.shortcut_tabs || 'Switch to tab 1-9', icon: 'hash' },
          { keys: 'Ctrl+Tab', desc: window.i18n?.shortcut_next_tab || 'Next tab', icon: 'chevron-right' },
          { keys: 'Ctrl+Shift+Tab', desc: window.i18n?.shortcut_prev_tab || 'Previous tab', icon: 'chevron-left' },
          { keys: '← →', desc: window.i18n?.shortcut_arrows || 'Navigate tabs (when focused)', icon: 'move-horizontal' },
        ]
      },
      {
        title: window.i18n?.shortcut_group_actions || 'Actions',
        icon: 'zap',
        shortcuts: [
          { keys: `${cmdKey}+Enter`, desc: window.i18n?.shortcut_run || 'Run current operation', icon: 'play' },
          { keys: `${cmdKey}+K`, desc: window.i18n?.shortcut_clear || 'Clear inputs', icon: 'trash-2' },
          { keys: `${cmdKey}+Shift+V`, desc: window.i18n?.shortcut_smart_paste || 'Smart paste (auto-format)', icon: 'clipboard-paste' },
          { keys: `${cmdKey}+Shift+C`, desc: window.i18n?.shortcut_copy || 'Copy output', icon: 'copy' },
        ]
      },
      {
        title: window.i18n?.shortcut_group_general || 'General',
        icon: 'settings',
        shortcuts: [
          { keys: '?', desc: window.i18n?.shortcut_help || 'Show keyboard shortcuts', icon: 'help-circle' },
          { keys: 'Escape', desc: window.i18n?.shortcut_close || 'Close modal / reset focus', icon: 'x' },
        ]
      }
    ];

    const modal = document.createElement('div');
    modal.id = 'jt-help-modal';
    modal.className = 'jt-modal-overlay';
    modal.innerHTML = `
      <div class="jt-modal jt-modal--shortcuts">
        <div class="jt-modal__header">
          <h3><i data-lucide="keyboard"></i> ${window.i18n?.shortcuts_title || 'Keyboard Shortcuts'}</h3>
          <button class="jt-modal__close" aria-label="Close">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="jt-modal__body">
          ${shortcutGroups.map(group => `
            <div class="jt-shortcuts-group">
              <div class="jt-shortcuts-group__title">
                <i data-lucide="${group.icon}"></i>
                ${group.title}
              </div>
              <div class="jt-shortcuts-list">
                ${group.shortcuts.map(s => `
                  <div class="jt-shortcut-row">
                    <span class="jt-shortcut-row__label">
                      <i data-lucide="${s.icon}"></i>
                      ${s.desc}
                    </span>
                    <kbd>${s.keys}</kbd>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="jt-modal__footer">
          <small><i data-lucide="info"></i> ${window.i18n?.shortcut_hint || 'Press ? anytime to toggle this help'}</small>
        </div>
      </div>
    `;

    // Initialize Lucide icons in the modal
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [modal] });
    }

    document.body.appendChild(modal);
    helpModalOpen = true;

    // Analytics: track modal open
    if (window.JTA) {
      window.JTA.trackModal('shortcuts', 'open');
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeHelpModal();
    });

    // Close button
    modal.querySelector('.jt-modal__close').addEventListener('click', closeHelpModal);

    // Animate in
    requestAnimationFrame(() => modal.classList.add('jt-modal-overlay--visible'));
  }

  function closeHelpModal() {
    const modal = document.getElementById('jt-help-modal');
    if (modal) {
      modal.classList.remove('jt-modal-overlay--visible');
      setTimeout(() => modal.remove(), 200);
      // Analytics: track modal close
      if (window.JTA) {
        window.JTA.trackModal('shortcuts', 'close');
      }
    }
    helpModalOpen = false;
  }

  // ============================================
  // Local Storage (delegates to StorageAdapter)
  // ============================================

  /**
   * Save data to localStorage (compliance-aware)
   * @param {string} key - Storage key (without prefix)
   * @param {*} value - Value to store
   */
  function saveToStorage(key, value) {
    return StorageAdapter.set(key, value);
  }

  /**
   * Load data from localStorage (compliance-aware)
   * @param {string} key - Storage key (without prefix)
   * @param {*} defaultValue - Default if not found
   * @returns {*} Stored value or default
   */
  function loadFromStorage(key, defaultValue = null) {
    return StorageAdapter.get(key, defaultValue);
  }

  /**
   * Clear all saved data (compliance-aware)
   */
  function clearAllStorage() {
    const success = StorageAdapter.clearAll();
    
    if (success) {
      // Analytics: track clear storage
      if (window.JTA) {
        window.JTA.trackAction('storage', 'clear', 'all');
      }
      
      // Show confirmation
      if (window.i18n && window.i18n.saved_cleared) {
        showStatus(window.i18n.saved_cleared, 'success');
      }
      
      // Dispatch event for modules to reset
      window.dispatchEvent(new CustomEvent('jsontoolbox:storagecleared'));
    }
    
    return success;
  }

  // ============================================
  // Status Messages
  // ============================================

  /**
   * Show a temporary status message
   * @param {string} message - Message to display
   * @param {string} type - 'success' or 'error'
   */
  function showStatus(message, type = 'success') {
    // Remove existing status
    const existing = document.querySelector('.json-toolbox__status--temp');
    if (existing) {
      existing.remove();
    }

    // Create status element
    const status = document.createElement('div');
    status.className = `json-toolbox__status json-toolbox__status--${type} json-toolbox__status--temp`;
    status.textContent = message;
    status.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;';

    document.body.appendChild(status);

    // Remove after 3 seconds
    setTimeout(() => {
      status.style.opacity = '0';
      status.style.transition = 'opacity 0.3s ease';
      setTimeout(() => status.remove(), 300);
    }, 3000);
  }

  // ============================================
  // Hash Change Handler
  // ============================================

  /**
   * Handle browser back/forward navigation
   */
  function handleHashChange() {
    const tabId = getTabFromHash();
    if (tabId !== currentTab) {
      switchTab(tabId, false);
    }
  }

  // ============================================
  // Initialize Tippy Tooltips
  // ============================================

  function initTooltips() {
    if (typeof tippy === 'function') {
      tippy('[data-tippy-content]', {
        placement: 'bottom',
        delay: [300, 0],
        duration: [200, 150]
      });
    }
  }

  // ============================================
  // Initialization
  // ============================================

  function init() {
    if (initialized) return;
    initialized = true;

    // Add click handlers to tab buttons
    tabButtons.forEach(btn => {
      btn.addEventListener('click', handleTabClick);
      btn.addEventListener('keydown', handleTabKeydown);
    });

    // Add clear button handler
    if (clearButton) {
      clearButton.addEventListener('click', clearAllStorage);
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);

    // Hash change listener for back/forward
    window.addEventListener('hashchange', handleHashChange);

    // Initialize to correct tab from URL hash
    const initialTab = getTabFromHash();
    switchTab(initialTab, false);

    // Initialize tooltips after DOM is ready
    setTimeout(initTooltips, 100);

    // Initialize status bar
    initStatusBar();
  }

  // ============================================
  // Lucide Icon Refresh
  // ============================================

  /**
   * Refresh Lucide icons - call after dynamically adding content with icons
   * @param {HTMLElement} container - Optional container to scope icon refresh
   */
  function refreshIcons(container = document) {
    if (window.lucide) {
      window.lucide.createIcons({ nodes: container === document ? undefined : [container] });
    }
  }

  // ============================================
  // Status Bar
  // ============================================

  /**
   * Update status bar mode display
   * @param {string} tabId - Current tab ID
   */
  function updateStatusBarMode(tabId) {
    const modeValue = document.getElementById('statusModeValue');
    if (modeValue) {
      modeValue.textContent = tabId.toUpperCase();
    }
  }

  /**
   * Update status bar output display
   * @param {string} text - Status text
   */
  function updateStatusBarOutput(text) {
    const outputValue = document.getElementById('statusOutputValue');
    if (outputValue) {
      outputValue.textContent = text;
    }
  }

  /**
   * Initialize status bar interactions
   */
  function initStatusBar() {
    // Shortcut button - opens help modal
    const shortcutBtn = document.getElementById('statusShortcuts');
    if (shortcutBtn) {
      shortcutBtn.addEventListener('click', () => {
        toggleHelpModal();
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('statusTheme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        // Save preference
        saveToStorage('theme', newTheme);
        // Analytics: track theme change
        if (window.JTA) {
          window.JTA.trackThemeChange(newTheme);
        }
      });
    }

    // Language toggle
    const langBtn = document.getElementById('statusLang');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const currentUrl = new URL(window.location);
        const currentLang = currentUrl.searchParams.get('lang') || 'sv';
        const newLang = currentLang === 'sv' ? 'en' : 'sv';
        // Analytics: track language change intent
        if (window.JTA) {
          window.JTA.trackLanguageChange(newLang);
        }
        currentUrl.searchParams.set('lang', newLang);
        window.location.href = currentUrl.toString();
      });
    }

    // Update mode on tab change
    window.addEventListener('jsontoolbox:tabchange', (e) => {
      updateStatusBarMode(e.detail.tab);
    });

    // Initialize mode display
    updateStatusBarMode(currentTab);

    // Load saved theme preference
    const savedTheme = loadFromStorage('theme', null);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  // ============================================
  // Helper: Ensure value is a string (for textarea assignment)
  // ============================================
  function ensureString(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    // Object or array - stringify with formatting
    return JSON.stringify(value, null, 2);
  }

  // ============================================
  // Public API
  // ============================================

  window.JSONToolbox = {
    switchTab,
    saveToStorage,
    loadFromStorage,
    clearAllStorage,
    showStatus,
    refreshIcons,
    updateStatusBarOutput,
    ensureString,
    getCurrentTab: () => currentTab,
    getTabs: () => [...VALID_TABS],
    // Phase0: Trust Repair - expose compliance mode status
    isComplianceMode: () => COMPLIANCE_MODE,
    storage: StorageAdapter
  };

  // ============================================
  // Start
  // ============================================

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
