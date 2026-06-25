import { AnonymousApexBuild } from '../domain/buildfile.js';
import { BuildStrategy, CommandSpec } from './types.js';

/**
 * Builds a `sf apex run` invocation for an `anonymousApex` step.
 */
export class AnonymousApexStrategy implements BuildStrategy<AnonymousApexBuild> {
  // eslint-disable-next-line class-methods-use-this -- instance method required by the BuildStrategy interface
  public build(build: AnonymousApexBuild, targetOrg: string): CommandSpec {
    return {
      command: 'sf',
      args: ['apex', 'run', '--target-org', targetOrg, '--file', build.apexScript, '--json'],
      cwd: build.workingFolder,
    };
  }
}
