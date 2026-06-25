import { expect } from 'chai';
import { DatapackStrategy } from '../../src/strategies/datapack-strategy.js';
import { AnonymousApexStrategy } from '../../src/strategies/anonymous-apex-strategy.js';
import { CommandStrategy } from '../../src/strategies/command-strategy.js';

describe('DatapackStrategy', () => {
  it('builds a vlocity packDeploy command', () => {
    const spec = new DatapackStrategy().build({ type: 'datapack', manifestFile: 'job.yaml' }, 'my-org');
    expect(spec.command).to.equal('vlocity');
    expect(spec.args.join(' ')).to.equal('-sfdx.username my-org -job job.yaml packDeploy');
  });

  it('propagates workingFolder as cwd', () => {
    const spec = new DatapackStrategy().build(
      { type: 'datapack', manifestFile: 'job.yaml', workingFolder: 'vlocity' },
      'my-org'
    );
    expect(spec.cwd).to.equal('vlocity');
  });
});

describe('AnonymousApexStrategy', () => {
  it('builds an apex run command', () => {
    const spec = new AnonymousApexStrategy().build({ type: 'anonymousApex', apexScript: 'go.apex' }, 'my-org');
    expect(spec.command).to.equal('sf');
    expect(spec.args.join(' ')).to.equal('apex run --target-org my-org --file go.apex --json');
  });
});

describe('CommandStrategy', () => {
  it('tokenizes a simple command', () => {
    const spec = new CommandStrategy().build(
      { type: 'command', command: 'vlocity --nojob installVlocityInitial' },
      'org'
    );
    expect(spec.command).to.equal('vlocity');
    expect(spec.args).to.deep.equal(['--nojob', 'installVlocityInitial']);
  });

  it('preserves quoted arguments containing spaces (the old split-on-space bug)', () => {
    const spec = new CommandStrategy().build({ type: 'command', command: 'echo "hello world"' }, 'org');
    expect(spec.command).to.equal('echo');
    expect(spec.args).to.deep.equal(['hello world']);
  });

  it('appends the target org using the default format', () => {
    const spec = new CommandStrategy().build({ type: 'command', command: 'sf foo', addTargetOrg: true }, 'my-org');
    expect(spec.args).to.deep.equal(['foo', '--target-org', 'my-org']);
  });

  it('appends the target org using a custom format', () => {
    const spec = new CommandStrategy().build(
      { type: 'command', command: 'vlocity x', addTargetOrg: true, targetOrgFormat: '-sfdx.username' },
      'my-org'
    );
    expect(spec.args).to.deep.equal(['x', '-sfdx.username', 'my-org']);
  });
});
