/* eslint-disable sf-plugin/no-missing-messages */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-orgdevmode-builds', 'builds.deploy');

export type BuildsDeployResult = {
  success: boolean;
};

export default class BuildsDeploy extends SfCommand<BuildsDeployResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    buildfile: Flags.file({
      summary: messages.getMessage('flags.buildfile.summary'),
      char: 'b',
      required: true,
      exists: true,
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
      exists: true,
    }),
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      char: 'u',
    }),
  };

  public async run(): Promise<BuildsDeployResult> {
    const { flags } = await this.parse(BuildsDeploy);

    const instanceUrl = flags['instance-url']?.toString();

    this.log('Flags are:');
    this.log(`buildfile: ${flags.buildfile}`);
    this.log(`target-org: ${flags['target-org']}`);
    this.log(`client-id: ${flags['client-id']}`);
    this.log(`instance-url: ${instanceUrl}`);
    this.log(`jwt-key-file: ${flags['jwt-key-file']}`);
    this.log(`username: ${flags.username}`);

    return {
      success: true,
    };
  }
}
