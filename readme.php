<!-- tools/json/readme.php - JSON Toolbox Documentation v2.0 -->
<?php
require_once 'lang.php';

// Readme-specifika översättningar
$readmeTranslations = [
    'sv' => [
        'title' => 'Om JSON Toolbox',
        'meta_description' => 'JSON Toolbox - lokal datakonvertering för utvecklare. Konvertera CSV, XML, YAML till JSON. Formatera, validera, reparera. Ingen data skickas till server.',
        'back_link' => 'Tillbaka till verktyget',
        
        // Hero
        'hero_tagline' => 'Lokal datakonvertering och JSON-manipulation för utvecklare.',
        'hero_trust' => 'Ingen server. Ingen telemetri. Deterministisk output.',
        
        // What it does
        'what_title' => 'Vad det gör',
        'what_text' => 'Konvertera, validera, formatera och transformera JSON och relaterade dataformat. Allt körs i din webbläsare. Inget lämnar din maskin.',
        'what_formats' => 'Format',
        'what_formats_list' => 'JSON, CSV, XML, YAML, CSS',
        'what_operations' => 'Operationer',
        'what_operations_list' => 'Konvertera, Formatera, Minifiera, Validera, Reparera, Diff, Query, Transform',
        'what_output' => 'Output',
        'what_output_list' => 'JSON, TypeScript interfaces, JSON Schema, Trädvy',
        
        // Capability matrix
        'capabilities_title' => 'Funktioner',
        'cap_module' => 'Modul',
        'cap_input' => 'Input',
        'cap_output' => 'Output',
        'cap_notes' => 'Detaljer',
        'cap_csv_notes' => 'Kolumnfilter, transponera, auto-detect avgränsare',
        'cap_csv_reverse' => 'Array-of-objects till CSV',
        'cap_xml_notes' => 'Bevarar attribut, kompakt läge',
        'cap_xml_reverse' => 'Konfigurerbar output',
        'cap_yaml_notes' => 'Full YAML 1.2 support',
        'cap_yaml_reverse' => 'Flow style, custom indent',
        'cap_css_notes' => 'Regel-baserad parsing',
        'cap_format_notes' => 'Beautify, minify, sortera nycklar',
        'cap_validate_notes' => 'Syntaxkontroll, schema-validering',
        'cap_repair_notes' => 'Fixar trailing commas, single quotes, kommentarer',
        'cap_diff_notes' => 'Visuell jämförelse, ignorera ordning',
        'cap_query_notes' => 'Standard JSONPath-uttryck',
        'cap_schema_notes' => 'Draft-07 generering',
        'cap_transform_notes' => 'Interfaces, types, JSDoc',
        'cap_utilities_notes' => 'Base64, URL encode/decode, escape',
        'cap_tree_notes' => 'Interaktiv expand/collapse',
        
        // Examples
        'examples_title' => 'Exempel',
        'example_csv_title' => 'CSV till JSON',
        'example_ts_title' => 'JSON till TypeScript',
        'example_repair_title' => 'Reparera trasig JSON',
        'example_input' => 'Input',
        'example_output' => 'Output',
        
        // Why local
        'why_local_title' => 'Varför lokal körning?',
        'why_concern' => 'Aspekt',
        'why_server' => 'Server-baserade verktyg',
        'why_local' => 'JSON Toolbox',
        'why_privacy' => 'Dataintegritet',
        'why_privacy_server' => 'Data skickas till tredje part',
        'why_privacy_local' => 'Data lämnar aldrig webbläsaren',
        'why_pii' => 'PII-hantering',
        'why_pii_server' => 'Compliance-risk',
        'why_pii_local' => 'Ingen compliance-börda',
        'why_offline' => 'Offline-användning',
        'why_offline_server' => 'Kräver internet',
        'why_offline_local' => 'Fungerar offline efter första laddning',
        'why_speed' => 'Hastighet',
        'why_speed_server' => 'Nätverkslatens',
        'why_speed_local' => 'Omedelbar',
        'why_determinism' => 'Determinism',
        'why_determinism_server' => 'Server kan ändras',
        'why_determinism_local' => 'Samma input = samma output',
        'why_enterprise' => 'Enterprise',
        'why_enterprise_server' => 'Kan bryta policy',
        'why_enterprise_local' => 'IT-vänlig',
        
        'why_matters_title' => 'När detta spelar roll',
        'why_matters_1' => 'Konvertera kunddata (PII)',
        'why_matters_2' => 'Arbeta med API-nycklar eller credentials',
        'why_matters_3' => 'Bearbeta proprietär affärsdata',
        'why_matters_4' => 'Arbeta i air-gapped miljöer',
        'why_matters_5' => 'Kräva audit-kompatibla arbetsflöden',
        'why_matters_6' => 'Behöva reproducerbar output',
        
        // Use cases
        'usecases_title' => 'Användningsområden',
        'usecase_enterprise' => 'Enterprise/Compliance',
        'usecase_enterprise_text' => 'Konvertera produktionsdata utan att skicka känslig information till externa tjänster.',
        'usecase_api' => 'API-utveckling',
        'usecase_api_text' => 'Transformera API-svar till TypeScript interfaces. Validera mot JSON Schema.',
        'usecase_data' => 'Data Engineering',
        'usecase_data_text' => 'Konvertera mellan CSV, JSON, YAML, XML för pipeline-debugging.',
        'usecase_devops' => 'Sysadmin/DevOps',
        'usecase_devops_text' => 'Formatera och validera konfigurationsfiler. Reparera trasig JSON från loggar.',
        'usecase_edu' => 'Utbildning',
        'usecase_edu_text' => 'Lär dig dataformat med omedelbar feedback. Inget konto krävs.',
        'usecase_offline' => 'Offline/Resa',
        'usecase_offline_text' => 'Full funktionalitet utan internet efter första sidladdning.',
        
        // Privacy
        'privacy_title' => 'Integritet & Säkerhet',
        'privacy_item' => 'Punkt',
        'privacy_status' => 'Status',
        'privacy_server' => 'Data skickas till server',
        'privacy_server_val' => 'Aldrig',
        'privacy_analytics' => 'Analytics/telemetri',
        'privacy_analytics_val' => 'Endast aggregat (cookieless, self-hosted)',
        'privacy_cookies' => 'Cookies',
        'privacy_cookies_val' => 'Inga',
        'privacy_account' => 'Konto krävs',
        'privacy_account_val' => 'Nej',
        'privacy_network' => 'Nätverksanrop under användning',
        'privacy_network_val' => 'Inga',
        'privacy_storage' => 'localStorage',
        'privacy_storage_val' => 'Opt-in (sparar senaste input per flik)',
        'privacy_suitable' => 'Lämplig för',
        'privacy_suitable_1' => 'Personuppgifter (PII)',
        'privacy_suitable_2' => 'Finansiell data',
        'privacy_suitable_3' => 'Hälsodata (PHI)',
        'privacy_suitable_4' => 'Proprietär affärsdata',
        'privacy_suitable_5' => 'API-nycklar och credentials (för testning)',
        
        // Privacy Manifesto
        'manifesto_title' => 'Privacy Manifesto',
        'manifesto_intro' => 'JSON Toolbox följer en strikt privacy-first filosofi:',
        'manifesto_1' => 'Din data stannar på din maskin',
        'manifesto_1_desc' => 'All bearbetning sker i webbläsaren. Ingenting skickas till backend.',
        'manifesto_2' => 'Ingen identifiering',
        'manifesto_2_desc' => 'Inga cookies. Inga fingerprints. Inga session IDs. Inga user IDs.',
        'manifesto_3' => 'Opt-in lagring',
        'manifesto_3_desc' => 'localStorage används endast för att spara dina preferenser. Rensas med ett klick.',
        'manifesto_4' => 'Transparent analytics',
        'manifesto_4_desc' => 'Endast aggregerad användningsstatistik. Self-hosted på samma infrastruktur.',
        'manifesto_5' => 'Ingen rekonstruktion',
        'manifesto_5_desc' => 'Omöjligt att återskapa individuella sessioner eller användarbeteenden.',
        'manifesto_footer' => 'Vi tror att verktyg ska hjälpa, inte övervaka.',
        
        // Observability
        'observability_title' => 'Observability & Analytics',
        'observability_intro' => 'JSON Toolbox använder privacy-first analytics för att förbättra verktyget:',
        'obs_what' => 'Vad samlas in',
        'obs_what_list' => 'Sidvisningar, flikbyten, operationstyper (format/validate/convert), temaval, språkval',
        'obs_how' => 'Hur det fungerar',
        'obs_how_list' => 'Self-hosted Matomo | Cookieless mode | POST requests | Respekterar DNT',
        'obs_not' => 'Vad samlas INTE in',
        'obs_not_list' => 'Din JSON-data | IP-adress (anonymiserad) | Session replay | Browser fingerprint | Identifierare',
        'obs_disable' => 'Inaktivera analytics',
        'obs_disable_code' => 'Lägg till i din kod före sidladdning:',
        
        // PII & Enterprise
        'pii_title' => 'PII & Enterprise-kompatibilitet',
        'pii_intro' => 'JSON Toolbox är designat för enterprise-miljöer med strikt datapolicy:',
        'pii_gdpr' => 'GDPR-vänlig',
        'pii_gdpr_desc' => 'Ingen persondata samlas in. Inga samtyckesbanner behövs.',
        'pii_hipaa' => 'HIPAA-kompatibel',
        'pii_hipaa_desc' => 'PHI lämnar aldrig webbläsaren. Ingen tredjepartsexponering.',
        'pii_sox' => 'SOX-kompatibel',
        'pii_sox_desc' => 'Deterministisk output. Verifierbar lokal körning.',
        'pii_audit' => 'Audit-trail',
        'pii_audit_desc' => 'Ingen server-logging av användardata. Inget att revidera.',
        'pii_selfhost' => 'Self-hosted',
        'pii_selfhost_desc' => 'Hostar du mackan.eu själv? Full kontroll över all infrastruktur.',
        
        // Air-gapped
        'airgap_title' => 'Air-gapped & Offline-läge',
        'airgap_intro' => 'JSON Toolbox fungerar i fullständigt isolerade miljöer:',
        'airgap_how' => 'Aktivera offline-läge',
        'airgap_step1' => 'Ladda sidan en gång med internet',
        'airgap_step2' => 'Alla resurser cachas lokalt',
        'airgap_step3' => 'Stäng av internet - verktyget fungerar fortfarande',
        'airgap_full' => 'För fullständig air-gap',
        'airgap_full_desc' => 'Inaktivera analytics och ladda ner för lokal hosting:',
        'airgap_features' => 'Alla funktioner offline',
        'airgap_features_list' => 'CSV/XML/YAML/CSS konvertering | Format/Validate/Repair | Diff/Query/Schema | Transform/Tree/Utilities',
        
        // Deterministic
        'deterministic_title' => 'Deterministiskt utvecklarverktyg',
        'deterministic_intro' => 'JSON Toolbox följer mönstret för deterministiska utvecklarverktyg:',
        'deterministic_1' => 'Lokal körning',
        'deterministic_1_desc' => 'Inga nätverksanrop under operation',
        'deterministic_2' => 'Deterministisk output',
        'deterministic_2_desc' => 'Samma input ger alltid samma output',
        'deterministic_3' => 'Noll onboarding',
        'deterministic_3_desc' => 'Klistra in data, klicka konvertera',
        'deterministic_4' => 'Inga sidoeffekter',
        'deterministic_4_desc' => 'Inget installeras, inget sparas utan samtycke',
        'deterministic_5' => 'Tangentbord först',
        'deterministic_5_desc' => 'Full operation via genvägar (tryck ?)',
        'deterministic_outro' => 'Detta är ett verktyg, inte en tjänst.',
        
        // Shortcuts
        'shortcuts_title' => 'Tangentbordsgenvägar',
        'shortcut' => 'Genväg',
        'action' => 'Åtgärd',
        'shortcut_help' => 'Visa/dölj genvägar',
        'shortcut_run' => 'Kör aktuell operation',
        'shortcut_tabs' => 'Byt till flik 1-9',
        'shortcut_next' => 'Nästa flik',
        'shortcut_prev' => 'Föregående flik',
        'shortcut_copy' => 'Kopiera output',
        'shortcut_close' => 'Stäng modal',
        
        // Policies
        'policies_title' => 'Policies',
        'policy_deps' => 'Dependency Policy',
        'policy_deps_allowed' => 'Tillåtet',
        'policy_deps_allowed_text' => 'Kapabilitetsbibliotek (lokala, deterministiska, self-hosted)',
        'policy_deps_disallowed' => 'Ej tillåtet',
        'policy_deps_disallowed_text' => 'Frameworks, byggsystem, CDN-beroenden, externa tjänster',
        'policy_local' => 'Local Execution Policy',
        'policy_local_1' => 'Inga nätverksanrop under verktygsoperation',
        'policy_local_2' => 'Ingen backend eller molnbearbetning',
        'policy_local_3' => 'Ingen telemetri (endast aggregerad analytics, opt-out)',
        'policy_local_4' => 'All bearbetning i webbläsarens JavaScript',
        'policy_a11y' => 'Accessibility Policy',
        'policy_a11y_1' => 'WCAG AA kontrastuppfyllnad (≥4.5:1)',
        'policy_a11y_2' => 'Tangentbordsnavigering för alla funktioner',
        'policy_a11y_3' => 'ARIA-attribut på interaktiva element',
        'policy_a11y_4' => 'Skärmläsarkompatibel',
        
        // Browser support
        'browser_title' => 'Webbläsarstöd',
        'browser' => 'Webbläsare',
        'browser_status' => 'Status',
        'browser_full' => 'Fullt stöd',
        
        // Tech
        'tech_title' => 'Teknisk information',
        'tech_metric' => 'Mått',
        'tech_value' => 'Värde',
        'tech_initial' => 'Initial laddning',
        'tech_full' => 'Full laddning (alla moduler)',
        'tech_languages' => 'Språk',
        'tech_languages_val' => 'Svenska, Engelska',
        'tech_themes' => 'Teman',
        'tech_themes_val' => 'Ljust, Mörkt',
        'tech_libs' => 'Bibliotek',
        
        // Related
        'related_title' => 'Relaterade verktyg',
        'related_intro' => 'Del av mackan.eu utvecklarverktygssvit:',
        'related_password' => 'Kryptografiskt säkra lösenord',
        'related_image' => 'Lokal bildformatkonvertering',
        'related_coord' => 'GPS-koordinattransformation',
    ],
    'en' => [
        'title' => 'About JSON Toolbox',
        'meta_description' => 'JSON Toolbox - local data conversion for developers. Convert CSV, XML, YAML to JSON. Format, validate, repair. No data sent to server.',
        'back_link' => 'Back to tool',
        
        // Hero
        'hero_tagline' => 'Local-first data conversion and JSON manipulation for developers.',
        'hero_trust' => 'No server. No telemetry. Deterministic output.',
        
        // What it does
        'what_title' => 'What It Does',
        'what_text' => 'Convert, validate, format, and transform JSON and related data formats. Everything runs in your browser. Nothing leaves your machine.',
        'what_formats' => 'Formats',
        'what_formats_list' => 'JSON, CSV, XML, YAML, CSS',
        'what_operations' => 'Operations',
        'what_operations_list' => 'Convert, Format, Minify, Validate, Repair, Diff, Query, Transform',
        'what_output' => 'Output',
        'what_output_list' => 'JSON, TypeScript interfaces, JSON Schema, Tree view',
        
        // Capability matrix
        'capabilities_title' => 'Capabilities',
        'cap_module' => 'Module',
        'cap_input' => 'Input',
        'cap_output' => 'Output',
        'cap_notes' => 'Notes',
        'cap_csv_notes' => 'Column filter, transpose, delimiter auto-detect',
        'cap_csv_reverse' => 'Array-of-objects to CSV',
        'cap_xml_notes' => 'Preserves attributes, compact mode',
        'cap_xml_reverse' => 'Configurable output',
        'cap_yaml_notes' => 'Full YAML 1.2 support',
        'cap_yaml_reverse' => 'Flow style, custom indent',
        'cap_css_notes' => 'Rule-based parsing',
        'cap_format_notes' => 'Beautify, minify, sort keys',
        'cap_validate_notes' => 'Syntax check, schema validation',
        'cap_repair_notes' => 'Fixes trailing commas, single quotes, comments',
        'cap_diff_notes' => 'Visual comparison, ignore order option',
        'cap_query_notes' => 'Standard JSONPath expressions',
        'cap_schema_notes' => 'Draft-07 generation',
        'cap_transform_notes' => 'Interfaces, types, JSDoc',
        'cap_utilities_notes' => 'Base64, URL encode/decode, escape',
        'cap_tree_notes' => 'Interactive expand/collapse',
        
        // Examples
        'examples_title' => 'Examples',
        'example_csv_title' => 'CSV to JSON',
        'example_ts_title' => 'JSON to TypeScript',
        'example_repair_title' => 'Repair Broken JSON',
        'example_input' => 'Input',
        'example_output' => 'Output',
        
        // Why local
        'why_local_title' => 'Why Local Execution?',
        'why_concern' => 'Concern',
        'why_server' => 'Server-based tools',
        'why_local' => 'JSON Toolbox',
        'why_privacy' => 'Data privacy',
        'why_privacy_server' => 'Data sent to third party',
        'why_privacy_local' => 'Data never leaves browser',
        'why_pii' => 'PII handling',
        'why_pii_server' => 'Compliance risk',
        'why_pii_local' => 'No compliance burden',
        'why_offline' => 'Offline use',
        'why_offline_server' => 'Requires internet',
        'why_offline_local' => 'Works offline after first load',
        'why_speed' => 'Speed',
        'why_speed_server' => 'Network latency',
        'why_speed_local' => 'Instant',
        'why_determinism' => 'Determinism',
        'why_determinism_server' => 'Server may change',
        'why_determinism_local' => 'Same input = same output',
        'why_enterprise' => 'Enterprise use',
        'why_enterprise_server' => 'May violate policy',
        'why_enterprise_local' => 'IT-friendly',
        
        'why_matters_title' => 'When This Matters',
        'why_matters_1' => 'Converting customer data (PII)',
        'why_matters_2' => 'Working with API keys or credentials',
        'why_matters_3' => 'Processing proprietary business data',
        'why_matters_4' => 'Working in air-gapped environments',
        'why_matters_5' => 'Requiring audit-compliant workflows',
        'why_matters_6' => 'Needing reproducible output',
        
        // Use cases
        'usecases_title' => 'Use Cases',
        'usecase_enterprise' => 'Enterprise/Compliance',
        'usecase_enterprise_text' => 'Convert production data exports without sending sensitive information to external services.',
        'usecase_api' => 'API Development',
        'usecase_api_text' => 'Transform API responses to TypeScript interfaces. Validate against JSON Schema.',
        'usecase_data' => 'Data Engineering',
        'usecase_data_text' => 'Convert between CSV, JSON, YAML, XML for pipeline debugging.',
        'usecase_devops' => 'Sysadmin/DevOps',
        'usecase_devops_text' => 'Format and validate configuration files. Repair malformed JSON from logs.',
        'usecase_edu' => 'Education',
        'usecase_edu_text' => 'Learn data formats with instant feedback. No account required.',
        'usecase_offline' => 'Offline/Travel',
        'usecase_offline_text' => 'Full functionality without internet after initial page load.',
        
        // Privacy
        'privacy_title' => 'Privacy & Security',
        'privacy_item' => 'Item',
        'privacy_status' => 'Status',
        'privacy_server' => 'Data sent to server',
        'privacy_server_val' => 'Never',
        'privacy_analytics' => 'Analytics/telemetry',
        'privacy_analytics_val' => 'Aggregate only (cookieless, self-hosted)',
        'privacy_cookies' => 'Cookies',
        'privacy_cookies_val' => 'None',
        'privacy_account' => 'Account required',
        'privacy_account_val' => 'No',
        'privacy_network' => 'Network requests during use',
        'privacy_network_val' => 'None',
        'privacy_storage' => 'localStorage',
        'privacy_storage_val' => 'Opt-in (saves last input per tab)',
        'privacy_suitable' => 'Suitable for',
        'privacy_suitable_1' => 'Personally Identifiable Information (PII)',
        'privacy_suitable_2' => 'Financial data',
        'privacy_suitable_3' => 'Healthcare data (PHI)',
        'privacy_suitable_4' => 'Proprietary business data',
        'privacy_suitable_5' => 'API keys and credentials (for testing)',
        
        // Privacy Manifesto
        'manifesto_title' => 'Privacy Manifesto',
        'manifesto_intro' => 'JSON Toolbox follows a strict privacy-first philosophy:',
        'manifesto_1' => 'Your data stays on your machine',
        'manifesto_1_desc' => 'All processing happens in the browser. Nothing is sent to backend.',
        'manifesto_2' => 'No identification',
        'manifesto_2_desc' => 'No cookies. No fingerprints. No session IDs. No user IDs.',
        'manifesto_3' => 'Opt-in storage',
        'manifesto_3_desc' => 'localStorage is only used to save your preferences. Cleared with one click.',
        'manifesto_4' => 'Transparent analytics',
        'manifesto_4_desc' => 'Aggregate usage statistics only. Self-hosted on same infrastructure.',
        'manifesto_5' => 'No reconstruction',
        'manifesto_5_desc' => 'Impossible to reconstruct individual sessions or user behaviors.',
        'manifesto_footer' => 'We believe tools should help, not surveil.',
        
        // Observability
        'observability_title' => 'Observability & Analytics',
        'observability_intro' => 'JSON Toolbox uses privacy-first analytics to improve the tool:',
        'obs_what' => 'What is collected',
        'obs_what_list' => 'Page views, tab switches, operation types (format/validate/convert), theme choice, language choice',
        'obs_how' => 'How it works',
        'obs_how_list' => 'Self-hosted Matomo | Cookieless mode | POST requests | Respects DNT',
        'obs_not' => 'What is NOT collected',
        'obs_not_list' => 'Your JSON data | IP address (anonymized) | Session replay | Browser fingerprint | Identifiers',
        'obs_disable' => 'Disable analytics',
        'obs_disable_code' => 'Add to your code before page load:',
        
        // PII & Enterprise
        'pii_title' => 'PII & Enterprise Compatibility',
        'pii_intro' => 'JSON Toolbox is designed for enterprise environments with strict data policies:',
        'pii_gdpr' => 'GDPR-friendly',
        'pii_gdpr_desc' => 'No personal data collected. No consent banners needed.',
        'pii_hipaa' => 'HIPAA-compatible',
        'pii_hipaa_desc' => 'PHI never leaves the browser. No third-party exposure.',
        'pii_sox' => 'SOX-compliant',
        'pii_sox_desc' => 'Deterministic output. Verifiable local execution.',
        'pii_audit' => 'Audit trail',
        'pii_audit_desc' => 'No server-side logging of user data. Nothing to audit.',
        'pii_selfhost' => 'Self-hosted',
        'pii_selfhost_desc' => 'Hosting mackan.eu yourself? Full control over all infrastructure.',
        
        // Air-gapped
        'airgap_title' => 'Air-gapped & Offline Mode',
        'airgap_intro' => 'JSON Toolbox works in completely isolated environments:',
        'airgap_how' => 'Enable offline mode',
        'airgap_step1' => 'Load the page once with internet',
        'airgap_step2' => 'All resources are cached locally',
        'airgap_step3' => 'Disconnect internet - tool still works',
        'airgap_full' => 'For full air-gap',
        'airgap_full_desc' => 'Disable analytics and download for local hosting:',
        'airgap_features' => 'All features offline',
        'airgap_features_list' => 'CSV/XML/YAML/CSS conversion | Format/Validate/Repair | Diff/Query/Schema | Transform/Tree/Utilities',
        
        // Deterministic
        'deterministic_title' => 'Deterministic Developer Utility',
        'deterministic_intro' => 'JSON Toolbox follows the Deterministic Developer Utility pattern:',
        'deterministic_1' => 'Local execution',
        'deterministic_1_desc' => 'No network calls during operation',
        'deterministic_2' => 'Deterministic output',
        'deterministic_2_desc' => 'Same input always produces same output',
        'deterministic_3' => 'Zero onboarding',
        'deterministic_3_desc' => 'Paste data, click convert',
        'deterministic_4' => 'No side effects',
        'deterministic_4_desc' => 'Nothing installed, nothing persisted without consent',
        'deterministic_5' => 'Keyboard-first',
        'deterministic_5_desc' => 'Full operation via shortcuts (press ?)',
        'deterministic_outro' => 'This is a tool, not a service.',
        
        // Shortcuts
        'shortcuts_title' => 'Keyboard Shortcuts',
        'shortcut' => 'Shortcut',
        'action' => 'Action',
        'shortcut_help' => 'Show/hide shortcuts',
        'shortcut_run' => 'Run current operation',
        'shortcut_tabs' => 'Switch to tab 1-9',
        'shortcut_next' => 'Next tab',
        'shortcut_prev' => 'Previous tab',
        'shortcut_copy' => 'Copy output',
        'shortcut_close' => 'Close modal',
        
        // Policies
        'policies_title' => 'Policies',
        'policy_deps' => 'Dependency Policy',
        'policy_deps_allowed' => 'Allowed',
        'policy_deps_allowed_text' => 'Capability libraries (local-only, deterministic, self-hosted)',
        'policy_deps_disallowed' => 'Disallowed',
        'policy_deps_disallowed_text' => 'Frameworks, build systems, CDN dependencies, external services',
        'policy_local' => 'Local Execution Policy',
        'policy_local_1' => 'No network calls during tool operation',
        'policy_local_2' => 'No backend or cloud processing',
        'policy_local_3' => 'No telemetry (aggregate analytics only, opt-out)',
        'policy_local_4' => 'All processing in browser JavaScript',
        'policy_a11y' => 'Accessibility Policy',
        'policy_a11y_1' => 'WCAG AA contrast compliance (≥4.5:1)',
        'policy_a11y_2' => 'Keyboard navigation for all functions',
        'policy_a11y_3' => 'ARIA labels on interactive elements',
        'policy_a11y_4' => 'Screen reader compatible',
        
        // Browser support
        'browser_title' => 'Browser Support',
        'browser' => 'Browser',
        'browser_status' => 'Status',
        'browser_full' => 'Full support',
        
        // Tech
        'tech_title' => 'Technical Details',
        'tech_metric' => 'Metric',
        'tech_value' => 'Value',
        'tech_initial' => 'Initial load',
        'tech_full' => 'Full load (all modules)',
        'tech_languages' => 'Languages',
        'tech_languages_val' => 'Swedish, English',
        'tech_themes' => 'Themes',
        'tech_themes_val' => 'Light, Dark',
        'tech_libs' => 'Libraries',
        
        // Related
        'related_title' => 'Related Tools',
        'related_intro' => 'Part of the mackan.eu developer utility suite:',
        'related_password' => 'Cryptographically secure passwords',
        'related_image' => 'Local image format conversion',
        'related_coord' => 'GPS coordinate transformation',
    ]
];

