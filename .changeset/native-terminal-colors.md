---
'steiger': patch
---

Replace direct `picocolors` usage in CLI prompts and the pretty reporter with Node.js built-in `util.styleText`, and remove the direct dependency. Reporter color detection now uses stderr, where diagnostics are printed.
