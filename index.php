<!-- tools/json/index.php - JSON Toolbox v2.0.0 -->
<?php
require_once 'lang.php';

// ============================================
// Build Configuration (Phase0: Trust Repair)
// ============================================

// Zero-telemetry build: set to true to completely exclude analytics code
// For air-gapped/enterprise deployments, use index-zero-telemetry.php instead
define('ZERO_TELEMETRY_BUILD', getenv('JSON_TOOLBOX_ZERO_TELEMETRY') === 'true');

// Compliance mode can be activated via:
// 1. URL parameter: ?compliance=1
// 2. Environment variable: JSON_TOOLBOX_COMPLIANCE=true
$complianceMode = isset($_GET['compliance']) || getenv('JSON_TOOLBOX_COMPLIANCE') === 'true';

// Analytics opt-in: user must explicitly enable via localStorage
// This is checked client-side; default is OFF
$analyticsOptIn = false; // Server cannot know; client checks localStorage

$title = t('title');
$metaDescription = t('meta_description');
$keywords = t('keywords');
$canonical = 'https://mackan.eu/tools/json/';
$langSupport = ['sv', 'en'];
$uiLang = $lang;

// Flik-data för generering
$tabs = [
    'csv'       => ['icon' => t('tab_csv_icon'),       'label' => t('tab_csv'),       'tooltip' => t('tab_csv_tooltip')],
    'css'       => ['icon' => t('tab_css_icon'),       'label' => t('tab_css'),       'tooltip' => t('tab_css_tooltip')],
    'xml'       => ['icon' => t('tab_xml_icon'),       'label' => t('tab_xml'),       'tooltip' => t('tab_xml_tooltip')],
    'yaml'      => ['icon' => t('tab_yaml_icon'),      'label' => t('tab_yaml'),      'tooltip' => t('tab_yaml_tooltip')],
    'format'    => ['icon' => t('tab_format_icon'),    'label' => t('tab_format'),    'tooltip' => t('tab_format_tooltip')],
    'validate'  => ['icon' => t('tab_validate_icon'),  'label' => t('tab_validate'),  'tooltip' => t('tab_validate_tooltip')],
    'fix'       => ['icon' => t('tab_fix_icon'),       'label' => t('tab_fix'),       'tooltip' => t('tab_fix_tooltip')],
    'diff'      => ['icon' => t('tab_diff_icon'),      'label' => t('tab_diff'),      'tooltip' => t('tab_diff_tooltip')],
    'query'     => ['icon' => t('tab_query_icon'),     'label' => t('tab_query'),     'tooltip' => t('tab_query_tooltip')],
    'schema'    => ['icon' => t('tab_schema_icon'),    'label' => t('tab_schema'),    'tooltip' => t('tab_schema_tooltip')],
    'transform' => ['icon' => t('tab_transform_icon'), 'label' => t('tab_transform'), 'tooltip' => t('tab_transform_tooltip')],
    'utilities' => ['icon' => t('tab_utilities_icon'), 'label' => t('tab_utilities'), 'tooltip' => t('tab_utilities_tooltip')],
    'tree'      => ['icon' => t('tab_tree_icon'),      'label' => t('tab_tree'),      'tooltip' => t('tab_tree_tooltip')],
    'pipeline'  => ['icon' => 'workflow',              'label' => 'Pipeline',         'tooltip' => t('tab_pipeline_tooltip')],
];

// Strukturerad data för sökmotorer + hreflang
$faqItems = $lang === 'sv' ? [
    ['q' => 'Sparas min data?', 'a' => 'Nej, all bearbetning sker lokalt i din webblasare. Ingen data skickas till nagon server.'],
    ['q' => 'Fungerar verktyget offline?', 'a' => 'Ja, efter forsta laddningen fungerar JSON Toolbox helt offline.'],
    ['q' => 'Vilka format stods?', 'a' => 'JSON, CSV, XML, YAML, CSS. Konvertering i bada riktningarna for de flesta format.'],
    ['q' => 'Finns kortkommandon?', 'a' => 'Ja, tryck ? for att visa alla tangentbordsgenvagar.'],
] : [
    ['q' => 'Is my data stored?', 'a' => 'No, all processing happens locally in your browser. No data is ever sent to any server.'],
    ['q' => 'Does it work offline?', 'a' => 'Yes, after initial load, JSON Toolbox works completely offline.'],
    ['q' => 'What formats are supported?', 'a' => 'JSON, CSV, XML, YAML, CSS. Bidirectional conversion for most formats.'],
    ['q' => 'Are there keyboard shortcuts?', 'a' => 'Yes, press ? to view all keyboard shortcuts.'],
];

