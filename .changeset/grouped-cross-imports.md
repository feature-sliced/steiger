---
'@feature-sliced/steiger-plugin': patch
---

Fix false cross-import errors when a grouped slice imports through a file-based `@x` public API, such as `role/@x/security-module/user.ts`.
