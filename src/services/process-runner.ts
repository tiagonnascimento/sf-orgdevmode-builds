import spawn from 'cross-spawn';
import { Logger, silentLogger } from './logger.js';

/**
 * Options for a single command execution.
 */
export type RunOptions = {
  /** Working directory for the child process. */
  cwd?: string;
};

/**
 * Runs external CLIs (`sf`, `vlocity`, arbitrary commands) as child processes.
 *
 * Uses cross-spawn with `shell: false`. Cross-platform: cross-spawn resolves
 * `.cmd`/`.bat` shims on Windows, so `sf`/`vlocity` work there without
 * `{ shell: true }` (fixing the long-standing "doesn't work on Windows" defect).
 * Injection-safe: arguments are passed as a real argv array and are never
 * re-interpreted by a shell, so values containing spaces or shell metacharacters
 * are preserved verbatim and cannot inject commands.
 *
 * @see https://github.com/moxystudio/node-cross-spawn
 */
export class ProcessRunner {
  public constructor(private readonly logger: Logger = silentLogger) {}

  /**
   * Execute a command and resolve when it exits successfully.
   *
   * @param command - executable to run (resolved on PATH)
   * @param args - argument vector (no shell quoting needed)
   * @param options - execution options (e.g. `cwd`)
   * @throws when the process exits with a non-zero code or fails to spawn
   */
  public async run(command: string, args: string[], options: RunOptions = {}): Promise<void> {
    this.logger.log(`Executing command: ${command} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        stdio: 'inherit',
        shell: false,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command "${command}" exited with code ${code ?? 'null'}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}