$faqSchema = array_map(function($item) {
    return '{
      "@type": "Question",
      "name": "' . htmlspecialchars($item['q'], ENT_QUOTES, 'UTF-8') . '",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "' . htmlspecialchars($item['a'], ENT_QUOTES, 'UTF-8') . '"
      }
    }';
}, $faqItems);

$extraHead = getHreflangTags($canonical, $langSupport) . '
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "' . htmlspecialchars(t('schema_app_name'), ENT_QUOTES, 'UTF-8') . '",
  "description": "' . htmlspecialchars($metaDescription, ENT_QUOTES, 'UTF-8') . '",
  "url": "' . htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') . '",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "browserRequirements": "JavaScript enabled",
  "softwareVersion": "2.0.0",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "SEK"
  },
  "featureList": [
    "CSV to JSON conversion",
    "JSON to CSV conversion",
    "XML to JSON conversion",
    "JSON to XML conversion",
    "YAML to JSON conversion",
    "JSON to YAML conversion",
    "CSS to JSON conversion",
    "JSON formatting and beautification",
    "JSON minification",
    "JSON syntax validation",
    "JSON Schema validation",
    "Broken JSON repair",
    "JSON diff comparison",
    "JSONPath queries",
    "JSON Schema generation",
    "TypeScript interface generation",
    "Go struct generation",
    "Base64 encode/decode",
    "URL encode/decode",
    "Interactive JSON tree view"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1"
  },
  "author": {
    "@type": "Organization",
    "name": "Mackan.eu",
    "url": "https://mackan.eu"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [' . implode(",\n", $faqSchema) . ']
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Mackan.eu",
      "item": "https://mackan.eu"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Verktyg",
      "item": "https://mackan.eu/tools/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "JSON Toolbox",
      "item": "' . htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') . '"
    }
  ]
}
</script>
<meta property="og:title" content="' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '">
<meta property="og:description" content="' . htmlspecialchars($metaDescription, ENT_QUOTES, 'UTF-8') . '">
<meta property="og:url" content="' . htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') . '">
<meta property="og:type" content="website">
<meta property="og:image" content="https://mackan.eu/tools/json/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Mackan.eu">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '">
<meta name="twitter:description" content="' . htmlspecialchars($metaDescription, ENT_QUOTES, 'UTF-8') . '">
<meta name="twitter:image" content="https://mackan.eu/tools/json/og-image.png">
<link rel="stylesheet" href="style.css?v=5">';

include '../../includes/tool-layout-start.php';
?>

