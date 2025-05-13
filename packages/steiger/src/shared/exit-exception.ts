/** For cases when the person requests to exit the program in an interactive choice. */
export class ExitException extends Error {}

/** Run the callback that might throw an `ExitException` and exit the process if that happened. */
export async function handleExitRequest<ReturnType>(
  callback: () => ReturnType | Promise<ReturnType>,
  { exitCode }: { exitCode: number },
) {
  try {
    return await callback()
  } catch (e) {
    if (e instanceof ExitException) {
      process.exit(exitCode)
    } else {
      throw e
    }
  }
}
