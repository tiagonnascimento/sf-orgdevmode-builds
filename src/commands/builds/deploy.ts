import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { parseBuildfile } from '../../domain/parser.js';
import { AuthParameters, BuildsDeployResult } from '../../domain/types.js';
import { ContainerOverrides, createContainer } from '../../services/container.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-orgdevmode-builds', 'builds.deploy');

export default class BuildsDeploy extends SfCommand<BuildsDeployResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    buildfile: Flags.file({
      summary: messages.getMessage('flags.buildfile.summary'),
      char: 'b',
      required: true,
    }),
    'target-org': Flags.string({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 't',
    }),
    'client-id': Flags.string({
      summary: messages.getMessage('flags.client-id.summary'),
      char: 'i',
    }),
    'instance-url': Flags.url({
      summary: messages.getMessage('flags.instance-url.summary'),
      char: 'l',
    }),
    'jwt-key-file': Flags.file({
      summary: messages.getMessage('flags.jwt-key-file.summary'),
      char: 'f',
    }),
    'initial-step': Flags.integer({
      summary: messages.getMessage('flags.initial-step.summary'),
      char: 's',
      min: 0,
      default: 0,
    }),
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      char: 'u',
    }),
  };

  /**
   * Test seam: lets unit tests inject fake collaborators (logger, file reader,
   * process runner) without stubbing module internals.
   */
  public overrides: ContainerOverrides = {};

  public async run(): Promise<BuildsDeployResult> {
    const { flags } = await this.parse(BuildsDeploy);

    const container = createContainer({ logger: this, ...this.overrides });

    const buildfile = parseBuildfile(container.fileReader.read(flags.buildfile));

    const targetOrg = await resolveTargetOrg(container.auth, flags);

    const stepsExecuted = await container.orchestrator.run(buildfile, targetOrg, flags['initial-step']);

    this.logSuccess(messages.getMessage('info.success', [stepsExecuted, buildfile.builds.length]));

    return { stepsExecuted, totalSteps: buildfile.builds.length };
  }
}

type ResolvableFlags = {
  'target-org'?: string;
  'instance-url'?: URL;
  username?: string;
  'client-id'?: string;
  'jwt-key-file'?: string;
};

/**
 * Return the org alias/username every step deploys to. When `--target-org` is
 * supplied it is used directly; otherwise we authenticate with the JWT flow and
 * use the resulting username.
 */
async function resolveTargetOrg(
  auth: { login(params: AuthParameters): Promise<string> },
  flags: ResolvableFlags
): Promise<string> {
  if (flags['target-org']) {
    return flags['target-org'];
  }

  const params: AuthParameters = {
    instanceUrl: flags['instance-url'],
    username: flags.username,
    clientId: flags['client-id'],
    jwtKeyFile: flags['jwt-key-file'],
  };

  // login() validates the params and returns the authenticated username, which
  // becomes the target org for every subsequent step.
  return auth.login(params);
}
