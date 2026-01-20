/**
 * JSON Toolbox - Main Script
 * Version: 1.0.0
 * 
 * Handles:
 * - Tab navigation with keyboard support
 * - URL hash routing
 * - Local storage persistence
 * - Clear saved data functionality
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

  /**
   * Handle global keyboard shortcuts
   * @param {KeyboardEvent} event
   */
  function handleGlobalKeydown(event) {
    // Don't trigger shortcuts when typing in inputs
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    
    // Escape to close help modal
    if (event.key === 'Escape' && helpModalOpen) {
      closeHelpModal();
      return;
    }

    // ? to show keyboard shortcuts help (Shift+/ on most keyboards)
    if ((event.key === '?' || (event.shiftKey && event.key === '/')) && !isInputFocused) {
      event.preventDefault();
      toggleHelpModal();
      return;
    }

    // Ctrl+1-9 for quick tab switching
    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
      const num = parseInt(event.key, 10);
      if (num >= 1 && num <= 9 && num <= VALID_TABS.length) {
        event.preventDefault();
        // Analytics: track shortcut
        if (window.JTA) {
          window.JTA.trackShortcut('ctrl+' + num);
        }
        switchTab(VALID_TABS[num - 1]);
        return;
      }
    }

    // Tab/Shift+Tab to cycle tabs (when not in input)
    if (event.key === 'Tab' && event.shiftKey && event.ctrlKey) {
      event.preventDefault();
      const currentIndex = VALID_TABS.indexOf(currentTab);
      const newIndex = currentIndex > 0 ? currentIndex - 1 : VALID_TABS.length - 1;
      switchTab(VALID_TABS[newIndex]);
    } else if (event.key === 'Tab' && event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      const currentIndex = VALID_TABS.indexOf(currentTab);
      const newIndex = currentIndex < VALID_TABS.length - 1 ? currentIndex + 1 : 0;
      switchTab(VALID_TABS[newIndex]);
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
          { keys: 'Ctrl+Enter', desc: window.i18n?.shortcut_run || 'Run current operation', icon: 'play' },
          { keys: 'Ctrl+Shift+C', desc: window.i18n?.shortcut_copy || 'Copy output', icon: 'copy' },
          { keys: 'Ctrl+Shift+V', desc: window.i18n?.shortcut_paste || 'Paste to input', icon: 'clipboard-paste' },
        ]
      },
      {
        title: window.i18n?.shortcut_group_general || 'General',
        icon: 'settings',
        shortcuts: [
          { keys: '?', desc: window.i18n?.shortcut_help || 'Show keyboard shortcuts', icon: 'help-circle' },
          { keys: 'Escape', desc: window.i18n?.shortcut_close || 'Close modal/dialog', icon: 'x' },
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
  // Local Storage
  // ============================================

  /**
   * Save data to localStorage
   * @param {string} key - Storage key (without prefix)
   * @param {*} value - Value to store
   */
  function saveToStorage(key, value) {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      // Check size limit (~1MB per tab)
      if (data.length > 1024 * 1024) {
        console.warn('JSON Toolbox: Data too large to save (>1MB)');
        return false;
      }
      localStorage.setItem(STORAGE_PREFIX + key, data);
      return true;
    } catch (e) {
      console.error('JSON Toolbox: Could not save to localStorage', e);
      return false;
    }
  }

  /**
   * Load data from localStorage
   * @param {string} key - Storage key (without prefix)
   * @param {*} defaultValue - Default if not found
   * @returns {*} Stored value or default
   */
  function loadFromStorage(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      if (data === null) return defaultValue;
      
      // Try to parse as JSON, fallback to raw string
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (e) {
      console.error('JSON Toolbox: Could not load from localStorage', e);
      return defaultValue;
    }
  }

  /**
   * Clear all saved data
   */
  function clearAllStorage() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
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
      
      return true;
    } catch (e) {
      console.error('JSON Toolbox: Could not clear localStorage', e);
      return false;
    }
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
    getTabs: () => [...VALID_TABS]
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