<!-- ********** START: JSON Toolbox Interface ********** -->
  <section class="layout__sektion layout__sektion--compact">
    <div class="json-toolbox">
      <!-- Compact Header Bar (UX Layout Pass v1) -->
      <header class="json-toolbox__header">
        <div class="json-toolbox__header-left">
          <h1 class="json-toolbox__title" data-tippy-content="<?= htmlspecialchars(t('lead'), ENT_QUOTES, 'UTF-8') ?>">
            <i data-lucide="braces" class="json-toolbox__title-icon"></i>
            <?= htmlspecialchars(t('h1'), ENT_QUOTES, 'UTF-8') ?>
          </h1>
        </div>
        <div class="json-toolbox__header-right">
          <div class="json-toolbox__privacy" data-tippy-content="<?= htmlspecialchars(t('privacy_tooltip'), ENT_QUOTES, 'UTF-8') ?>">
            <i data-lucide="lock"></i>
            <?= htmlspecialchars(t('privacy_badge'), ENT_QUOTES, 'UTF-8') ?>
          </div>
        </div>
      </header>

      <!-- Tab Navigation with Groups (UX Layout Pass v1) -->
      <nav class="json-toolbox__tabs" role="tablist" aria-label="JSON Toolbox">
        <?php 
        // Define tab groups for semantic organization
        $tabGroups = [
          'convert' => ['csv', 'css', 'xml', 'yaml'],
          'format'  => ['format', 'validate', 'fix'],
          'analyze' => ['diff', 'query', 'schema'],
          'generate' => ['transform', 'utilities', 'tree', 'pipeline']
        ];
        
        $first = true;
        $groupIndex = 0;
        foreach ($tabGroups as $groupName => $groupTabs):
          if ($groupIndex > 0): ?>
            <div class="json-toolbox__tab-separator" aria-hidden="true"></div>
          <?php endif; ?>
          <div class="json-toolbox__tab-group" role="group" aria-label="<?= htmlspecialchars(t('tab_group_' . $groupName), ENT_QUOTES, 'UTF-8') ?>">
          <?php foreach ($groupTabs as $id): 
            $tab = $tabs[$id];
            $activeClass = $first ? ' json-toolbox__tab--active' : '';
            $ariaSelected = $first ? 'true' : 'false';
            $first = false;
          ?>
            <button 
              class="json-toolbox__tab<?= $activeClass ?>" 
              data-tab="<?= htmlspecialchars($id, ENT_QUOTES, 'UTF-8') ?>"
              role="tab"
              aria-selected="<?= $ariaSelected ?>"
              aria-controls="panel-<?= htmlspecialchars($id, ENT_QUOTES, 'UTF-8') ?>"
              id="tab-<?= htmlspecialchars($id, ENT_QUOTES, 'UTF-8') ?>"
              data-tippy-content="<?= htmlspecialchars($tab['tooltip'], ENT_QUOTES, 'UTF-8') ?>"
            >
              <i data-lucide="<?= htmlspecialchars($tab['icon'], ENT_QUOTES, 'UTF-8') ?>" class="json-toolbox__tab-icon"></i>
              <span class="json-toolbox__tab-label"><?= htmlspecialchars($tab['label'], ENT_QUOTES, 'UTF-8') ?></span>
            </button>
          <?php endforeach; ?>
          </div>
        <?php 
          $groupIndex++;
        endforeach; ?>
      </nav>

      <!-- Tab Panels -->
      <div class="json-toolbox__panels">
        <?php 
        $first = true;
        foreach ($tabs as $id => $tab): 
          $hiddenClass = $first ? '' : ' hidden';
          $sectionKey = 'section_' . $id;
          $first = false;
        ?>
        <section 
          id="panel-<?= htmlspecialchars($id, ENT_QUOTES, 'UTF-8') ?>" 
          class="json-toolbox__panel<?= $hiddenClass ?>"
          role="tabpanel"
          aria-labelledby="tab-<?= htmlspecialchars($id, ENT_QUOTES, 'UTF-8') ?>"
          tabindex="0"
        >
          <h2 class="rubrik rubrik--underrubrik"><?= htmlspecialchars(t($sectionKey), ENT_QUOTES, 'UTF-8') ?></h2>
          <div class="json-toolbox__content" id="content-<?= htmlspecialchars($id, ENT_QUOTES, 'UTF-8') ?>">
            <!-- Placeholder - fylls av respektive modul -->
            <div class="json-toolbox__placeholder">
              <i data-lucide="<?= htmlspecialchars($tab['icon'], ENT_QUOTES, 'UTF-8') ?>" class="json-toolbox__placeholder-icon"></i>
              <p class="json-toolbox__placeholder-text"><?= htmlspecialchars(t('coming_soon'), ENT_QUOTES, 'UTF-8') ?></p>
              <p class="json-toolbox__placeholder-desc"><?= htmlspecialchars(t('coming_soon_desc'), ENT_QUOTES, 'UTF-8') ?></p>
            </div>
          </div>
        </section>
        <?php endforeach; ?>
      </div>

      <!-- Status Bar (VSCode-style) -->
      <div class="json-toolbox__statusbar" id="statusBar">
        <div class="json-toolbox__statusbar-section json-toolbox__statusbar-section--left">
          <div class="json-toolbox__statusbar-item json-toolbox__statusbar-item--active" id="statusMode">
            <i data-lucide="code-2" class="json-toolbox__statusbar-icon"></i>
            <span id="statusModeValue">CSV</span>
          </div>
        </div>
        <div class="json-toolbox__statusbar-section json-toolbox__statusbar-section--center">
          <div class="json-toolbox__statusbar-item" id="statusOutput">
            <span id="statusOutputValue"><?= htmlspecialchars(t('status_ready'), ENT_QUOTES, 'UTF-8') ?></span>
          </div>
        </div>
        <div class="json-toolbox__statusbar-section json-toolbox__statusbar-section--right">
          <button class="json-toolbox__statusbar-item json-toolbox__statusbar-item--clickable" id="statusShortcuts" title="<?= htmlspecialchars(t('shortcuts_title'), ENT_QUOTES, 'UTF-8') ?>">
            <i data-lucide="keyboard" class="json-toolbox__statusbar-icon"></i>
            <span class="json-toolbox__statusbar-kbd">?</span>
          </button>
          <div class="json-toolbox__statusbar-divider"></div>
          <button class="json-toolbox__statusbar-item json-toolbox__statusbar-item--clickable" id="statusTheme" title="<?= htmlspecialchars(t('status_theme'), ENT_QUOTES, 'UTF-8') ?>">
            <i data-lucide="sun" class="json-toolbox__statusbar-icon json-toolbox__statusbar-icon--light"></i>
            <i data-lucide="moon" class="json-toolbox__statusbar-icon json-toolbox__statusbar-icon--dark"></i>
          </button>
          <div class="json-toolbox__statusbar-divider"></div>
          <button class="json-toolbox__statusbar-item json-toolbox__statusbar-item--clickable" id="statusLang" title="<?= htmlspecialchars(t('status_lang'), ENT_QUOTES, 'UTF-8') ?>">
            <i data-lucide="globe" class="json-toolbox__statusbar-icon"></i>
            <span><?= strtoupper($lang) ?></span>
          </button>
          <div class="json-toolbox__statusbar-divider"></div>
          <a href="https://github.com/retea-se/json" target="_blank" rel="noopener" class="json-toolbox__statusbar-item json-toolbox__statusbar-item--clickable json-toolbox__statusbar-item--github" title="<?= htmlspecialchars(t('status_github'), ENT_QUOTES, 'UTF-8') ?>">
            <svg class="json-toolbox__statusbar-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer med rensa-knapp -->
  <footer class="json-toolbox__footer layout__sektion text--center">
    <button class="json-toolbox__clear-btn" id="clearSavedData">
      <i data-lucide="trash-2"></i>
      <?= htmlspecialchars(t('clear_saved'), ENT_QUOTES, 'UTF-8') ?>
    </button>
  </footer>
