---
"steiger": patch
"@feature-sliced/steiger-plugin": patch
---

Replace legacy `__dirname` usage with `import.meta.dirname` and remove the obsolete CommonJS shim injection so the packages work cleanly in modern ESM runtimes.
