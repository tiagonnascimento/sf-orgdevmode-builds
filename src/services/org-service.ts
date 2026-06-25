import { Logger, silentLogger } from './logger.js';
import { ProcessRunner } from './process-runner.js';

/**
 * Org-level operations performed around build steps.
 */
export class OrgService {
  public constructor(private readonly runner: ProcessRunner, private readonly logger: Logger = silentLogger) {}

  /**
   * Disable source tracking on the target org (`sf org disable tracking`).
   *
   * Pipelines using the artifact-based model normally want tracking off so that
   * deploys are not reshaped by per-environment tracking state.
   */
  public async disableTracking(targetOrg: string): Promise<void> {
    this.logger.log('Disabling source tracking on the target org');
    return this.runner.run('sf', ['org', 'disable', 'tracking', '--target-org', targetOrg]);
  }
}
