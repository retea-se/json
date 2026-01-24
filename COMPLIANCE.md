# JSON Toolbox - Compliance Documentation

**Version:** 2.0.0  
**Last Updated:** 2026-01-20

This document describes JSON Toolbox's compliance posture for enterprise, air-gapped, and regulated environments.

---

## Executive Summary

JSON Toolbox is designed with privacy-first principles and enterprise compliance in mind:

| Guarantee | Standard Build | Compliance Mode | Zero-Telemetry Build |
|-----------|---------------|-----------------|---------------------|
| Local-only execution | Yes | Yes | Yes |
| Deterministic output | Yes | Yes | Yes |
| Offline capability | Yes | Yes | Yes |
| Analytics | Off by default | Disabled | Code removed |
| Persistent storage | localStorage | Disabled | Disabled |
| External network calls | None (default) | None | None |
| Third-party dependencies | None | None | None |

---

## Zero Telemetry by Default

**As of version 2.0.0, JSON Toolbox makes ZERO network calls by default.**

- Analytics are **opt-in only** (user must explicitly enable)
- No tracking pixels, beacons, or telemetry streams
- No external fonts, CDNs, or script loading
- No third-party services or APIs

### How Analytics Work (When Enabled)

If a user explicitly opts in to analytics:

1. Self-hosted Matomo instance only (stats.mackan.eu)
2. Cookieless tracking (no persistent identifiers)
3. No user fingerprinting
4. No session replay or heatmaps
5. Aggregate data only (no individual tracking)

**To opt in:** Set `localStorage['json-toolbox-analytics-enabled'] = 'true'` and reload.

---

## Compliance Mode

Compliance mode provides maximum isolation for regulated environments.

### Activation

Compliance mode can be activated via:

1. **URL parameter:** `?compliance=1`
2. **Environment variable:** `JSON_TOOLBOX_COMPLIANCE=true`
3. **JavaScript (before page load):** `window.JSON_TOOLBOX_COMPLIANCE = true`

### Behavior in Compliance Mode

| Component | Behavior |
|-----------|----------|
| Analytics | Completely disabled (no-op API) |
| localStorage | Disabled (in-memory only, not persisted) |
| Network calls | Zero (none made) |
| External links | Present but no automatic loading |

### Verification

When compliance mode is active:
- Console shows: `[JSON Toolbox] Compliance mode active`
- `window.JSON_TOOLBOX_COMPLIANCE === true`
- `window.JSONToolbox.isComplianceMode() === true`

---

## Zero-Telemetry Build

For maximum assurance, use the zero-telemetry build which **excludes all analytics code paths**.

### Usage

**Option 1: Direct access**
```
/tools/json/index-zero-telemetry.php
```

**Option 2: Deploy as main entry point**
```bash
cp index-zero-telemetry.php index.php
```

**Option 3: Environment variable**
```bash
JSON_TOOLBOX_ZERO_TELEMETRY=true
```

### Guarantees

- `modules/analytics.js` is **not loaded** (script tag omitted)
- No analytics initialization code runs
- No Matomo tracker loaded
- Compliance mode automatically enabled

---

## Offline Capability

JSON Toolbox works fully offline after initial page load:

1. All JavaScript is self-hosted (no CDN)
2. All CSS is self-hosted (no external fonts)
3. No API calls required for any operation
4. localStorage optional (disabled in compliance mode)

### Creating an Offline Bundle

```bash
# Download all files
wget -r -np -k https://mackan.eu/tools/json/

# Or use the zero-telemetry build
wget https://mackan.eu/tools/json/index-zero-telemetry.php
```

### Checksums

File integrity can be verified using SHA-256 checksums:

```bash
sha256sum tools/json/index.php
sha256sum tools/json/script.js
sha256sum tools/json/modules/*.js
```

---

## Network Surface Analysis

### Standard Build (Analytics Off)

| Request Type | Made? | Notes |
|-------------|-------|-------|
| fetch() | No | Never used |
| XMLHttpRequest | No | Never used |
| WebSocket | No | Never used |
| External scripts | No | All self-hosted |
| External CSS | No | All self-hosted |
| External fonts | No | System fonts only |
| Analytics | No | Opt-in only |

### Compliance Mode / Zero-Telemetry Build

| Request Type | Made? | Notes |
|-------------|-------|-------|
| Any network call | No | Guaranteed zero |

---

## Data Handling

### Input Data

- All input data is processed **locally in the browser**
- No data is ever sent to any server
- No data is stored on any server
- Input is discarded when browser tab closes (unless localStorage is used)

### Output Data

- All transformations are deterministic
- Same input + same options = same output
- No randomization in any operation
- No timestamps or machine identifiers injected

### localStorage (Standard Mode)

When localStorage is used (non-compliance mode):

- Data is stored with prefix `json-toolbox-`
- Size limit: 1MB per key
- User can clear all data via UI button
- No data sync to any server

### localStorage (Compliance Mode)

- All storage operations are no-ops
- Data exists only in memory during session
- No persistence between page reloads

---

## Enterprise Deployment

### Recommended Configuration

For enterprise environments:

1. Use `index-zero-telemetry.php` as entry point
2. Deploy behind corporate proxy/firewall
3. No external network access required
4. No configuration needed

### Audit Checklist

- [ ] Zero-telemetry build deployed
- [ ] No analytics script in page source
- [ ] Network tab shows no external requests
- [ ] localStorage disabled (compliance mode)
- [ ] All dependencies self-hosted

---

## Compliance Statements

### GDPR

JSON Toolbox in compliance mode / zero-telemetry build:
- Processes no personal data
- Makes no network calls
- Stores no data persistently
- Requires no consent banners

### HIPAA

JSON Toolbox in compliance mode / zero-telemetry build:
- No PHI transmitted to any server
- No logging of user activity
- Suitable for processing sensitive data locally

### Air-Gapped Environments

JSON Toolbox zero-telemetry build:
- Functions with no network connectivity
- No external dependencies
- No phone-home behavior
- No update checks

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-20 | Analytics default-off, compliance mode, zero-telemetry build |
| 1.0.0 | 2026-01-15 | Initial release with opt-out analytics |

---

## Contact

For compliance questions or enterprise licensing:
- Website: https://mackan.eu
- Repository: https://github.com/retea-se/json
