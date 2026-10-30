---
'steiger': patch
---

Replace `prexit` with native Node.js process handlers. Watch mode now waits for the file watcher to close when shutting down in response to a signal, and uncaught exceptions and unhandled promise rejections exit with a non-zero status instead of reporting success.
