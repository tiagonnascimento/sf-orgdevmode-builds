/* eslint-disable no-console */
import { AuthParameters, Build } from './types';
import BuildsUtils from './utils';

export default class Commands {
  public static auth(authParms: AuthParameters): void {
    console.log(' --- auth --- ');
    const authCommand = 'sf' as string;
    const authCommandArgs: string[] = [];
    const instanceURL = authParms.instanceUrl ? authParms.instanceUrl.toString() : 'https://login.salesforce.com';

    let errorMessage: string | null;
    errorMessage = authParms.clientId ? null : 'Client id is not present';
    errorMessage = authParms.jwtKeyFile ? null : 'JWT key file is not present';
    errorMessage = authParms.username ? null : 'Username is not present';

    if (errorMessage) {
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    authCommandArgs.push('org');
    authCommandArgs.push('login');
    authCommandArgs.push('jwt');
    authCommandArgs.push('--instance-url');
    authCommandArgs.push(instanceURL);
    authCommandArgs.push('--client-id');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authCommandArgs.push(authParms.clientId!);
    authCommandArgs.push('--jwt-key-file');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authCommandArgs.push(authParms.jwtKeyFile!);
    authCommandArgs.push('--username');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authCommandArgs.push(authParms.username!);

    BuildsUtils.execCommand(authCommand, authCommandArgs);
  }

  public static disableTracking(username: string): void {
    console.log(' --- disabling source tracking on target sandbox --- ');
    const configCommand = 'sf' as string;
    const configCommandArgs: string[] = [];
    configCommandArgs.push('org');
    configCommandArgs.push('disable');
    configCommandArgs.push('tracking');
    configCommandArgs.push('--target-org');
    configCommandArgs.push(username);

    BuildsUtils.execCommand(configCommand, configCommandArgs);
  }

  public static deploy(build: Build, username: string): void {
    console.log(` --- build type: ${build.type} --- `);

    let buildCommand: string;
    let buildCommandArgs: string[] = [];

    if (build.type === 'metadata') {
      if (!build.manifestFile) {
        console.error('No manifest file is provided for this build');
        throw new Error('No manifest file is provided for this build');
      }
      buildCommand = 'sf';
      buildCommandArgs.push('project');
      buildCommandArgs.push('deploy');
      buildCommandArgs.push('start');
      buildCommandArgs.push('--verbose');
      buildCommandArgs.push('--manifest');
      buildCommandArgs.push(build.manifestFile);
      buildCommandArgs.push('--target-org');
      buildCommandArgs.push(username);
      if (build.preDestructiveChanges) {
        buildCommandArgs.push('--pre-destructive-changes');
        buildCommandArgs.push(build.preDestructiveChanges);
      }
      if (build.postDestructiveChanges) {
        buildCommandArgs.push('--post-destructive-changes');
        buildCommandArgs.push(build.postDestructiveChanges);
      }
      if (build.testLevel === 'RunSpecifiedTests') {
        const testClasses = BuildsUtils.getApexTestClassesFromPackageXml(build.manifestFile, build.classPath);
        if (testClasses.length === 0) {
          throw new Error('You should have at least one test class on your package.xml');
        }
        buildCommandArgs.push('--test-level');
        buildCommandArgs.push('RunSpecifiedTests');
        buildCommandArgs.push('--tests');
        buildCommandArgs = buildCommandArgs.concat(testClasses);
      } else if (build.testLevel) {
        buildCommandArgs.push('--test-level');
        buildCommandArgs.push(build.testLevel);
      } else {
        buildCommandArgs.push('--test-level');
        buildCommandArgs.push('RunLocalTests');
      }
      if (build.ignoreWarnings) {
        buildCommandArgs.push('--ignore-warnings');
      }
      if (build.timeout) {
        buildCommandArgs.push('--wait');
        buildCommandArgs.push(build.timeout);
      }
      if (build.outputFormat === 'json') {
        buildCommandArgs.push('--json');
      }
    } else if (build.type === 'datapack') {
      if (!build.manifestFile) {
        console.error('No manifest file is provided for this build');
        throw new Error('No manifest file is provided for this build');
      }
      buildCommand = 'vlocity';
      buildCommandArgs.push('-sfdx.username');
      buildCommandArgs.push(username);
      buildCommandArgs.push('-job');
      buildCommandArgs.push(build.manifestFile);
      buildCommandArgs.push('packDeploy');
    } else if (build.type === 'anonymousApex') {
      if (!build.apexScript) {
        console.error('No apex script is provided for this build');
        throw new Error('No apex script is provided for this build');
      }
      buildCommand = 'sf';
      buildCommandArgs.push('apex');
      buildCommandArgs.push('run');
      buildCommandArgs.push('--target-org');
      buildCommandArgs.push(username);
      buildCommandArgs.push('--file');
      buildCommandArgs.push(build.apexScript);
      buildCommandArgs.push('--json');
    } else if (build.type === 'command') {
      if (!build.command) {
        console.error('No command is provided for this build');
        throw new Error('No command is provided for this build');
      }
      const [head, ...tail] = build.command.split(' ');
      buildCommand = head;
      buildCommandArgs = tail;
    } else {
      console.error(`Build type not supported ${build.type}`);
      throw new Error(`Build type not supported ${build.type}`);
    }

    BuildsUtils.execCommand(buildCommand, buildCommandArgs);
  }
}
