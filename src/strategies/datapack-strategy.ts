import { DatapackBuild } from '../domain/buildfile.js';
import { BuildStrategy, CommandSpec } from './types.js';

/**
 * Builds a `vlocity ... packDeploy` invocation for a `datapack` step
 * (Salesforce Industries / Vlocity Build Tool).
 */
export class DatapackStrategy implements BuildStrategy<DatapackBuild> {
  // eslint-disable-next-line class-methods-use-this -- instance method required by the BuildStrategy interface
  public build(build: DatapackBuild, targetOrg: string): CommandSpec {
    return {
      command: 'vlocity',
      args: ['-sfdx.username', targetOrg, '-job', build.manifestFile, 'packDeploy'],
      cwd: build.workingFolder,
    };
  }
}