</main>
<!-- ********** SLUT: JSON Toolbox Interface ********** -->

<!-- i18n translations for JavaScript -->
<script>
window.i18n = {
  // Common
  copy: <?= json_encode(t('copy')) ?>,
  copied: <?= json_encode(t('copied')) ?>,
  download: <?= json_encode(t('download')) ?>,
  clear: <?= json_encode(t('clear')) ?>,
  paste: <?= json_encode(t('paste')) ?>,
  convert: <?= json_encode(t('convert')) ?>,
  swap: <?= json_encode(t('swap')) ?>,
  send_to: <?= json_encode(t('send_to')) ?>,
  error: <?= json_encode(t('error')) ?>,
  success: <?= json_encode(t('success')) ?>,
  processing: <?= json_encode(t('processing')) ?>,
  no_input: <?= json_encode(t('no_input')) ?>,
  saved_cleared: <?= json_encode(t('saved_cleared')) ?>,
  
  // Placeholders
  placeholder_json: <?= json_encode(t('placeholder_json')) ?>,
  placeholder_csv: <?= json_encode(t('placeholder_csv')) ?>,
  placeholder_xml: <?= json_encode(t('placeholder_xml')) ?>,
  placeholder_yaml: <?= json_encode(t('placeholder_yaml')) ?>,
  placeholder_css: <?= json_encode(t('placeholder_css')) ?>,
  
  // Keyboard shortcuts
  shortcuts_title: <?= json_encode(t('shortcuts_title')) ?>,
  shortcut_help: <?= json_encode(t('shortcut_help')) ?>,
  shortcut_tabs: <?= json_encode(t('shortcut_tabs')) ?>,
  shortcut_next_tab: <?= json_encode(t('shortcut_next_tab')) ?>,
  shortcut_prev_tab: <?= json_encode(t('shortcut_prev_tab')) ?>,
  shortcut_run: <?= json_encode(t('shortcut_run')) ?>,
  shortcut_close: <?= json_encode(t('shortcut_close')) ?>,
  shortcut_arrows: <?= json_encode(t('shortcut_arrows')) ?>,
  shortcut_hint: <?= json_encode(t('shortcut_hint')) ?>,
  cleared: <?= json_encode(t('cleared')) ?>,
  load_sample: <?= json_encode(t('load_sample')) ?>,
  hints_quick_tips: <?= json_encode(t('hints_quick_tips')) ?>,
  hints_workflows: <?= json_encode(t('hints_workflows')) ?>,
  hints_show: <?= json_encode(t('hints_show')) ?>,
  
  // Error messages
  error_empty_input: <?= json_encode(t('error_empty_input')) ?>,
  error_invalid_json: <?= json_encode(t('error_invalid_json')) ?>,
  error_nothing_to_copy: <?= json_encode(t('error_nothing_to_copy')) ?>,
  error_nothing_to_download: <?= json_encode(t('error_nothing_to_download')) ?>,
  error_copy_failed: <?= json_encode(t('error_copy_failed')) ?>,
  error_paste_failed: <?= json_encode(t('error_paste_failed')) ?>,
  
  // Status bar
  status_theme_light: <?= json_encode(t('status_theme_light')) ?>,
  status_theme_dark: <?= json_encode(t('status_theme_dark')) ?>,
  status_ready: <?= json_encode(t('status_ready')) ?>,
  
  // Transform module
  transform_input: <?= json_encode(t('transform_input')) ?>,
  transform_output: <?= json_encode(t('transform_output')) ?>,
  transform_placeholder: <?= json_encode(t('transform_placeholder')) ?>,
  transform_output_placeholder: <?= json_encode(t('transform_output_placeholder')) ?>,
  transform_type: <?= json_encode(t('transform_type')) ?>,
  transform_root_name: <?= json_encode(t('transform_root_name')) ?>,
  transform_optional: <?= json_encode(t('transform_optional')) ?>,
  transform_export: <?= json_encode(t('transform_export')) ?>,
  transform_generate: <?= json_encode(t('transform_generate')) ?>,
  transform_success: <?= json_encode(t('transform_success')) ?>,
  
  // Utilities module
  utilities_input: <?= json_encode(t('utilities_input')) ?>,
  utilities_output: <?= json_encode(t('utilities_output')) ?>,
  utilities_placeholder: <?= json_encode(t('utilities_placeholder')) ?>,
  utilities_output_placeholder: <?= json_encode(t('utilities_output_placeholder')) ?>,
  utilities_swap: <?= json_encode(t('utilities_swap')) ?>,
  utilities_url_encode: <?= json_encode(t('utilities_url_encode')) ?>,
  utilities_url_decode: <?= json_encode(t('utilities_url_decode')) ?>,
  utilities_url_encode_component: <?= json_encode(t('utilities_url_encode_component')) ?>,
  utilities_base64_encode: <?= json_encode(t('utilities_base64_encode')) ?>,
  utilities_base64_decode: <?= json_encode(t('utilities_base64_decode')) ?>,
  utilities_json_escape: <?= json_encode(t('utilities_json_escape')) ?>,
  utilities_json_unescape: <?= json_encode(t('utilities_json_unescape')) ?>,
  utilities_stringify: <?= json_encode(t('utilities_stringify')) ?>,
  utilities_html_encode: <?= json_encode(t('utilities_html_encode')) ?>,
  utilities_html_decode: <?= json_encode(t('utilities_html_decode')) ?>,
  utilities_unicode_escape: <?= json_encode(t('utilities_unicode_escape')) ?>,
  utilities_unicode_unescape: <?= json_encode(t('utilities_unicode_unescape')) ?>,
  utilities_text: <?= json_encode(t('utilities_text')) ?>,
  utilities_hash: <?= json_encode(t('utilities_hash')) ?>,
  utilities_hash_success: <?= json_encode(t('utilities_hash_success')) ?>,
  utilities_success: <?= json_encode(t('utilities_success')) ?>,
  utilities_unknown_action: <?= json_encode(t('utilities_unknown_action')) ?>,
  
  // Tree module
  tree_input: <?= json_encode(t('tree_input')) ?>,
  tree_placeholder: <?= json_encode(t('tree_placeholder')) ?>,
  tree_view: <?= json_encode(t('tree_view')) ?>,
  tree_render: <?= json_encode(t('tree_render')) ?>,
  tree_expand_all: <?= json_encode(t('tree_expand_all')) ?>,
  tree_collapse_all: <?= json_encode(t('tree_collapse_all')) ?>,
  tree_search: <?= json_encode(t('tree_search')) ?>,
  tree_empty: <?= json_encode(t('tree_empty')) ?>,
  tree_render_success: <?= json_encode(t('tree_render_success')) ?>,
  tree_objects: <?= json_encode(t('tree_objects')) ?>,
  tree_arrays: <?= json_encode(t('tree_arrays')) ?>,
  tree_primitives: <?= json_encode(t('tree_primitives')) ?>,
  tree_path_hint: <?= json_encode(t('tree_path_hint')) ?>,
  tree_path_copied: <?= json_encode(t('tree_path_copied')) ?>,
  tree_copy_path: <?= json_encode(t('tree_copy_path')) ?>,
  
  // Direction toggles (i18n Pass v1)
  direction_csv_to_json: <?= json_encode(t('direction_csv_to_json')) ?>,
  direction_json_to_csv: <?= json_encode(t('direction_json_to_csv')) ?>,
  direction_xml_to_json: <?= json_encode(t('direction_xml_to_json')) ?>,
  direction_json_to_xml: <?= json_encode(t('direction_json_to_xml')) ?>,
  direction_yaml_to_json: <?= json_encode(t('direction_yaml_to_json')) ?>,
  direction_json_to_yaml: <?= json_encode(t('direction_json_to_yaml')) ?>,
  
  // Input/Output labels (i18n Pass v1)
  label_csv_input: <?= json_encode(t('label_csv_input')) ?>,
  label_csv_output: <?= json_encode(t('label_csv_output')) ?>,
  label_json_input: <?= json_encode(t('label_json_input')) ?>,
  label_json_output: <?= json_encode(t('label_json_output')) ?>,
  label_xml_input: <?= json_encode(t('label_xml_input')) ?>,
  label_xml_output: <?= json_encode(t('label_xml_output')) ?>,
  label_yaml_input: <?= json_encode(t('label_yaml_input')) ?>,
  label_yaml_output: <?= json_encode(t('label_yaml_output')) ?>,
  label_css_input: <?= json_encode(t('label_css_input')) ?>,
  
  // Stats messages (i18n Pass v1)
  stats_rows_to_json: <?= json_encode(t('stats_rows_to_json')) ?>,
  stats_json_to_rows: <?= json_encode(t('stats_json_to_rows')) ?>,
  stats_rules: <?= json_encode(t('stats_rules')) ?>,
  
  // Error messages (i18n Pass v1)
  error_must_be_array: <?= json_encode(t('error_must_be_array')) ?>,
  error_invalid_xml: <?= json_encode(t('error_invalid_xml')) ?>,
  error_yaml_not_loaded: <?= json_encode(t('error_yaml_not_loaded')) ?>,
  error_no_matches: <?= json_encode(t('error_no_matches')) ?>,
  
  // Transform options (i18n Pass v1)
  transform_typescript_interface: <?= json_encode(t('transform_typescript_interface')) ?>,
  transform_typescript_type: <?= json_encode(t('transform_typescript_type')) ?>,
  transform_jsdoc: <?= json_encode(t('transform_jsdoc')) ?>,
  transform_go_struct: <?= json_encode(t('transform_go_struct')) ?>,
  transform_python_dataclass: <?= json_encode(t('transform_python_dataclass')) ?>,
  transform_root_default: <?= json_encode(t('transform_root_default')) ?>,
  
  // File size units (i18n Pass v1)
  unit_bytes: <?= json_encode(t('unit_bytes')) ?>,
  unit_kilobytes: <?= json_encode(t('unit_kilobytes')) ?>,
  unit_megabytes: <?= json_encode(t('unit_megabytes')) ?>,
  
  // Misc (i18n Pass v1)
  path_root: <?= json_encode(t('path_root')) ?>,
  
  // Diff module (i18n Pass v1)
  diff_left_label: <?= json_encode(t('diff_left_label')) ?>,
  diff_right_label: <?= json_encode(t('diff_right_label')) ?>,
  diff_placeholder_left: <?= json_encode(t('diff_placeholder_left')) ?>,
  diff_placeholder_right: <?= json_encode(t('diff_placeholder_right')) ?>,
  diff_compare: <?= json_encode(t('diff_compare')) ?>,
  diff_swap: <?= json_encode(t('diff_swap')) ?>,
  diff_ignore_order: <?= json_encode(t('diff_ignore_order')) ?>,
  diff_ignore_whitespace: <?= json_encode(t('diff_ignore_whitespace')) ?>,
  diff_no_differences: <?= json_encode(t('diff_no_differences')) ?>,
  diff_added: <?= json_encode(t('diff_added')) ?>,
  diff_removed: <?= json_encode(t('diff_removed')) ?>,
  diff_changed: <?= json_encode(t('diff_changed')) ?>,
  
  // Tab names (i18n Pass v1)
  tab_format: <?= json_encode(t('tab_format')) ?>,
  tab_validate: <?= json_encode(t('tab_validate')) ?>,
  tab_fix: <?= json_encode(t('tab_fix')) ?>,
  
  // CSV module (i18n Pass v1)
  csv_hint: <?= json_encode(t('csv_hint')) ?>,
  csv_delimiter: <?= json_encode(t('csv_delimiter')) ?>,
  csv_auto_detect: <?= json_encode(t('csv_auto_detect')) ?>,
  csv_comma: <?= json_encode(t('csv_comma')) ?>,
  csv_tab: <?= json_encode(t('csv_tab')) ?>,
  csv_semicolon: <?= json_encode(t('csv_semicolon')) ?>,
  csv_pipe: <?= json_encode(t('csv_pipe')) ?>,
  csv_first_row_header: <?= json_encode(t('csv_first_row_header')) ?>,
  csv_transpose: <?= json_encode(t('csv_transpose')) ?>,
  csv_select_columns: <?= json_encode(t('csv_select_columns')) ?>,
  csv_select_all: <?= json_encode(t('csv_select_all')) ?>,
  csv_deselect_all: <?= json_encode(t('csv_deselect_all')) ?>,
  csv_output_placeholder: <?= json_encode(t('csv_output_placeholder')) ?>,
  csv_pasted: <?= json_encode(t('csv_pasted')) ?>,
  csv_sent_to_format: <?= json_encode(t('csv_sent_to_format')) ?>,
  drop_file: <?= json_encode(t('drop_file')) ?>,
  no_output: <?= json_encode(t('no_output')) ?>,
  pasted: <?= json_encode(t('pasted')) ?>,
  downloaded: <?= json_encode(t('downloaded')) ?>,
  
  // CSS module (i18n Pass v1)
  css_hint: <?= json_encode(t('css_hint')) ?>,
  css_minify_output: <?= json_encode(t('css_minify_output')) ?>,
  css_include_comments: <?= json_encode(t('css_include_comments')) ?>,
  css_flatten_media: <?= json_encode(t('css_flatten_media')) ?>,
  css_output_placeholder: <?= json_encode(t('css_output_placeholder')) ?>,
  css_pasted: <?= json_encode(t('css_pasted')) ?>,
  css_sent_to_format: <?= json_encode(t('css_sent_to_format')) ?>,
  
  // XML module (i18n Pass v1)
  xml_compact: <?= json_encode(t('xml_compact')) ?>,
  xml_preserve_attributes: <?= json_encode(t('xml_preserve_attributes')) ?>,
  xml_trim: <?= json_encode(t('xml_trim')) ?>,
  
  // YAML module (i18n Pass v1)
  yaml_indent: <?= json_encode(t('yaml_indent')) ?>,
  yaml_flow_style: <?= json_encode(t('yaml_flow_style')) ?>,
  yaml_no_refs: <?= json_encode(t('yaml_no_refs')) ?>,
  format_spaces: <?= json_encode(t('format_spaces')) ?>,
  
  // Sent to messages (i18n Pass v1)
  sent_to_format: <?= json_encode(t('sent_to_format')) ?>,
  sent_to_validate: <?= json_encode(t('sent_to_validate')) ?>,
  sent_to_fix: <?= json_encode(t('sent_to_fix')) ?>,
  sent_to_tab: <?= json_encode(t('sent_to_tab')) ?>,
  unknown_target: <?= json_encode(t('unknown_target')) ?>,
  
  // Pipeline module
  pipeline_visual: <?= json_encode(t('pipeline_visual')) ?>,
  pipeline_manifest: <?= json_encode(t('pipeline_manifest')) ?>,
  pipeline_name: <?= json_encode(t('pipeline_name')) ?>,
  pipeline_version: <?= json_encode(t('pipeline_version')) ?>,
  pipeline_steps: <?= json_encode(t('pipeline_steps')) ?>,
  pipeline_add_step: <?= json_encode(t('pipeline_add_step')) ?>,
  pipeline_no_steps: <?= json_encode(t('pipeline_no_steps')) ?>,
  pipeline_input: <?= json_encode(t('pipeline_input')) ?>,
  pipeline_input_placeholder: <?= json_encode(t('pipeline_input_placeholder')) ?>,
  pipeline_manifest_json: <?= json_encode(t('pipeline_manifest_json')) ?>,
  pipeline_manifest_placeholder: <?= json_encode(t('pipeline_manifest_placeholder')) ?>,
  pipeline_load_example: <?= json_encode(t('pipeline_load_example')) ?>,
  pipeline_run: <?= json_encode(t('pipeline_run')) ?>,
  pipeline_export: <?= json_encode(t('pipeline_export')) ?>,
  pipeline_output: <?= json_encode(t('pipeline_output')) ?>,
  pipeline_output_placeholder: <?= json_encode(t('pipeline_output_placeholder')) ?>,
  pipeline_execution_log: <?= json_encode(t('pipeline_execution_log')) ?>,
  pipeline_select_operator: <?= json_encode(t('pipeline_select_operator')) ?>,
  pipeline_search_operators: <?= json_encode(t('pipeline_search_operators')) ?>,
  pipeline_edit_step: <?= json_encode(t('pipeline_edit_step')) ?>,
  pipeline_no_params: <?= json_encode(t('pipeline_no_params')) ?>,
  pipeline_params_saved: <?= json_encode(t('pipeline_params_saved')) ?>,
  pipeline_no_input: <?= json_encode(t('pipeline_no_input')) ?>,
  pipeline_no_steps_error: <?= json_encode(t('pipeline_no_steps_error')) ?>,
  pipeline_steps_run: <?= json_encode(t('pipeline_steps_run')) ?>,
  pipeline_success: <?= json_encode(t('pipeline_success')) ?>,
  pipeline_failed: <?= json_encode(t('pipeline_failed')) ?>,
  pipeline_no_log: <?= json_encode(t('pipeline_no_log')) ?>,
  pipeline_manifest_valid: <?= json_encode(t('pipeline_manifest_valid')) ?>,
  pipeline_manifest_invalid: <?= json_encode(t('pipeline_manifest_invalid')) ?>,
  pipeline_example_loaded: <?= json_encode(t('pipeline_example_loaded')) ?>,
  pipeline_exported: <?= json_encode(t('pipeline_exported')) ?>,
  format: <?= json_encode(t('format')) ?>,
  validate: <?= json_encode(t('validate')) ?>,
  save: <?= json_encode(t('save')) ?>,
  cancel: <?= json_encode(t('cancel')) ?>,
  edit: <?= json_encode(t('edit')) ?>,
  delete: <?= json_encode(t('delete')) ?>,
  move_up: <?= json_encode(t('move_up')) ?>,
  move_down: <?= json_encode(t('move_down')) ?>,
  formatted: <?= json_encode(t('formatted')) ?>
};

