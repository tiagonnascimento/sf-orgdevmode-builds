import { AuthParameters } from '../domain/types.js';
import { Logger, silentLogger } from './logger.js';
import { ProcessRunner } from './process-runner.js';

const DEFAULT_LOGIN_URL = 'https://login.salesforce.com';

/**
 * Authenticates against a target org using the JWT bearer flow (`sf org login jwt`).
 */
export class AuthService {
  public constructor(private readonly runner: ProcessRunner, private readonly logger: Logger = silentLogger) {}

  /**
   * Log in to the org and resolve with the authenticated username.
   *
   * Validates that every required parameter is present and reports *all* missing
   * ones at once (the previous implementation reassigned a single error variable
   * per check, so only the last failing check was ever surfaced). Returning the
   * username lets the caller use it as the target org without reaching back into
   * the (possibly mutated) params object.
   *
   * @throws when required parameters are missing or the login command fails
   */
  public async login(params: AuthParameters): Promise<string> {
    this.logger.log('Authenticating on the target org');

    const missing: string[] = [];
    if (!params.clientId) missing.push('client id');
    if (!params.jwtKeyFile) missing.push('JWT key file');
    if (!params.username) missing.push('username');

    if (missing.length > 0) {
      throw new Error(`Cannot authenticate, the following are missing: ${missing.join(', ')}`);
    }

    const instanceUrl = params.instanceUrl?.toString() ?? DEFAULT_LOGIN_URL;

    // Non-null assertions are sound here: the guard above guarantees presence.
    await this.runner.run('sf', [
      'org', 'login', 'jwt',
      '--instance-url', instanceUrl,
      '--client-id', params.clientId!,
      '--jwt-key-file', params.jwtKeyFile!,
      '--username', params.username!,
    ]); // prettier-ignore

    return params.username!;
  }
}
