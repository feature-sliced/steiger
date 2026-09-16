---
'@feature-sliced/steiger-plugin': minor
'@steiger/toolkit': minor
'@steiger/types': minor
'steiger': minor
---

Implement auto-fixing for `repetitive-naming`

When the repetitive word is a trailing word of every slice name in a layer or group, the rule now offers
to rename the slices and rewrite every import, re-export, dynamic import and `require` that points at
them. The names keep their original casing and separators.

Fix eligibility is all-or-nothing: the diagnostic is reported without fixes if any part of the rename
can't be worked out safely, whether that's a word that is only a prefix, a word that appears twice in
one name, a name that would become empty, a colliding target name, a group with several repetitive
words, or a reference that can't be rewritten with certainty. Applying the fixes is not transactional, though. They run in a defined order (file
contents are edited before the folders around them are renamed), and a failure partway through leaves
the fixes that already ran in place.

This also extends the fix engine:

- a new `edit-file` fix type carries a set of text edits, so that fixes from different diagnostics
  touching the same file compose instead of overwriting each other;
- fixes are applied in phases (`create-folder` → `create-file` → `modify-file` → `edit-file` →
  `rename`, deepest first → `delete`) instead of all concurrently;
- conflicting combinations of fixes (e.g. `modify-file` + `edit-file` on one path, two renames with the
  same destination, overlapping edits) are rejected up front, leaving the project untouched.
