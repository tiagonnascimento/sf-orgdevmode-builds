/* eslint-disable */
import * as path from 'path';
// import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
let testSession: TestSession;

describe('verifies all commands run successfully ', () => {
  before(async () => {
    testSession = await TestSession.create({
      devhubAuthStrategy: 'AUTO',
      project: {
        sourceDir: path.join('test', 'testProject'),
      },
      scratchOrgs: [
        {
          setDefault: true,
          config: 'config/project-scratch-def.json',
          wait: 10,
        },
      ],
    });
  });

  it('Fetch profile data passing all flags and project only is true', async () => {
    const result = execCmd('generate profiler --username jaime.terrats@gmail.com --project-only true --path force-app');
    console.log(result.jsonOutput);
  });

  it('Fetch profile with all flags and project only is false', async () => {
    const result = execCmd(
      'generate profiler --username jaime.terrats@gmail.com --path force-app --project-only false'
    );
    console.log(result);
  });

  it('Fetch profile with only username flag', async () => {
    const result = execCmd('generate profiler --username jaime.terrats@gmail.com');
    console.log(result.shellOutput);
  });

  it('Fetch profiles without flags', async () => {
    const result = execCmd('generate profiler');
    console.log(result);
  });

  after(async () => {
    await testSession?.clean();
  });
});
