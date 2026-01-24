/**
 * JSON Toolbox - Self-Hosted Analytics Module
 * Version: 2.0.0
 * 
 * Privacy-first analytics using self-hosted Matomo.
 * 
 * IMPORTANT: Analytics are OFF by default (opt-in model).
 * To enable analytics, set window.JSON_TOOLBOX_ANALYTICS = true BEFORE this script loads.
 * 
 * Configuration:
 * - Default OFF (opt-in required)
 * - Cookieless tracking (no client-side cookies)
 * - No user identifiers
 * - No fingerprinting
 * - No session replay
 * - No third-party calls
 * - Self-hosted only (stats.mackan.eu)
 * 
 * Compliance Mode:
 * - When window.JSON_TOOLBOX_COMPLIANCE = true, analytics are completely disabled
 * - No network calls, no tracking, no-op API only
 * 
 * Purpose (when enabled):
 * - Aggregate feature usage (which tabs/functions are used)
 * - Error analysis (what operations fail)
 * - Quality improvement (no profiling, no personalization)
 */

(function() {
  'use strict';

  // ============================================
  // No-op API (used when analytics disabled)
  // ============================================
  const NOOP_API = {
    trackPageView: () => {},
    trackEvent: () => {},
    trackTabChange: () => {},
    trackAction: () => {},
    trackError: () => {},
    trackSuccess: () => {},
    trackThemeChange: () => {},
    trackLanguageChange: () => {},
    trackModal: () => {},
    trackDownload: () => {},
    trackCopy: () => {},
    trackShortcut: () => {},
    isEnabled: () => false,
    enable: enableAnalytics,
    disable: disableAnalytics
  };

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    url: 'https://stats.mackan.eu/',
    siteId: 1,
    enabled: false,  // Default OFF
    debug: false
  };

  // ============================================
  // Compliance Mode Check (highest priority)
  // ============================================
  
  if (window.JSON_TOOLBOX_COMPLIANCE === true) {
    console.info('[Analytics] Compliance mode active - analytics completely disabled');
    window.JSONToolboxAnalytics = NOOP_API;
    window.JTA = NOOP_API;
    return;
  }

  // ============================================
  // Default-OFF Check (opt-in model)
  // ============================================
  
  // Analytics are OFF by default. User must explicitly enable.
  if (window.JSON_TOOLBOX_ANALYTICS !== true) {
    console.info('[Analytics] Analytics disabled (default-off). Set JSON_TOOLBOX_ANALYTICS=true to enable.');
    window.JSONToolboxAnalytics = NOOP_API;
    window.JTA = NOOP_API;
    return;
  }

  // ============================================
  // Analytics Enabled - Initialize Matomo
  // ============================================
  
  console.info('[Analytics] Analytics enabled by user opt-in');
  CONFIG.enabled = true;
  
  var _paq = window._paq = window._paq || [];
  
  // Privacy configuration - MUST be set before tracker loads
  _paq.push(['disableCookies']);                    // No cookies
  _paq.push(['setDoNotTrack', true]);               // Respect DNT header
  _paq.push(['disableBrowserFeatureDetection']);    // No fingerprinting
  
  // Additional privacy hardening
  _paq.push(['setRequestMethod', 'POST']);          // Use POST for privacy
  _paq.push(['setCustomUrl', window.location.pathname]); // No query params
  _paq.push(['setDocumentTitle', 'JSON Toolbox']); // Generic title
  
  // Initial page view
  _paq.push(['trackPageView']);
  
  // Enable link tracking (for downloads only)
  _paq.push(['enableLinkTracking']);
  
  // Load tracker asynchronously
  (function() {
    var u = CONFIG.url;
    _paq.push(['setTrackerUrl', u + 'matomo.php']);
    _paq.push(['setSiteId', CONFIG.siteId]);
    
    var d = document;
    var g = d.createElement('script');
    var s = d.getElementsByTagName('script')[0];
    g.async = true;
    g.src = u + 'matomo.js';
    
    // Handle load errors gracefully (e.g., blocked by ad blocker)
    g.onerror = function() {
      console.info('[Analytics] Tracker load failed (expected in some environments)');
      CONFIG.enabled = false;
    };
    
    if (s && s.parentNode) {
      s.parentNode.insertBefore(g, s);
    }
  })();

  // ============================================
  // Safe Push Helper
  // ============================================
  
  /**
   * Safely push to Matomo queue
   * @param {...any} args - Arguments to push
   */
  function safePush(...args) {
    if (!CONFIG.enabled) return;
    
    try {
      if (typeof _paq !== 'undefined' && Array.isArray(_paq)) {
        _paq.push(args);
        if (CONFIG.debug) {
          console.log('[Analytics]', ...args);
        }
      }
    } catch (e) {
      // Fail silently - analytics should never break the app
      if (CONFIG.debug) {
        console.warn('[Analytics] Push failed:', e);
      }
    }
  }

  // ============================================
  // Event Categories
  // ============================================
  const CATEGORY = {
    TOOL: 'json-toolbox',
    TAB: 'tab',
    ACTION: 'action',
    UI: 'ui',
    ERROR: 'error'
  };

  // ============================================
  // Enable/Disable Functions
  // ============================================
  
  /**
   * Enable analytics (requires page reload to take effect)
   */
  function enableAnalytics() {
    if (window.JSON_TOOLBOX_COMPLIANCE) {
      console.warn('[Analytics] Cannot enable analytics in compliance mode');
      return false;
    }
    try {
      localStorage.setItem('json-toolbox-analytics-enabled', 'true');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Disable analytics (requires page reload to take effect)
   */
  function disableAnalytics() {
    try {
      localStorage.removeItem('json-toolbox-analytics-enabled');
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // Public API
  // ============================================
  
  /**
   * Track a page view (rarely needed - initial load only)
   * @param {string} path - Optional custom path
   */
  function trackPageView(path) {
    if (path) {
      safePush('setCustomUrl', path);
    }
    safePush('trackPageView');
  }

  /**
   * Track a custom event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {string} name - Event name/label
   * @param {number} value - Optional numeric value
   */
  function trackEvent(category, action, name, value) {
    const args = ['trackEvent', category, action, name];
    if (typeof value === 'number') {
      args.push(value);
    }
    safePush(...args);
  }

  /**
   * Track tab/module change
   * @param {string} tabId - The tab identifier (csv, xml, yaml, etc.)
   */
  function trackTabChange(tabId) {
    trackEvent(CATEGORY.TAB, 'switch', tabId);
  }

  /**
   * Track action trigger (convert, format, validate, etc.)
   * @param {string} module - Module name (csv, format, validate, etc.)
   * @param {string} action - Action name (convert, format, minify, etc.)
   * @param {string} variant - Optional variant (e.g., "csv-to-json", "json-to-csv")
   */
  function trackAction(module, action, variant) {
    const name = variant ? `${action}:${variant}` : action;
    trackEvent(CATEGORY.ACTION, module, name);
  }

  /**
   * Track an error occurrence
   * @param {string} module - Module where error occurred
   * @param {string} errorType - Type of error (parse, validation, etc.)
   */
  function trackError(module, errorType) {
    trackEvent(CATEGORY.ERROR, module, errorType);
  }

  /**
   * Track a successful operation
   * @param {string} module - Module name
   * @param {string} operation - Operation performed
   * @param {number} itemCount - Optional count (e.g., rows converted)
   */
  function trackSuccess(module, operation, itemCount) {
    trackEvent(CATEGORY.ACTION, `${module}:success`, operation, itemCount);
  }

  /**
   * Track theme change
   * @param {string} theme - 'light' or 'dark'
   */
  function trackThemeChange(theme) {
    trackEvent(CATEGORY.UI, 'theme', theme);
  }

  /**
   * Track language change
   * @param {string} lang - Language code (sv, en)
   */
  function trackLanguageChange(lang) {
    trackEvent(CATEGORY.UI, 'language', lang);
  }

  /**
   * Track modal open/close
   * @param {string} modalName - Name of modal
   * @param {string} action - 'open' or 'close'
   */
  function trackModal(modalName, action) {
    trackEvent(CATEGORY.UI, 'modal', `${modalName}:${action}`);
  }

  /**
   * Track download action
   * @param {string} module - Module name
   * @param {string} format - File format downloaded
   */
  function trackDownload(module, format) {
    trackEvent(CATEGORY.ACTION, 'download', `${module}:${format}`);
  }

  /**
   * Track copy action
   * @param {string} module - Module name
   */
  function trackCopy(module) {
    trackEvent(CATEGORY.ACTION, 'copy', module);
  }

  /**
   * Track keyboard shortcut usage
   * @param {string} shortcut - Shortcut used
   */
  function trackShortcut(shortcut) {
    trackEvent(CATEGORY.UI, 'shortcut', shortcut);
  }

  /**
   * Check if analytics is enabled
   * @returns {boolean}
   */
  function isEnabled() {
    return CONFIG.enabled;
  }

  // ============================================
  // Export Public API
  // ============================================
  
  window.JSONToolboxAnalytics = {
    trackPageView,
    trackEvent,
    trackTabChange,
    trackAction,
    trackError,
    trackSuccess,
    trackThemeChange,
    trackLanguageChange,
    trackModal,
    trackDownload,
    trackCopy,
    trackShortcut,
    isEnabled,
    enable: enableAnalytics,
    disable: disableAnalytics
  };

  // Shorthand alias
  window.JTA = window.JSONToolboxAnalytics;

})();
