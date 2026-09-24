---
'@feature-sliced/steiger-plugin': patch
---

Detect `require()` calls anywhere in a module, not only at the top level. Rules that check imports now also see a `require` inside a function or a block.
