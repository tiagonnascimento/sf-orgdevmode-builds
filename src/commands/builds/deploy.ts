/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable sf-plugin/no-missing-messages */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import * as fs from 'fs';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import * as xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-orgdevmode-builds', 'builds.deploy');

export type BuildsDeployResult = {
  success: boolean;
};

export type AuthParameters = {
  instanceUrl?: URL;
  username?: string;
  clientId?: string;
  jwtKeyFile?: string;
};

export type Build = {
  type: string;
  manifestFile?: string;
  preDestructiveChanges?: string;
  postDestructiveChanges?: string;
  testLevel?: string;
  classPath?: string;
  ignoreWarnings?: boolean;
  timeout?: string;
  apexScript?: string;
  command?: string;
};

export type Package = {
  types: PackageType[];
};

export type PackageType = {
  name: string;
  members: string[];
};

/**
 * Refactoring method only to be able to stub the child_process.spawnSync
 *
 * @param command - command to be executed
 * @param args - array with args
 * @param options - options as determined on execCommand function
 */
export const execSpawnSync = function (command: string, args: string[], options: any) {
  return spawnSync(command, args, options);
};

/**
 * Exec a shell command assynchronously
 *
 * @param {*} command command to be executed
 * @param {*} args array with args
 * @param {*} workingFolder opcional
 */
