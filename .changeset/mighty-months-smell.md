---
'steiger': minor
---

Steiger now resolves `steiger.config.*` from the lint target path instead of the current working directory.
A configuration in the working directory no longer applies when the target is outside its directory tree.