// Tab list for JS reference
window.jsonToolboxTabs = <?= json_encode(array_keys($tabs)) ?>;
</script>

<!-- Lucide Icons (self-hosted for offline capability) -->
<script src="vendor/lucide.min.js"></script>
<script>
  // Initialize Lucide icons immediately
  document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) {
      lucide.createIcons();
    }
  });
</script>

<!-- Capability Libraries (self-hosted for offline capability + supply chain control) -->
<script src="vendor/papaparse.min.js" defer></script>
<script src="vendor/jsonrepair.min.js" defer></script>
<script src="vendor/js-yaml.min.js" defer></script>

<!-- Compliance Mode & Analytics Bootstrap (Phase0: Trust Repair) -->
<script>
(function() {
  'use strict';
  
  // Compliance mode flag (from server or URL)
  window.JSON_TOOLBOX_COMPLIANCE = <?= $complianceMode ? 'true' : 'false' ?>;
  
  // Analytics default OFF (opt-in model)
  // Check localStorage for user opt-in preference
  window.JSON_TOOLBOX_ANALYTICS = false;
  try {
    if (!window.JSON_TOOLBOX_COMPLIANCE) {
      window.JSON_TOOLBOX_ANALYTICS = localStorage.getItem('json-toolbox-analytics-enabled') === 'true';
    }
  } catch (e) {
    // localStorage unavailable - analytics stays off
  }
  
  // Log compliance mode status for debugging
  if (window.JSON_TOOLBOX_COMPLIANCE) {
    console.info('[JSON Toolbox] Compliance mode active: no analytics, no persistent storage');
  }
})();
</script>