export const execCommand = function (command: string, args: string[], workingFolder: string | null = null): void {
  const options: any = {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 10,
  };

  if (workingFolder) {
    options.cwd = workingFolder;
  }

  const cmdArgs = args ? args.join(' ') : '';

  console.log(`Executing command:  ${command} ${cmdArgs}`);

  const spawn: SpawnSyncReturns<string> = execSpawnSync(command, args, options);

  console.log(`Status of execution: ${spawn.status}`);
  let spawnOut = spawn.stdout;
  // se resposta for JSON do sfdx, tentando limpar ela removendo caracteres de quebra de linha (\n) que o SFDX CLI pode colocar
  // na estrutura da resposta - para conseguirmos um print decente do resultado no log
  // eu volto a parsear como JSON a string com os caracteres removidos para poder usar o stringify com formatação
  try {
    spawnOut = JSON.stringify(JSON.parse(spawnOut.replace(/\\n/g, '')), null, 2);
  } catch (e) {
    // não faz nada... o exception só significa que o stdout não é JSON - perfeitamente possível
  }
  console.log(`Output: ${spawnOut}`);

  if (spawn.error ?? spawn.status !== 0) {
    let errorMessage = 'Error executing command!';
    if (spawn.error) {
      errorMessage += spawn.error;
    }

    if (spawn.stderr) {
      errorMessage += ' '.concat(spawn.stderr.toString());
    }
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Externalizing method only to be easier to mock the fs.readFileSync
 *
 * @param path - path of the file to be read
 * @returns JSON representation of the file
 */
export const execReadFileSync = function (path: string) {
  return fs.readFileSync(path, 'utf8');
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
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      char: 'u',
    }),
  };

  /**
   * Get a JSON representation of package.xml
   *
   * @param {*} baseManifestPath Path for package.xml
   * @returns JSON representation of package.xml
   */
  public static parsePackageXml(manifestPath: string): Package {
    const xmlString = execReadFileSync(manifestPath);
    let xmlJson!: Package;
    xml2js.parseString(xmlString, (err, res) => {
      if (err) {
        console.error(`Error parsing ${manifestPath}`);
        console.error(err);
        throw err;
      }
      xmlJson = res.Package;
    });

    return xmlJson;
  }

  /**
   * Get the @IsTest annotated classes from package.xml
   *
   * @param {*} baseManifestPath path for package.xml
   * @param {*} classesFolderPath path for Ppex classes
   * @returns List of test classes
   */
  public static getApexTestClassesFromPackageXml(
    manifestPath: string,
    classesFolderPath = 'force-app/main/default/classes'
  ): string[] {
    const xmlJson = BuildsDeploy.parsePackageXml(manifestPath);
    const apexTestClasses: string[] = [];

    if (xmlJson?.types) {
      const packageTypeFiltered = xmlJson.types.filter((item: PackageType) => item.name[0].startsWith('ApexClass'));
      const apexClasses = packageTypeFiltered[0].members;
      console.log('Apex Classes detected: ', apexClasses);

      apexClasses.forEach((file) => {
        const fileContentTmp = execReadFileSync(`${classesFolderPath}/${file}.cls`);

        if (fileContentTmp.match(/@istest*/i)) {
          apexTestClasses.push(file);
        }
      });

      console.log('Test classes detected: ', apexTestClasses);
    }

    return apexTestClasses;
  }

  public static auth(authParms: AuthParameters): void {
    console.log(' --- auth --- ');
    const buildCommand = 'sf' as string;
    const buildCommandArgs = [];
    const instanceURL = authParms.instanceUrl ? authParms.instanceUrl.toString() : 'https://login.salesforce.com';

    buildCommandArgs.push('org');
    buildCommandArgs.push('login');
    buildCommandArgs.push('jwt');
    buildCommandArgs.push('--instance-url');
    buildCommandArgs.push(instanceURL);
    buildCommandArgs.push('--client-id');
    buildCommandArgs.push(authParms.clientId!);
    buildCommandArgs.push('--jwt-key-file');
    buildCommandArgs.push(authParms.jwtKeyFile!);
    buildCommandArgs.push('--username');
    buildCommandArgs.push(authParms.username!);

    execCommand(buildCommand, buildCommandArgs);
  }

  public static deploy(builds: Build[], username: string): void {
    console.log(' --- deploy --- ');
    for (const build of builds) {
      console.log(` --- build type: ${build.type} --- `);
      let buildCommand: string;
      let buildCommandArgs: string[] = [];

      if (build.type === 'metadata') {
        buildCommand = 'sf';
        buildCommandArgs.push('project');
        buildCommandArgs.push('deploy');
        buildCommandArgs.push('start');
        buildCommandArgs.push('--verbose');
        buildCommandArgs.push('--manifest');
        buildCommandArgs.push(build.manifestFile!);
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
          const testClasses = BuildsDeploy.getApexTestClassesFromPackageXml(build.manifestFile!, build.classPath);
          if (testClasses.length === 0) {
            throw new Error('You should have at least one test class on your package.xml');
          }
          buildCommandArgs.push('--test-level');
          buildCommandArgs.push('RunSpecifiedTests');
          buildCommandArgs.push('--tests');
          buildCommandArgs.push(testClasses.join(','));
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
        buildCommandArgs.push('--json');
      } else if (build.type === 'datapack') {
        buildCommand = 'vlocity';
        buildCommandArgs.push('-sfdx.username');
        buildCommandArgs.push(username);
        buildCommandArgs.push('-job');
        buildCommandArgs.push(build.manifestFile!);
        buildCommandArgs.push('packDeploy');
      } else if (build.type === 'anonymousApex') {
        buildCommand = 'sf';
        buildCommandArgs.push('apex');
        buildCommandArgs.push('run');
        buildCommandArgs.push('--target-org');
        buildCommandArgs.push(username);
        buildCommandArgs.push('--file');
        buildCommandArgs.push(build.apexScript!);
        buildCommandArgs.push('--json');
      } else if (build.type === 'command') {
        const [head, ...tail] = build.command!.split(' ');
        buildCommand = head;
        buildCommandArgs = tail;
      }

      execCommand(buildCommand!, buildCommandArgs);
    }
  }

  public async run(): Promise<BuildsDeployResult> {
    const { flags } = await this.parse(BuildsDeploy);

    const buildManifestString = execReadFileSync(flags.buildfile);
    const buildManifest = JSON.parse(buildManifestString);
    console.log(`buildfile is ${buildManifestString}`);
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
        BuildsDeploy.auth(authParms);
      } catch (error) {
        console.error('Error while trying to authenticate on org');
        console.error(error);
        throw error;
      }
      userNameOrAlias = authParms.username!;
    }

    try {
      BuildsDeploy.deploy(builds, userNameOrAlias);
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
