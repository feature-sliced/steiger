---
'steiger': patch
---

Upgrade `zod` from 3 to 4, which fixes [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) (high severity) in zod 3, and `zod-validation-error` from 3 to 5 to match. Configuration validation accepts the same configs as before; the messages printed for an invalid configuration are now formatted from zod 4 issues.
