import { StrategyRegistry } from '../strategies/registry.js';
import { ApexTestDiscovery } from './apex-test-discovery.js';
import { AuthService } from './auth.js';
import { BuildOrchestrator } from './build-orchestrator.js';
import { fsFileReader, FileReader } from './file-reader.js';
import { Logger, silentLogger } from './logger.js';
import { OrgService } from './org-service.js';
import { ProcessRunner } from './process-runner.js';

/**
 * Overridable collaborators — supplied by tests to inject fakes. Anything not
 * provided falls back to the real, side-effecting implementation.
 */
export type ContainerOverrides = {
  logger?: Logger;
  fileReader?: FileReader;
  runner?: ProcessRunner;
};

/**
 * The wired-up object graph the command needs.
 */
export type Container = {
  auth: AuthService;
  orchestrator: BuildOrchestrator;
  fileReader: FileReader;
};

/**
 * Composition root: build the dependency graph in one place.
 *
 * Keeping construction here (rather than in the oclif command) means the command
 * stays a thin adapter and every collaborator is swappable in tests via
 * {@link ContainerOverrides}.
 */
export function createContainer(overrides: ContainerOverrides = {}): Container {
  const logger = overrides.logger ?? silentLogger;
  const fileReader = overrides.fileReader ?? fsFileReader;
  const runner = overrides.runner ?? new ProcessRunner(logger);

  const apexTestDiscovery = new ApexTestDiscovery(fileReader, logger);
  const registry = new StrategyRegistry(apexTestDiscovery);
  const orgService = new OrgService(runner, logger);

  return {
    auth: new AuthService(runner, logger),
    orchestrator: new BuildOrchestrator(registry, runner, orgService, logger),
    fileReader,
  };
}