// Merge med huvudöversättningar
foreach ($readmeTranslations as $langCode => $trans) {
    $translations[$langCode] = array_merge($translations[$langCode], $trans);
}

$title = t('title');
$metaDescription = t('meta_description');
$canonical = 'https://mackan.eu/tools/json/readme.php';
$langSupport = ['sv', 'en'];
$uiLang = $lang;

// Hreflang
$extraHead = getHreflangTags($canonical, $langSupport);

include '../../includes/tool-layout-start.php';
?>

<style>
.readme { max-width: 900px; margin: 0 auto; }
.readme section { margin-bottom: 2rem; }
.readme h2 { margin-top: 2rem; border-bottom: 1px solid var(--border-color, #dee2e6); padding-bottom: 0.5rem; }
.readme h3 { margin-top: 1.5rem; }
.readme table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
.readme th, .readme td { padding: 0.5rem; border: 1px solid var(--border-color, #dee2e6); text-align: left; }
.readme th { background: var(--surface-elevated, #f8f9fa); font-weight: 600; }
.readme pre { background: var(--surface-elevated, #f4f4f4); padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.85rem; }
.readme code { font-family: 'JetBrains Mono', monospace; }
.readme .hero-box { background: var(--surface-elevated, #f8f9fa); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: center; }
.readme .hero-box pre { background: transparent; text-align: left; display: inline-block; margin: 1rem 0; }
.readme .hero-trust { font-weight: 600; color: var(--color-primary, #0066cc); }
.readme .status-never { color: #28a745; font-weight: 600; }
.readme .status-none { color: #28a745; font-weight: 600; }
.readme dl { margin: 1rem 0; }
.readme dt { font-weight: 600; margin-top: 1rem; }
.readme dd { margin-left: 1rem; color: var(--color-text-secondary, #6c757d); }
.readme .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.readme .card-box { background: var(--surface-elevated, #f8f9fa); padding: 1rem; border-radius: 6px; }
.readme .card-box h4 { margin: 0 0 0.5rem 0; font-size: 1rem; }
.readme .card-box p { margin: 0; font-size: 0.9rem; color: var(--color-text-secondary, #6c757d); }
</style>

<!-- ********** START: JSON Toolbox Readme ********** -->
<header class="layout__sektion">
  <h1 class="rubrik rubrik--sektion">
    JSON Toolbox
    <a href="index.php<?= $lang !== 'sv' ? '?lang=' . $lang : '' ?>" class="info-link-floating" title="<?= htmlspecialchars(t('back_link'), ENT_QUOTES, 'UTF-8') ?>">&larr;</a>
  </h1>
</header>

<article class="layout__sektion card readme">

  <!-- Hero -->
  <div class="hero-box">
    <p style="font-size: 1.1rem; margin-bottom: 1rem;"><?= htmlspecialchars(t('hero_tagline'), ENT_QUOTES, 'UTF-8') ?></p>
<pre>
Input → Transform → Output
  ↑        ↑         ↓
 CSV    Validate   TypeScript
 XML    Format     Schema
 YAML   Repair     Tree View
</pre>
    <p class="hero-trust"><?= htmlspecialchars(t('hero_trust'), ENT_QUOTES, 'UTF-8') ?></p>
  </div>

  <!-- What it does -->
  <section>
    <h2><?= htmlspecialchars(t('what_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><?= htmlspecialchars(t('what_text'), ENT_QUOTES, 'UTF-8') ?></p>
    <p>
      <strong><?= htmlspecialchars(t('what_formats'), ENT_QUOTES, 'UTF-8') ?>:</strong> <?= htmlspecialchars(t('what_formats_list'), ENT_QUOTES, 'UTF-8') ?><br>
      <strong><?= htmlspecialchars(t('what_operations'), ENT_QUOTES, 'UTF-8') ?>:</strong> <?= htmlspecialchars(t('what_operations_list'), ENT_QUOTES, 'UTF-8') ?><br>
      <strong><?= htmlspecialchars(t('what_output'), ENT_QUOTES, 'UTF-8') ?>:</strong> <?= htmlspecialchars(t('what_output_list'), ENT_QUOTES, 'UTF-8') ?>
    </p>
  </section>

  <!-- Capability Matrix -->
  <section>
    <h2><?= htmlspecialchars(t('capabilities_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <table>
      <thead>
        <tr>
          <th><?= htmlspecialchars(t('cap_module'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('cap_input'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('cap_output'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('cap_notes'), ENT_QUOTES, 'UTF-8') ?></th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>CSV</strong></td><td>CSV, TSV</td><td>JSON</td><td><?= htmlspecialchars(t('cap_csv_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td></td><td>JSON</td><td>CSV</td><td><?= htmlspecialchars(t('cap_csv_reverse'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>XML</strong></td><td>XML</td><td>JSON</td><td><?= htmlspecialchars(t('cap_xml_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td></td><td>JSON</td><td>XML</td><td><?= htmlspecialchars(t('cap_xml_reverse'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>YAML</strong></td><td>YAML</td><td>JSON</td><td><?= htmlspecialchars(t('cap_yaml_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td></td><td>JSON</td><td>YAML</td><td><?= htmlspecialchars(t('cap_yaml_reverse'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>CSS</strong></td><td>CSS</td><td>JSON</td><td><?= htmlspecialchars(t('cap_css_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Format</strong></td><td>JSON</td><td>JSON</td><td><?= htmlspecialchars(t('cap_format_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Validate</strong></td><td>JSON</td><td>Report</td><td><?= htmlspecialchars(t('cap_validate_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Repair</strong></td><td>Broken JSON</td><td>Valid JSON</td><td><?= htmlspecialchars(t('cap_repair_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Diff</strong></td><td>2× JSON</td><td>Diff view</td><td><?= htmlspecialchars(t('cap_diff_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Query</strong></td><td>JSON + JSONPath</td><td>JSON subset</td><td><?= htmlspecialchars(t('cap_query_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Schema</strong></td><td>JSON</td><td>JSON Schema</td><td><?= htmlspecialchars(t('cap_schema_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Transform</strong></td><td>JSON</td><td>TypeScript</td><td><?= htmlspecialchars(t('cap_transform_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Utilities</strong></td><td>String</td><td>String</td><td><?= htmlspecialchars(t('cap_utilities_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong>Tree</strong></td><td>JSON</td><td>Tree view</td><td><?= htmlspecialchars(t('cap_tree_notes'), ENT_QUOTES, 'UTF-8') ?></td></tr>
      </tbody>
    </table>
  </section>

  <!-- Examples -->
  <section>
    <h2><?= htmlspecialchars(t('examples_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    
    <h3><?= htmlspecialchars(t('example_csv_title'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><strong><?= htmlspecialchars(t('example_input'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <pre><code>name,role,active
Alice,admin,true
Bob,user,false</code></pre>
    <p><strong><?= htmlspecialchars(t('example_output'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <pre><code>[
  {"name": "Alice", "role": "admin", "active": true},
  {"name": "Bob", "role": "user", "active": false}
]</code></pre>

    <h3><?= htmlspecialchars(t('example_ts_title'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><strong><?= htmlspecialchars(t('example_input'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <pre><code>{"id": 1, "name": "Product", "price": 29.99, "tags": ["sale"]}</code></pre>
    <p><strong><?= htmlspecialchars(t('example_output'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <pre><code>interface Root {
  id: number;
  name: string;
  price: number;
  tags: string[];
}</code></pre>

    <h3><?= htmlspecialchars(t('example_repair_title'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><strong><?= htmlspecialchars(t('example_input'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <pre><code>{name: 'Alice', active: true,}  // single quotes + trailing comma</code></pre>
    <p><strong><?= htmlspecialchars(t('example_output'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <pre><code>{"name": "Alice", "active": true}</code></pre>
  </section>

  <!-- Why Local -->
  <section>
    <h2><?= htmlspecialchars(t('why_local_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <table>
      <thead>
        <tr>
          <th><?= htmlspecialchars(t('why_concern'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('why_server'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('why_local'), ENT_QUOTES, 'UTF-8') ?></th>
        </tr>
      </thead>
      <tbody>
        <tr><td><?= htmlspecialchars(t('why_privacy'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('why_privacy_server'), ENT_QUOTES, 'UTF-8') ?></td><td><strong><?= htmlspecialchars(t('why_privacy_local'), ENT_QUOTES, 'UTF-8') ?></strong></td></tr>
        <tr><td><?= htmlspecialchars(t('why_pii'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('why_pii_server'), ENT_QUOTES, 'UTF-8') ?></td><td><strong><?= htmlspecialchars(t('why_pii_local'), ENT_QUOTES, 'UTF-8') ?></strong></td></tr>
        <tr><td><?= htmlspecialchars(t('why_offline'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('why_offline_server'), ENT_QUOTES, 'UTF-8') ?></td><td><strong><?= htmlspecialchars(t('why_offline_local'), ENT_QUOTES, 'UTF-8') ?></strong></td></tr>
        <tr><td><?= htmlspecialchars(t('why_speed'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('why_speed_server'), ENT_QUOTES, 'UTF-8') ?></td><td><strong><?= htmlspecialchars(t('why_speed_local'), ENT_QUOTES, 'UTF-8') ?></strong></td></tr>
        <tr><td><?= htmlspecialchars(t('why_determinism'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('why_determinism_server'), ENT_QUOTES, 'UTF-8') ?></td><td><strong><?= htmlspecialchars(t('why_determinism_local'), ENT_QUOTES, 'UTF-8') ?></strong></td></tr>
        <tr><td><?= htmlspecialchars(t('why_enterprise'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('why_enterprise_server'), ENT_QUOTES, 'UTF-8') ?></td><td><strong><?= htmlspecialchars(t('why_enterprise_local'), ENT_QUOTES, 'UTF-8') ?></strong></td></tr>
      </tbody>
    </table>

    <h3><?= htmlspecialchars(t('why_matters_title'), ENT_QUOTES, 'UTF-8') ?></h3>
    <ul>
      <li><?= htmlspecialchars(t('why_matters_1'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('why_matters_2'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('why_matters_3'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('why_matters_4'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('why_matters_5'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('why_matters_6'), ENT_QUOTES, 'UTF-8') ?></li>
    </ul>
  </section>

  <!-- Use Cases -->
  <section>
    <h2><?= htmlspecialchars(t('usecases_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <div class="grid-2">
      <div class="card-box">
        <h4><?= htmlspecialchars(t('usecase_enterprise'), ENT_QUOTES, 'UTF-8') ?></h4>
        <p><?= htmlspecialchars(t('usecase_enterprise_text'), ENT_QUOTES, 'UTF-8') ?></p>
      </div>
      <div class="card-box">
        <h4><?= htmlspecialchars(t('usecase_api'), ENT_QUOTES, 'UTF-8') ?></h4>
        <p><?= htmlspecialchars(t('usecase_api_text'), ENT_QUOTES, 'UTF-8') ?></p>
      </div>
      <div class="card-box">
        <h4><?= htmlspecialchars(t('usecase_data'), ENT_QUOTES, 'UTF-8') ?></h4>
        <p><?= htmlspecialchars(t('usecase_data_text'), ENT_QUOTES, 'UTF-8') ?></p>
      </div>
      <div class="card-box">
        <h4><?= htmlspecialchars(t('usecase_devops'), ENT_QUOTES, 'UTF-8') ?></h4>
        <p><?= htmlspecialchars(t('usecase_devops_text'), ENT_QUOTES, 'UTF-8') ?></p>
      </div>
      <div class="card-box">
        <h4><?= htmlspecialchars(t('usecase_edu'), ENT_QUOTES, 'UTF-8') ?></h4>
        <p><?= htmlspecialchars(t('usecase_edu_text'), ENT_QUOTES, 'UTF-8') ?></p>
      </div>
      <div class="card-box">
        <h4><?= htmlspecialchars(t('usecase_offline'), ENT_QUOTES, 'UTF-8') ?></h4>
        <p><?= htmlspecialchars(t('usecase_offline_text'), ENT_QUOTES, 'UTF-8') ?></p>
      </div>
    </div>
  </section>

  <!-- Privacy -->
  <section>
    <h2><?= htmlspecialchars(t('privacy_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <table>
      <thead>
        <tr>
          <th><?= htmlspecialchars(t('privacy_item'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('privacy_status'), ENT_QUOTES, 'UTF-8') ?></th>
        </tr>
      </thead>
      <tbody>
        <tr><td><?= htmlspecialchars(t('privacy_server'), ENT_QUOTES, 'UTF-8') ?></td><td class="status-never"><?= htmlspecialchars(t('privacy_server_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><?= htmlspecialchars(t('privacy_analytics'), ENT_QUOTES, 'UTF-8') ?></td><td class="status-none"><?= htmlspecialchars(t('privacy_analytics_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><?= htmlspecialchars(t('privacy_cookies'), ENT_QUOTES, 'UTF-8') ?></td><td class="status-none"><?= htmlspecialchars(t('privacy_cookies_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><?= htmlspecialchars(t('privacy_account'), ENT_QUOTES, 'UTF-8') ?></td><td class="status-none"><?= htmlspecialchars(t('privacy_account_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><?= htmlspecialchars(t('privacy_network'), ENT_QUOTES, 'UTF-8') ?></td><td class="status-none"><?= htmlspecialchars(t('privacy_network_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><?= htmlspecialchars(t('privacy_storage'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('privacy_storage_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
      </tbody>
    </table>
    <p><strong><?= htmlspecialchars(t('privacy_suitable'), ENT_QUOTES, 'UTF-8') ?>:</strong></p>
    <ul>
      <li><?= htmlspecialchars(t('privacy_suitable_1'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('privacy_suitable_2'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('privacy_suitable_3'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('privacy_suitable_4'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('privacy_suitable_5'), ENT_QUOTES, 'UTF-8') ?></li>
    </ul>
  </section>

  <!-- Privacy Manifesto -->
  <section>
    <h2><?= htmlspecialchars(t('manifesto_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><?= htmlspecialchars(t('manifesto_intro'), ENT_QUOTES, 'UTF-8') ?></p>
    <dl>
      <dt>1. <?= htmlspecialchars(t('manifesto_1'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('manifesto_1_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>2. <?= htmlspecialchars(t('manifesto_2'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('manifesto_2_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>3. <?= htmlspecialchars(t('manifesto_3'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('manifesto_3_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>4. <?= htmlspecialchars(t('manifesto_4'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('manifesto_4_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>5. <?= htmlspecialchars(t('manifesto_5'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('manifesto_5_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
    </dl>
    <p><em><?= htmlspecialchars(t('manifesto_footer'), ENT_QUOTES, 'UTF-8') ?></em></p>
  </section>

  <!-- Observability -->
  <section>
    <h2><?= htmlspecialchars(t('observability_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><?= htmlspecialchars(t('observability_intro'), ENT_QUOTES, 'UTF-8') ?></p>
    <table>
      <tbody>
        <tr><td><strong><?= htmlspecialchars(t('obs_what'), ENT_QUOTES, 'UTF-8') ?></strong></td><td><?= htmlspecialchars(t('obs_what_list'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong><?= htmlspecialchars(t('obs_how'), ENT_QUOTES, 'UTF-8') ?></strong></td><td><?= htmlspecialchars(t('obs_how_list'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><strong><?= htmlspecialchars(t('obs_not'), ENT_QUOTES, 'UTF-8') ?></strong></td><td><?= htmlspecialchars(t('obs_not_list'), ENT_QUOTES, 'UTF-8') ?></td></tr>
      </tbody>
    </table>
    <h3><?= htmlspecialchars(t('obs_disable'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><?= htmlspecialchars(t('obs_disable_code'), ENT_QUOTES, 'UTF-8') ?></p>
    <pre><code>&lt;script&gt;window.ANALYTICS_DISABLED = true;&lt;/script&gt;</code></pre>
  </section>

  <!-- PII & Enterprise -->
  <section>
    <h2><?= htmlspecialchars(t('pii_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><?= htmlspecialchars(t('pii_intro'), ENT_QUOTES, 'UTF-8') ?></p>
    <dl>
      <dt><?= htmlspecialchars(t('pii_gdpr'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('pii_gdpr_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt><?= htmlspecialchars(t('pii_hipaa'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('pii_hipaa_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt><?= htmlspecialchars(t('pii_sox'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('pii_sox_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt><?= htmlspecialchars(t('pii_audit'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('pii_audit_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt><?= htmlspecialchars(t('pii_selfhost'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('pii_selfhost_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
    </dl>
  </section>

  <!-- Air-gapped -->
  <section>
    <h2><?= htmlspecialchars(t('airgap_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><?= htmlspecialchars(t('airgap_intro'), ENT_QUOTES, 'UTF-8') ?></p>
    <h3><?= htmlspecialchars(t('airgap_how'), ENT_QUOTES, 'UTF-8') ?></h3>
    <ol>
      <li><?= htmlspecialchars(t('airgap_step1'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('airgap_step2'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('airgap_step3'), ENT_QUOTES, 'UTF-8') ?></li>
    </ol>
    <h3><?= htmlspecialchars(t('airgap_full'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><?= htmlspecialchars(t('airgap_full_desc'), ENT_QUOTES, 'UTF-8') ?></p>
    <pre><code>&lt;script&gt;window.ANALYTICS_DISABLED = true;&lt;/script&gt;
&lt;!-- Then download /tools/json/ folder for local hosting --&gt;</code></pre>
    <h3><?= htmlspecialchars(t('airgap_features'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><?= htmlspecialchars(t('airgap_features_list'), ENT_QUOTES, 'UTF-8') ?></p>
  </section>

  <!-- Deterministic -->
  <section>
    <h2><?= htmlspecialchars(t('deterministic_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><?= htmlspecialchars(t('deterministic_intro'), ENT_QUOTES, 'UTF-8') ?></p>
    <dl>
      <dt>1. <?= htmlspecialchars(t('deterministic_1'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('deterministic_1_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>2. <?= htmlspecialchars(t('deterministic_2'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('deterministic_2_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>3. <?= htmlspecialchars(t('deterministic_3'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('deterministic_3_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>4. <?= htmlspecialchars(t('deterministic_4'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('deterministic_4_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
      <dt>5. <?= htmlspecialchars(t('deterministic_5'), ENT_QUOTES, 'UTF-8') ?></dt>
      <dd><?= htmlspecialchars(t('deterministic_5_desc'), ENT_QUOTES, 'UTF-8') ?></dd>
    </dl>
    <p><em><?= htmlspecialchars(t('deterministic_outro'), ENT_QUOTES, 'UTF-8') ?></em></p>
  </section>

  <!-- Shortcuts -->
  <section>
    <h2><?= htmlspecialchars(t('shortcuts_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <table>
      <thead>
        <tr>
          <th><?= htmlspecialchars(t('shortcut'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('action'), ENT_QUOTES, 'UTF-8') ?></th>
        </tr>
      </thead>
      <tbody>
        <tr><td><kbd>?</kbd></td><td><?= htmlspecialchars(t('shortcut_help'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td><?= htmlspecialchars(t('shortcut_run'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>1-9</kbd></td><td><?= htmlspecialchars(t('shortcut_tabs'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Tab</kbd></td><td><?= htmlspecialchars(t('shortcut_next'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Tab</kbd></td><td><?= htmlspecialchars(t('shortcut_prev'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd></td><td><?= htmlspecialchars(t('shortcut_copy'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><kbd>Escape</kbd></td><td><?= htmlspecialchars(t('shortcut_close'), ENT_QUOTES, 'UTF-8') ?></td></tr>
      </tbody>
    </table>
  </section>

  <!-- Policies -->
  <section>
    <h2><?= htmlspecialchars(t('policies_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    
    <h3><?= htmlspecialchars(t('policy_deps'), ENT_QUOTES, 'UTF-8') ?></h3>
    <p><strong><?= htmlspecialchars(t('policy_deps_allowed'), ENT_QUOTES, 'UTF-8') ?>:</strong> <?= htmlspecialchars(t('policy_deps_allowed_text'), ENT_QUOTES, 'UTF-8') ?></p>
    <p><em><?= $lang === 'sv' ? 'Self-hosted i' : 'Self-hosted in' ?> <code>/vendor/</code>:</em></p>
    <ul>
      <li><code>papaparse.min.js</code> — CSV parsing (RFC 4180)</li>
      <li><code>js-yaml.min.js</code> — YAML parsing (YAML 1.2)</li>
      <li><code>jsonrepair.min.js</code> — <?= $lang === 'sv' ? 'Reparera trasig JSON' : 'Broken JSON repair' ?></li>
      <li><code>lucide.min.js</code> — <?= $lang === 'sv' ? 'Ikonbibliotek' : 'Icon library' ?></li>
    </ul>
    <p><strong><?= htmlspecialchars(t('policy_deps_disallowed'), ENT_QUOTES, 'UTF-8') ?>:</strong> <?= htmlspecialchars(t('policy_deps_disallowed_text'), ENT_QUOTES, 'UTF-8') ?></p>

    <h3><?= htmlspecialchars(t('policy_local'), ENT_QUOTES, 'UTF-8') ?></h3>
    <ul>
      <li><?= htmlspecialchars(t('policy_local_1'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('policy_local_2'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('policy_local_3'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('policy_local_4'), ENT_QUOTES, 'UTF-8') ?></li>
    </ul>

    <h3><?= htmlspecialchars(t('policy_a11y'), ENT_QUOTES, 'UTF-8') ?></h3>
    <ul>
      <li><?= htmlspecialchars(t('policy_a11y_1'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('policy_a11y_2'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('policy_a11y_3'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><?= htmlspecialchars(t('policy_a11y_4'), ENT_QUOTES, 'UTF-8') ?></li>
    </ul>
  </section>

  <!-- Browser Support -->
  <section>
    <h2><?= htmlspecialchars(t('browser_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <table>
      <thead>
        <tr>
          <th><?= htmlspecialchars(t('browser'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('browser_status'), ENT_QUOTES, 'UTF-8') ?></th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Chrome 90+</td><td><?= htmlspecialchars(t('browser_full'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td>Firefox 90+</td><td><?= htmlspecialchars(t('browser_full'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td>Safari 14+</td><td><?= htmlspecialchars(t('browser_full'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td>Edge 90+</td><td><?= htmlspecialchars(t('browser_full'), ENT_QUOTES, 'UTF-8') ?></td></tr>
      </tbody>
    </table>
  </section>

  <!-- Tech -->
  <section>
    <h2><?= htmlspecialchars(t('tech_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <table>
      <thead>
        <tr>
          <th><?= htmlspecialchars(t('tech_metric'), ENT_QUOTES, 'UTF-8') ?></th>
          <th><?= htmlspecialchars(t('tech_value'), ENT_QUOTES, 'UTF-8') ?></th>
        </tr>
      </thead>
      <tbody>
        <tr><td><?= htmlspecialchars(t('tech_initial'), ENT_QUOTES, 'UTF-8') ?></td><td>~65 KB</td></tr>
        <tr><td><?= htmlspecialchars(t('tech_full'), ENT_QUOTES, 'UTF-8') ?></td><td>~395 KB</td></tr>
        <tr><td><?= htmlspecialchars(t('tech_languages'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('tech_languages_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        <tr><td><?= htmlspecialchars(t('tech_themes'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars(t('tech_themes_val'), ENT_QUOTES, 'UTF-8') ?></td></tr>
      </tbody>
    </table>
    <h3><?= htmlspecialchars(t('tech_libs'), ENT_QUOTES, 'UTF-8') ?></h3>
    <ul>
      <li><strong>PapaParse</strong> — CSV parsing</li>
      <li><strong>js-yaml</strong> — YAML parsing</li>
      <li><strong>jsonrepair</strong> — JSON repair</li>
      <li><strong>Lucide</strong> — UI icons</li>
    </ul>
  </section>

  <!-- Related -->
  <section>
    <h2><?= htmlspecialchars(t('related_title'), ENT_QUOTES, 'UTF-8') ?></h2>
    <p><em><?= htmlspecialchars(t('related_intro'), ENT_QUOTES, 'UTF-8') ?></em></p>
    <ul>
      <li><a href="/tools/passwordgenerator/">Password Generator</a> — <?= htmlspecialchars(t('related_password'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><a href="/tools/bildconverter/">Image Converter</a> — <?= htmlspecialchars(t('related_image'), ENT_QUOTES, 'UTF-8') ?></li>
      <li><a href="/tools/koordinat/">Coordinate Converter</a> — <?= htmlspecialchars(t('related_coord'), ENT_QUOTES, 'UTF-8') ?></li>
    </ul>
  </section>

</article>
</main>
<!-- ********** SLUT: JSON Toolbox Readme ********** -->

<?php include '../../includes/tool-layout-end.php'; ?>
