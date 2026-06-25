import { expect } from 'chai';
import { AuthService } from '../../src/services/auth.js';
import { RecordingRunner } from '../helpers.js';

describe('AuthService', () => {
  it('runs the JWT login command with every parameter', async () => {
    const runner = new RecordingRunner();
    await new AuthService(runner).login({
      clientId: 'cid',
      jwtKeyFile: 'server.key',
      username: 'ci@example.com',
      instanceUrl: new URL('https://test.salesforce.com'),
    });

    expect(runner.calls).to.have.length(1);
    expect(runner.commandLine(0)).to.equal(
      'sf org login jwt --instance-url https://test.salesforce.com/ --client-id cid --jwt-key-file server.key --username ci@example.com'
    );
  });

  it('defaults the instance URL when omitted', async () => {
    const runner = new RecordingRunner();
    await new AuthService(runner).login({ clientId: 'cid', jwtKeyFile: 'k', username: 'u' });
    expect(runner.calls[0].args).to.include.members(['--instance-url', 'https://login.salesforce.com']);
  });

  it('returns the authenticated username so the caller can use it as the target org', async () => {
    const runner = new RecordingRunner();
    const username = await new AuthService(runner).login({
      clientId: 'cid',
      jwtKeyFile: 'k',
      username: 'ci@example.com',
    });
    expect(username).to.equal('ci@example.com');
  });

  // Regression: the original code reassigned a single error variable per check,
  // so a missing clientId (with the other two present) silently passed.
  it('reports a missing client id even when the others are present', async () => {
    const runner = new RecordingRunner();
    try {
      await new AuthService(runner).login({ jwtKeyFile: 'k', username: 'u' });
      expect.fail('expected an error');
    } catch (error) {
      expect((error as Error).message).to.match(/client id/);
    }
    expect(runner.calls).to.have.length(0);
  });

  it('reports all missing parameters at once', async () => {
    const runner = new RecordingRunner();
    try {
      await new AuthService(runner).login({});
      expect.fail('expected an error');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).to.match(/client id/);
      expect(message).to.match(/JWT key file/);
      expect(message).to.match(/username/);
    }
  });
});
