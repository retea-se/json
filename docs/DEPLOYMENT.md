# Deployment

- Target: `mackan.eu/tools/json`
- Method: manual upload/rsync of static files (no build step required for web UI)
- Minimal set: `index.php`, `index-zero-telemetry.php`, `modules/`, `operators/`, `modules/*.js`, `vendor/`, `style.css`, `script.js`, assets/
- CLI (optional): build in `cli/` via `node cli/build/build-all.js`, upload `cli/dist/*` if you ship CLI binaries.
- Rollback: restore previous static snapshot (keep last deploy zipped), or git revert + redeploy.
- Smoke after deploy: open page, run CSV→JSON and JSON→YAML conversions, check Console for errors.
