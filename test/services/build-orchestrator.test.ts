import { expect } from 'chai';
import { BuildOrchestrator } from '../../src/services/build-orchestrator.js';
import { OrgService } from '../../src/services/org-service.js';
import { ApexTestDiscovery } from '../../src/services/apex-test-discovery.js';
import { StrategyRegistry } from '../../src/strategies/registry.js';
import { Buildfile } from '../../src/domain/buildfile.js';
import { FakeFileReader, RecordingRunner } from '../helpers.js';

function orchestratorWith(runner: RecordingRunner, files: Record<string, string> = {}): BuildOrchestrator {
  const registry = new StrategyRegistry(new ApexTestDiscovery(new FakeFileReader(files)));
  return new BuildOrchestrator(registry, runner, new OrgService(runner));
}

const fourStepBuildfile: Buildfile = {
  builds: [
    { type: 'metadata', manifestFile: 'package.xml', enableTracking: true },
    { type: 'datapack', manifestFile: 'job.yaml' },
    { type: 'anonymousApex', apexScript: 'go.apex' },
    {
      type: 'command',
      command: 'vlocity --nojob installVlocityInitial',
      addTargetOrg: true,
      targetOrgFormat: '-sfdx.username',
    },
  ],
};

describe('BuildOrchestrator', () => {
  it('runs every step in order against the target org', async () => {
    const runner = new RecordingRunner();
    const executed = await orchestratorWith(runner).run(fourStepBuildfile, 'my-org');

    expect(executed).to.equal(4);
    expect(runner.calls.map((c) => c.command)).to.deep.equal(['sf', 'vlocity', 'sf', 'vlocity']);
    expect(runner.commandLine(0)).to.contain('project deploy start');
    expect(runner.commandLine(3)).to.contain('vlocity --nojob installVlocityInitial -sfdx.username my-org');
  });

  it('disables tracking before a metadata step when enableTracking is falsy', async () => {
    const runner = new RecordingRunner();
    await orchestratorWith(runner).run({ builds: [{ type: 'metadata', manifestFile: 'package.xml' }] }, 'my-org');

    expect(runner.commandLine(0)).to.equal('sf org disable tracking --target-org my-org');
    expect(runner.commandLine(1)).to.contain('project deploy start');
  });

  it('does NOT disable tracking when enableTracking is true', async () => {
    const runner = new RecordingRunner();
    await orchestratorWith(runner).run(
      { builds: [{ type: 'metadata', manifestFile: 'package.xml', enableTracking: true }] },
      'my-org'
    );

    expect(runner.calls).to.have.length(1);
    expect(runner.commandLine(0)).to.contain('project deploy start');
  });

  it('skips steps before initialStep', async () => {
    const runner = new RecordingRunner();
    const executed = await orchestratorWith(runner).run(fourStepBuildfile, 'my-org', 2);

    expect(executed).to.equal(2);
    expect(runner.calls.map((c) => c.command)).to.deep.equal(['sf', 'vlocity']);
    expect(runner.commandLine(0)).to.contain('apex run');
  });

  it('propagates workingFolder to the runner cwd', async () => {
    const runner = new RecordingRunner();
    await orchestratorWith(runner).run(
      { builds: [{ type: 'datapack', manifestFile: 'job.yaml', workingFolder: 'vlocity' }] },
      'my-org'
    );
    expect(runner.calls[0].options.cwd).to.equal('vlocity');
  });
});
