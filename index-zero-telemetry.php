<?php
/**
 * JSON Toolbox - Zero-Telemetry Build Entry Point
 * Version: 2.0.0
 * 
 * This entry point is for air-gapped and enterprise deployments where
 * NO analytics code should be present at all.
 * 
 * Usage:
 * - Deploy this file as index.php in air-gapped environments
 * - Or access directly: /tools/json/index-zero-telemetry.php
 * 
 * Guarantees:
 * - NO analytics script is loaded
 * - NO network calls are made (beyond initial page load)
 * - NO external dependencies (CDN, fonts, APIs)
 * - Fully offline-capable after first load
 * - Compliance mode is automatically enabled
 * 
 * See COMPLIANCE.md for full documentation.
 */

// Force zero-telemetry mode
putenv('JSON_TOOLBOX_ZERO_TELEMETRY=true');

// Force compliance mode (no localStorage either)
putenv('JSON_TOOLBOX_COMPLIANCE=true');

// Include the main application
require_once __DIR__ . '/index.php';
