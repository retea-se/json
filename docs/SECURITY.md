# Security

- Data handling: client-only; no data leaves browser.
- No secrets stored or required.
- Dependencies: vendor JS pinned (js-yaml, papaparse, lucide). Update manually and test.
- XSS considerations: user input is data-only; rendering escapes JSON string outputs.
- CSP: not enforced in static version; if served with CSP, allow inline scripts or move to bundled build.
- Privacy: zero telemetry by default; remove `modules/analytics.js` include to guarantee.
