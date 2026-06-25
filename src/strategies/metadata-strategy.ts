import { MetadataBuild } from '../domain/buildfile.js';
import { ApexTestDiscovery } from '../services/apex-test-discovery.js';
import { BuildStrategy, CommandSpec } from './types.js';

const DEFAULT_TEST_LEVEL = 'RunLocalTests';

/**
 * Builds a `sf project deploy start` invocation for a `metadata` step.
 *
 * When `testLevel` is `RunSpecifiedTests`, the concrete `--tests` list is
 * resolved from the `@IsTest` classes referenced by the manifest; an empty
 * result is treated as a configuration error.
 */
export class MetadataStrategy implements BuildStrategy<MetadataBuild> {
  public constructor(private readonly apexTestDiscovery: ApexTestDiscovery) {}

  public async build(build: MetadataBuild, targetOrg: string): Promise<CommandSpec> {
    const args = ['project', 'deploy', 'start', '--verbose', '--manifest', build.manifestFile, '--target-org', targetOrg]; // prettier-ignore

    if (build.preDestructiveChanges) {
      args.push('--pre-destructive-changes', build.preDestructiveChanges);
    }
    if (build.postDestructiveChanges) {
      args.push('--post-destructive-changes', build.postDestructiveChanges);
    }

    args.push(...(await this.resolveTestLevelArgs(build)));

    if (build.ignoreWarnings) {
      args.push('--ignore-warnings');
    }
    if (build.timeout) {
      args.push('--wait', build.timeout);
    }
    if (build.outputFormat === 'json') {
      args.push('--json');
    }

    return { command: 'sf', args, cwd: build.workingFolder };
  }

  private async resolveTestLevelArgs(build: MetadataBuild): Promise<string[]> {
    if (build.testLevel === 'RunSpecifiedTests') {
      const testClasses = await this.apexTestDiscovery.getTestClasses(build.manifestFile, build.classPath);
      if (testClasses.length === 0) {
        throw new Error('You should have at least one test class on your package.xml');
      }
      return ['--test-level', 'RunSpecifiedTests', '--tests', ...testClasses];
    }

    return ['--test-level', build.testLevel ?? DEFAULT_TEST_LEVEL];
  }
}
