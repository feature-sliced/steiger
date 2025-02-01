# How to write integration tests

> [!NOTE]
> You should develop tests on either Mac or Linux. If you have a Windows machine, consider using a [devcontainer](containers.dev).
>
> This is mainly because the Unicode symbols used in the output are always replaced by fallbacks on Windows, so converting outputs from Windows to POSIX isn't practical.

Create a new file with the `.test.ts` extension in the `tests/` folder. Use `tests/smoke.test.ts` as a reference on how to set up a temporary folder for the project and execute Steiger.

Store your output snapshots in `__snapshots__` with the `-posix.txt` extension. After you wrote your test, run `pnpm update-windows-snapshots` to copy over the changes in snapshots.

## Updating both snapshots

To update snapshots on POSIX and Windows, run the following commands:

```
pnpm run test --update
pnpm update-windows-snapshots
```
