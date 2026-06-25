import { expect } from 'chai';
import { TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import BuildsDeploy from '../../../src/commands/builds/deploy.js';
import { FakeFileReader, RecordingRunner } from '../../helpers.js';

const BUILDFILE_PATH = 'buildfile.json';

const fullBuildfile = JSON.stringify({
  builds: [
    { type: 'metadata', manifestFile: 'package.xml', testLevel: 'RunSpecifiedTests', enableTracking: true },
    { type: 'datapack', manifestFile: 'job.yaml' },
    { type: 'anonymousApex', apexScript: 'go.apex' },
    {
      type: 'command',
      command: 'vlocity --nojob installVlocityInitial',
      addTargetOrg: true,
      targetOrgFormat: '-sfdx.username',
    },
  ],
});

/**
 * Run the command with injected fakes. Returns the runner so tests can assert on
 * the assembled commands, plus the command result.
 */
async function runDeploy(
  argv: string[],
  files: Record<string, string>
): Promise<{ runner: RecordingRunner; result: { stepsExecuted: number; totalSteps: number } }> {
  const runner = new RecordingRunner();
  const fileReader = new FakeFileReader(files);

  // Inject fakes through the command's `overrides` seam by subclassing: the
  // subclass captures the fakes from this closure and exposes them to run().
  class TestCmd extends BuildsDeploy {
    public override overrides = { runner, fileReader };
  }

  const result = await TestCmd.run(argv);
  return { runner, result };
}

describe('builds deploy', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('authenticates then runs every step when no target-org is given', async () => {
    const files = {
      [BUILDFILE_PATH]: fullBuildfile,
      'package.xml': '<Package><types><members>FooTest</members><name>ApexClass</name></types></Package>',
      'force-app/main/default/classes/FooTest.cls': '@IsTest public class FooTest {}',
    };

    const { runner, result } = await runDeploy(
      [
        '--buildfile',
        BUILDFILE_PATH,
        '--client-id',
        'cid',
        '--instance-url',
        'https://login.salesforce.com',
        '--username',
        'ci@example.com',
        '--jwt-key-file',
        'server.key',
      ],
      files
    );

    expect(result.stepsExecuted).to.equal(4);
    expect(result.totalSteps).to.equal(4);
    expect(runner.commandLine(0)).to.contain('sf org login jwt');
    expect(runner.calls.some((c) => c.args.join(' ').includes('project deploy start'))).to.be.true;
    expect(runner.calls.some((c) => c.command === 'vlocity')).to.be.true;
  });

  it('skips authentication when --target-org is provided', async () => {
    const files = {
      [BUILDFILE_PATH]: JSON.stringify({
        builds: [{ type: 'metadata', manifestFile: 'package.xml', testLevel: 'NoTestRun' }],
      }),
    };

    const { runner, result } = await runDeploy(['--buildfile', BUILDFILE_PATH, '--target-org', 'my-alias'], files);

    expect(result.stepsExecuted).to.equal(1);
    expect(runner.calls.some((c) => c.args.join(' ').includes('org login jwt'))).to.be.false;
    // tracking disabled (enableTracking falsy) then deploy
    expect(runner.commandLine(0)).to.equal('sf org disable tracking --target-org my-alias');
    expect(runner.commandLine(1)).to.contain('--test-level NoTestRun');
  });

  it('honors --initial-step', async () => {
    const files = { [BUILDFILE_PATH]: fullBuildfile };

    const { runner, result } = await runDeploy(
      ['--buildfile', BUILDFILE_PATH, '--target-org', 'my-alias', '--initial-step', '2'],
      files
    );

    expect(result.stepsExecuted).to.equal(2);
    expect(runner.calls.some((c) => c.args.join(' ').includes('project deploy start'))).to.be.false;
    expect(runner.calls.some((c) => c.args.join(' ').includes('apex run'))).to.be.true;
  });
});
