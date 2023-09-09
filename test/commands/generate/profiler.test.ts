/* eslint-disable */
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import GenerateProfiler from '../../../src/commands/generate/profiler';

describe('generate profiler', () => {
  const $$ = new TestContext();
  let sfCommandUxStubs: ReturnType<typeof stubSfCommandUx>;
  let testOrg: MockTestOrgData;
  let session: TestSession;
  let sourcePath: string;

  beforeEach(async () => {
    testOrg = new MockTestOrgData();
    testOrg.orgId = '00Dxx0000000000';
    testOrg.aliases = ['testdemo'];
    sfCommandUxStubs = stubSfCommandUx($$.SANDBOX);
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
      },
      devhubAuthStrategy: 'AUTO',
    });
    sourcePath = session.dir + '/dreamhouse-lwc/force-app';
  });

  afterEach(async () => {
    $$.restore();
    session.clean();
  });

  it('fetch profile data with all flags', async () => {
    $$.stubAliases({ nonscratchalias: testOrg.username });
    await $$.stubAuths(testOrg);
    console.log(
      await GenerateProfiler.run(['--username', testOrg.username, '--project-only', 'true', '--path', sourcePath])
    );
    const data = sfCommandUxStubs.log
      .getCalls()
      .flatMap((c) => {
        c.args;
      })
      .join('\n');
    expect(data).to.include('');
  });

  it('fetch profile without path & project-only flag', async () => {
    $$.stubAliases({ nonscratchalias: testOrg.username });
    await $$.stubAuths(testOrg);
    console.log(await GenerateProfiler.run(['--username', testOrg.username]));
    const data = sfCommandUxStubs.log
      .getCalls()
      .flatMap((c) => {
        c.args;
      })
      .join('\n');
    expect(data).to.include('');
  });

  it('fetch profile without arguments', async () => {
    $$.stubAliases({ nonscratchalias: testOrg.username });
    await $$.stubAuths(testOrg);
    console.log(await GenerateProfiler.run([]));
    const data = sfCommandUxStubs.log
      .getCalls()
      .flatMap((c) => {
        c.args;
      })
      .join('\n');
    expect(data).to.include('');
  });
});
