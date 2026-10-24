---
'steiger': minor
---

Steiger now resolves `steiger.config.*` from the lint target path instead of the current working directory.
A configuration in the working directory no longer applies when the target is outside its directory tree.
The nearest configuration is used across nested packages. Search stops at the closest Git repository root, or at the filesystem root outside Git repositories.
