# Architecture (JSON Toolbox)

- Type: Static single-page tool (no backend).
- Entry: `index.php` / `index-zero-telemetry.php` serve static assets.
- Core modules: `modules/*.js` (UI + logic), `operators/*.js` (operations), `modules/pipeline-ui.js` (pipeline builder), `modules/analytics.js` (optional analytics).
- Build: none required for web; CLI has its own build in `cli/`.
- Data flow:
  - Input parsers (csv/xml/yaml/css) → normalized JSON → operators (format/validate/repair/diff/query/schema/transform) → render via UI components.
- Dependencies: client-side vendor libs (`vendor/js-yaml.min.js`, `vendor/papaparse.min.js`, `vendor/lucide.min.js`).
- Hosting: static files under `mackan.eu/tools/json`.
- Persistence: none; all in-browser.
- Telemetry: zero by default; optional analytics module can be disabled by removing `modules/analytics.js` include.
