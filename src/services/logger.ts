/**
 * Minimal logging surface used throughout the plugin.
 *
 * `SfCommand` satisfies this interface (`log`/`warn`), which lets the domain and
 * service layers stay decoupled from oclif while still routing output through
 * the command's UX (and honoring `--json`). Tests pass a capturing fake.
 */
export type Logger = {
  log(message?: string): void;
  warn(message: string): void;
};

/**
 * A {@link Logger} that discards everything. Handy as a default in unit tests.
 */
export const silentLogger: Logger = {
  log: () => {},
  warn: () => {},
};
