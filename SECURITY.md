# Security Policy

## JSON Toolbox Security Model

JSON Toolbox is a **client-side only** developer utility. All data processing occurs
exclusively in your web browser. This document outlines our security model.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Your Browser                       │
│  ┌───────────────────────────────────────────────┐  │
│  │              JSON Toolbox                      │  │
│  │                                                │  │
│  │  Input → JavaScript Processing → Output        │  │
│  │                                                │  │
│  │  • All operations in-memory                    │  │
│  │  • No data transmitted                         │  │
│  │  • No backend processing                       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ✕ No data leaves browser
                         │
┌─────────────────────────────────────────────────────┐
│                   Server                             │
│                                                      │
│  Static file serving only:                          │
│  • HTML, CSS, JavaScript                            │
│  • Vendor libraries (self-hosted)                   │
│  • No API endpoints for user data                   │
│  • No data processing backend                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### What Stays Local
- **All user input** - JSON, CSV, XML, YAML, CSS
- **All processing** - Conversion, validation, formatting
- **All output** - Generated JSON, TypeScript, schemas
- **Clipboard operations** - Paste, copy

### What Is Transmitted (Optional)
- **Analytics only** - Aggregate usage data (cookieless, no identifiers)
- **Can be disabled** - Set `window.ANALYTICS_DISABLED = true`

## Threat Model

### Protected Against
| Threat | Mitigation |
|--------|------------|
| Data exfiltration | No network transmission of user data |
| Man-in-the-middle | All static assets; HTTPS in production |
| Session hijacking | No sessions, no cookies, no auth |
| Cross-site scripting (XSS) | CSP headers; no dynamic HTML injection of user data |
| Data persistence | Optional localStorage only for preferences |
| Third-party tracking | No external scripts; self-hosted analytics |

### Out of Scope
- Browser security vulnerabilities
- Local machine compromise
- Physical access attacks
- Malicious browser extensions

## Analytics Security

Analytics (when enabled) follows these security principles:

```javascript
// Configuration in analytics.js
_paq.push(['disableCookies']);           // No tracking cookies
_paq.push(['setDoNotTrack', true]);      // Respects browser DNT
_paq.push(['disableBrowserFeatureDetection']); // No fingerprinting
_paq.push(['setRequestMethod', 'POST']); // No URL logging
```

### Analytics Data Flow
1. **Collected**: Page view, tab switch, operation type (e.g., "format")
2. **Not collected**: User data, identifiers, session info, IP (anonymized)
3. **Destination**: Self-hosted Matomo on same infrastructure
4. **Retention**: Standard Matomo retention policies

### Disable Analytics
```html
<script>window.ANALYTICS_DISABLED = true;</script>
```

## Local Storage Usage

JSON Toolbox uses `localStorage` for:
- Theme preference
- Language preference
- Last input per tab (for convenience)

### Clear All Data
```javascript
localStorage.clear();
```
Or use the "Clear saved data" option in the UI.

## Self-Hosting

For maximum security, self-host JSON Toolbox:

1. Download the `/tools/json/` directory
2. Disable analytics: Add `window.ANALYTICS_DISABLED = true;`
3. Serve via any static file server
4. No backend required

## Dependency Security

All dependencies are:
- **Self-hosted** in `/vendor/`
- **No CDN** dependencies
- **No runtime fetching**

| Library | Purpose | Security Notes |
|---------|---------|----------------|
| PapaParse | CSV parsing | RFC 4180 compliant, no network |
| js-yaml | YAML parsing | YAML 1.2, safe schema default |
| jsonrepair | JSON fixing | Deterministic, no network |
| Lucide | Icons | SVG only, no external requests |

## Vulnerability Reporting

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: security@mackan.eu
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### Response Timeline
- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix deployment**: Depends on severity

## Compliance Notes

JSON Toolbox architecture supports:

| Regulation | How |
|------------|-----|
| GDPR | No personal data collected or processed server-side |
| HIPAA | PHI never leaves browser; no third-party transmission |
| SOX | Deterministic, auditable local processing |
| CCPA | No sale or sharing of personal information |

## Security Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-01-20 | 2.0 | Added privacy-first analytics (cookieless, self-hosted) |
| 2026-01-15 | 1.9 | Initial SECURITY.md |

---

*Last updated: 2026-01-20*