<?php if (!ZERO_TELEMETRY_BUILD): ?>
<!-- Self-hosted Analytics (Privacy-first, Opt-in, Default OFF) -->
<script src="modules/analytics.js?v=2"></script>
<?php endif; ?>

<!-- Core Script -->
<script src="script.js?v=1"></script>

<!-- Sample Data Module (provides sample datasets) -->
<script src="modules/sample-data.js?v=1" defer></script>

<!-- Handoff Module (cross-module data transfer) -->
<script src="modules/handoff.js?v=1" defer></script>

<!-- Hints Module (contextual help and tips) -->
<script src="modules/hints.js?v=1" defer></script>

<!-- Modules (loaded after core) -->
<script src="modules/csv.js?v=3" defer></script>
<script src="modules/css.js?v=1" defer></script>
<script src="modules/format.js?v=1" defer></script>
<script src="modules/validate.js?v=1" defer></script>
<script src="modules/fix.js?v=1" defer></script>
<script src="modules/xml.js?v=1" defer></script>
<script src="modules/yaml.js?v=1" defer></script>
<script src="modules/diff.js?v=1" defer></script>
<script src="modules/query.js?v=1" defer></script>
<script src="modules/schema.js?v=1" defer></script>
<script src="modules/transform.js?v=1" defer></script>
<script src="modules/utilities.js?v=1" defer></script>
<script src="modules/tree.js?v=1" defer></script>

<!-- Operator System (Phase1: Pipeline Foundation) -->
<script src="operators/registry.js?v=1" defer></script>
<script src="operators/json.js?v=1" defer></script>
<script src="operators/csv.js?v=1" defer></script>
<script src="operators/xml.js?v=1" defer></script>
<script src="operators/yaml.js?v=1" defer></script>
<script src="operators/transform.js?v=1" defer></script>
<script src="operators/pipeline.js?v=1" defer></script>
<script src="operators/index.js?v=1" defer></script>

<!-- Pipeline UI Module -->
<script src="modules/pipeline-ui.js?v=1" defer></script>

<?php include '../../includes/tool-layout-end.php'; ?>
