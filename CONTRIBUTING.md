# Contributing to JSON Toolbox

## Philosophy

JSON Toolbox is a **deterministic developer utility**. Contributions must preserve:

- Local-only execution (no server calls during operation)
- Zero telemetry (no user tracking)
- Deterministic output (same input → same output)
- No external dependencies at runtime

## What We Accept

✓ Bug fixes  
✓ Performance improvements  
✓ Accessibility improvements  
✓ i18n additions  
✓ New conversion modules (if they follow the pattern)  
✓ Documentation improvements  

## What We Don't Accept

✗ External service integrations  
✗ CDN dependencies  
✗ Telemetry or tracking  
✗ Frameworks or build systems  
✗ Features requiring server-side processing  

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Test locally (open `index.php` in browser)
5. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
6. Open a Pull Request

## Code Style

- Vanilla JavaScript (no frameworks)
- Module pattern for new capabilities
- Follow existing file structure
- Support both Swedish and English (add i18n keys)

## Module Pattern

New modules should follow this structure:

```javascript
(function() {
  'use strict';
  
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;
  
  function init() {
    const panel = document.getElementById('content-modulename');
    if (!panel) return;
    // ... render UI
  }
  
  document.addEventListener('tabchange', (e) => {
    if (e.detail.tab === 'modulename') init();
  });
})();
```

## Testing

- Open in browser, test all operations
- Verify offline functionality
- Check both light and dark themes
- Test keyboard shortcuts
- Verify i18n in both languages

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new module
fix: correct parsing edge case
docs: update README
chore: reorganize folder structure
```

## Questions?

Open an issue for discussion before large changes.
