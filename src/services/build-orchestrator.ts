import { Build, Buildfile } from '../domain/buildfile.js';
import { StrategyRegistry } from '../strategies/registry.js';
import { Logger, silentLogger } from './logger.js';
import { OrgService } from './org-service.js';
import { ProcessRunner } from './process-runner.js';

/**
 * Runs the ordered list of build steps from a {@link Buildfile} against a target org.
 *
 * Responsibilities are intentionally narrow: decide which steps to run (honoring
 * `initialStep`), apply the source-tracking side effect for metadata steps, then
 * delegate command construction to the {@link StrategyRegistry} and execution to
 * the {@link ProcessRunner}. It knows nothing about oclif, flags, or how the
 * buildfile was loaded.
 */
export class BuildOrchestrator {
  public constructor(
    private readonly registry: StrategyRegistry,
    private readonly runner: ProcessRunner,
    private readonly orgService: OrgService,
    private readonly logger: Logger = silentLogger
  ) {}

  /**
   * Execute the buildfile.
   *
   * @param buildfile - the validated buildfile
   * @param targetOrg - resolved org alias/username every step deploys to
   * @param initialStep - zero-based index of the first step to run (earlier steps are skipped)
   * @returns the number of steps actually executed
   */
  public async run(buildfile: Buildfile, targetOrg: string, initialStep = 0): Promise<number> {
    const { builds } = buildfile;
    let executed = 0;

    for (const [index, build] of builds.entries()) {
      if (index < initialStep) {
        this.logger.log(`Skipping step ${index} (${build.type})`);
        continue;
      }

      this.logger.log(`--- step ${index}: ${build.type} ---`);
      // eslint-disable-next-line no-await-in-loop -- steps are intentionally sequential
      await this.runStep(build, targetOrg);
      executed++;
    }

    return executed;
  }

  private async runStep(build: Build, targetOrg: string): Promise<void> {
    if (build.type === 'metadata' && !build.enableTracking) {
      await this.orgService.disableTracking(targetOrg);
    }

    const spec = await this.registry.resolve(build, targetOrg);
    await this.runner.run(spec.command, spec.args, { cwd: spec.cwd });
  }
}
