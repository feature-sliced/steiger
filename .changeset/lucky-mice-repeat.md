---
'@feature-sliced/steiger-plugin': minor
'@steiger/toolkit': minor
'@steiger/types': minor
'steiger': minor
---

Implement auto-fixing for `repetitive-naming`.

The rule can now rename repetitive slice names and update references to them, including imports, re-exports, dynamic imports, and `require()` calls. Fixes are only offered when the rename and all affected references can be updated safely.

This also extends the fix engine with composable `edit-file` fixes, ordered fix application, and conflict detection for incompatible or overlapping fixes.
