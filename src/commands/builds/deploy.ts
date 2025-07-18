/* eslint-disable sf-plugin/run-matches-class-type */
/* eslint-disable no-console */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import BuildsUtil from '../../modules/utils.js';
import Commands from '../../modules/commands.js';
import { AuthParameters, Build, BuildsDeployResult } from '../../modules/types.js';

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
      required: true
    }),
    'target-org': Flags.string({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 't'
    }),
    'client-id': Flags.string({
      summary: messages.getMessage('flags.client-id.summary'),
      char: 'i'
    }),
    'instance-url': Flags.url({
      summary: messages.getMessage('flags.instance-url.summary'),
      char: 'l'
    }),
    'jwt-key-file': Flags.file({
      summary: messages.getMessage('flags.jwt-key-file.summary'),
      char: 'f'
    }),
    'initial-step': Flags.integer({
      summary: messages.getMessage('flags.initial-step.summary'),
      char: 's',
      min: 0
    }),
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      char: 'u'
    })
  };

  public async run(): Promise<BuildsDeployResult> {
    const { flags } = await this.parse(BuildsDeploy);

    const buildManifestString = BuildsUtil.execReadFileSync(flags.buildfile);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const buildManifest = JSON.parse(buildManifestString);
    console.log(`buildfile is ${buildManifestString}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const builds = buildManifest.builds as Build[];

    const authParms: AuthParameters = {
      instanceUrl: flags['instance-url'],
      username: flags.username,
      clientId: flags['client-id'],
      jwtKeyFile: flags['jwt-key-file'],
    };

    let userNameOrAlias = flags['target-org'];

    if (!userNameOrAlias) {
      try {
        await Commands.auth(authParms);
      } catch (error) {
        console.error('Error while trying to authenticate on org');
        console.error(error);
        throw error;
      }
      userNameOrAlias = authParms.username;
    }
    
    const initialStep = flags['initial-step'] ?? 0;
    console.log(' --- initial-step: ' + initialStep +' --- ');
    try {
      console.log(' --- deploy --- ');
      let currentStep = 0;
      for (const build of builds) {
        if (currentStep < initialStep){
          currentStep++;
          continue;
        }
        if (build.type === 'metadata' && !build.enableTracking) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, no-await-in-loop
          await Commands.disableTracking(userNameOrAlias!);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, no-await-in-loop
        await Commands.deploy(build, userNameOrAlias!);
        currentStep++;
      }
    } catch (error) {
      console.error('Error trying to run the build');
      console.error(error);
      throw error;
    }

    return {
      success: true,
    };
  }
}
