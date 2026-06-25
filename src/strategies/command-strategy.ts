import parseArgsStringToArgv from 'string-argv';
import { CommandBuild } from '../domain/buildfile.js';
import { BuildStrategy, CommandSpec } from './types.js';

const DEFAULT_TARGET_ORG_FORMAT = '--target-org';

/**
 * Builds an arbitrary CLI invocation for a `command` step.
 *
 * The command string is tokenized with `string-argv`, which honors quoting — so
 * `echo "hello world"` becomes `['echo', 'hello world']` rather than being split
 * naively on spaces. When `addTargetOrg` is set, the resolved org is appended
 * using `targetOrgFormat` (default `--target-org`).
 */
export class CommandStrategy implements BuildStrategy<CommandBuild> {
  // eslint-disable-next-line class-methods-use-this -- instance method required by the BuildStrategy interface
  public build(build: CommandBuild, targetOrg: string): CommandSpec {
    const [command, ...args] = parseArgsStringToArgv(build.command);

    if (!command) {
      throw new Error('The "command" step has an empty command');
    }

    if (build.addTargetOrg) {
      args.push(build.targetOrgFormat ?? DEFAULT_TARGET_ORG_FORMAT, targetOrg);
    }

    return { command, args, cwd: build.workingFolder };
  }
}
