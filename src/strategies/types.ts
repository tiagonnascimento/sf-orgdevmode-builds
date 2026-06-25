import { Build } from '../domain/buildfile.js';

/**
 * A fully-resolved command to execute: the executable, its argument vector, and
 * an optional working directory. Produced by a {@link BuildStrategy} and consumed
 * by the process runner.
 */
export type CommandSpec = {
  command: string;
  args: string[];
  cwd?: string;
};

/**
 * Translates one variant of {@link Build} into the {@link CommandSpec} that
 * performs it. One strategy per build `type` — the Open/Closed seam that lets a
 * new step type be added without touching the orchestrator.
 *
 * @typeParam T - the specific build variant this strategy handles
 */
export type BuildStrategy<T extends Build = Build> = {
  /**
   * Build the command spec for a step.
   *
   * @param build - the (already validated) build step
   * @param targetOrg - resolved org alias/username
   */
  build(build: T, targetOrg: string): Promise<CommandSpec> | CommandSpec;
};
