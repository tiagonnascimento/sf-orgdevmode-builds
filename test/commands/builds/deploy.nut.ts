import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

describe('builds deploy NUTs', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
  });

  after(async () => {
    await session?.clean();
  });

  it('should execute successfully', () => {
    const command =
      'builds deploy --buildfile package.json --target-org dev01 --client-id 123 --instance-url https://teste.com/ --jwt-key-file package.json --username teste';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).to.contain('package.json');
  });
});
