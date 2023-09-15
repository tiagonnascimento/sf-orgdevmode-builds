import * as path from 'path';
// import { expect } from 'chai';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import GenerateProfiler from '../../../src/commands/generate/profiler';
let session: TestSession;

describe('verifies all commands run successfully ', () => {
  before(async () => {
    session = await TestSession.create({
      devhubAuthStrategy: 'AUTO',
      scratchOrgs: [
        {
          setDefault: true,
          config: path.join('config', 'project-scratch-def.json'),
        },
      ],
    });
  });

  it('Fetch profile data passing all flags and project only is true', async () => {
    await GenerateProfiler.run([
      '--username',
      'jaime.terrats@gmail.com',
      '--path',
      'force-app',
      '--project-only',
      'true',
    ]);
  });

  it('Fetch profile with all flags and project only is false', async () => {
    await GenerateProfiler.run([
      '--username',
      'jaime.terrats@gmail.com',
      '--path',
      'force-app',
      '--project-only',
      'false',
    ]);
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });
});
