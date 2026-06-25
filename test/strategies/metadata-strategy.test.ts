import { expect } from 'chai';
import { MetadataStrategy } from '../../src/strategies/metadata-strategy.js';
import { ApexTestDiscovery } from '../../src/services/apex-test-discovery.js';
import { MetadataBuild } from '../../src/domain/buildfile.js';
import { FakeFileReader } from '../helpers.js';

function strategyWith(files: Record<string, string>): MetadataStrategy {
  return new MetadataStrategy(new ApexTestDiscovery(new FakeFileReader(files)));
}

describe('MetadataStrategy', () => {
  it('builds a deploy command with the default test level when none is given', async () => {
    const build: MetadataBuild = { type: 'metadata', manifestFile: 'package.xml' };
    const spec = await strategyWith({}).build(build, 'my-org');

    expect(spec.command).to.equal('sf');
    expect(spec.args.join(' ')).to.equal(
      'project deploy start --verbose --manifest package.xml --target-org my-org --test-level RunLocalTests'
    );
  });

  it('passes destructive-changes, ignore-warnings, wait and json flags', async () => {
    const build: MetadataBuild = {
      type: 'metadata',
      manifestFile: 'package.xml',
      preDestructiveChanges: 'pre.xml',
      postDestructiveChanges: 'post.xml',
      ignoreWarnings: true,
      timeout: '60',
      outputFormat: 'json',
    };
    const spec = await strategyWith({}).build(build, 'my-org');

    expect(spec.args).to.include.members([
      '--pre-destructive-changes',
      'pre.xml',
      '--post-destructive-changes',
      'post.xml',
      '--ignore-warnings',
      '--wait',
      '60',
      '--json',
    ]);
  });

  it('resolves @IsTest classes for RunSpecifiedTests', async () => {
    const build: MetadataBuild = {
      type: 'metadata',
      manifestFile: 'pkg.xml',
      testLevel: 'RunSpecifiedTests',
      classPath: 'classes',
    };
    const files = {
      'pkg.xml':
        '<Package><types><members>FooTest</members><members>Bar</members><name>ApexClass</name></types></Package>',
      'classes/FooTest.cls': '@IsTest public class FooTest {}',
      'classes/Bar.cls': 'public class Bar {}',
    };

    const spec = await strategyWith(files).build(build, 'my-org');

    expect(spec.args).to.include.members(['--test-level', 'RunSpecifiedTests', '--tests', 'FooTest']);
    expect(spec.args).to.not.include('Bar');
  });

  it('throws when RunSpecifiedTests resolves to zero test classes', async () => {
    const build: MetadataBuild = { type: 'metadata', manifestFile: 'pkg.xml', testLevel: 'RunSpecifiedTests' };
    const files = {
      'pkg.xml': '<Package><types><members>Bar</members><name>ApexClass</name></types></Package>',
      'force-app/main/default/classes/Bar.cls': 'public class Bar {}',
    };

    try {
      await strategyWith(files).build(build, 'my-org');
      expect.fail('expected an error');
    } catch (error) {
      expect((error as Error).message).to.match(/at least one test class/);
    }
  });

  it('forwards an explicit non-specified test level verbatim', async () => {
    const build: MetadataBuild = { type: 'metadata', manifestFile: 'package.xml', testLevel: 'NoTestRun' };
    const spec = await strategyWith({}).build(build, 'my-org');
    expect(spec.args).to.include.members(['--test-level', 'NoTestRun']);
  });
});
