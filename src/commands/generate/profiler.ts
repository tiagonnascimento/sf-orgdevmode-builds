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
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { promises as fs } from 'fs';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

export type ProfilerResult = {
  success: boolean;
  operationType: string;
};

export type execParams = {
  'project-only'?: string;
  path?: string;
  username?: string;
};

export type resultCommand = {
  body?: string;
  success?: boolean;
};

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-orgdevmode-builds', 'generate.profiler');

/**
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
 */
export const execCommand = function (command: string, args: string[]) {
  const options: any = {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 10,
  };
  const result: resultCommand = {};

  const cmdArgs = args ? args.join(' ') : '';

  console.log(`Executing command:  ${command} ${cmdArgs}`);

  const spawn: SpawnSyncReturns<string> = execSpawnSync(command, args, options);
  return new Promise((resolve, reject) => {
    if (spawn.error ?? spawn.status !== 0) {
      let errorMessage = 'Error executing command: ';
      if (spawn.error) {
        errorMessage += spawn.error;
      }
      if (spawn.stderr) {
        errorMessage += ' ' + spawn.stderr.toString();
      }
      if (spawn.stdout) {
        console.log(spawn);
        const jsonError = JSON.parse(spawn.stdout);
        errorMessage += jsonError.message;
      }
      result.body = errorMessage;
      result.success = false;
      reject(errorMessage);
    } else {
      const spawnOut = spawn.stdout;
      result.body = spawn.stdout!;
      // TODO: enable print this with verbose flag
      // console.info(result);
      resolve(spawnOut);
    }
  });
};

export default class Profiler extends SfCommand<ProfilerResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static projectPath: string;
  public static readonly flags = {
    path: Flags.string({
      summary: messages.getMessage('flags.path.summary'),
      char: 'd',
    }),
    'project-only': Flags.string({
      summary: messages.getMessage('flags.project-only.summary'),
      char: 'p',
    }),
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      char: 'u',
    }),
  };

  public static async buildManifest(params: execParams): Promise<ProfilerResult> {
    let baseCommandLine = '';
    let projectDefaultPath = '';
    let commandParams = [] as any;
    let flag = false;
    await fs
      .readFile('sfdx-project.json', 'utf-8')
      .then((data: any) => {
        const result = JSON.parse(data);
        for (const element of result.packageDirectories) {
          if (element.default) {
            projectDefaultPath = element.path;
            break;
          }
        }
        const path = params.path !== undefined ? params.path.toString() : projectDefaultPath;
        this.projectPath = path;
        commandParams = [];
        baseCommandLine = 'sf';
        if (params['project-only'] === 'true' ?? params['project-only'] === 'TRUE') {
          commandParams = ['project', 'generate', 'manifest', '--source-dir', path];
        } else {
          commandParams = ['project', 'generate', 'manifest', '--from-org', params.username];
        }
        execCommand(baseCommandLine, commandParams)
          .then(() => {
            flag = true;
          })
          .catch((err) => {
            console.error(err);
            flag = false;
            throw new Error(err);
          });
      })
      .catch((err) => {
        console.error('error while executing command:', err);
        flag = false;
        throw new Error(err.body);
      });

    return {
      success: flag,
      operationType: 'build-manifest',
    };
  }

  public static async fetchProfileData(): Promise<ProfilerResult> {
    const baseCommand = 'sf';
    const commandParams = ['project', 'retrieve', 'start', '-x', 'package.xml'];
    let flag = false;

    await execCommand(baseCommand, commandParams)
      .then(() => {
        flag = true;
      })
      .catch((err) => {
        console.error(err);
        flag = false;
      });
    return {
      success: flag,
      operationType: 'fetch-profile',
    };
  }

  private static async getUser(): Promise<resultCommand> {
    const baseCommandLine = 'sf';
    const commandParams = ['org', 'display', 'user', '--json'];
    let flag = false;
    let username = '';
    await execCommand(baseCommandLine, commandParams)
      .then((exec) => {
        if (typeof exec === 'string') {
          const jobject = JSON.parse(exec);
          username = jobject.result.username;
          flag = true;
        }
      })
      .catch((err) => {
        console.error(err);
        flag = false;
        username = 'no user found.';
        throw new Error(err);
      });
    return {
      success: flag,
      body: username,
    };
  }

  private static cleanProject() {
    const baseCommand = 'git';
    let commandParams = ['add', 'force-app/default/main/profiles'];
    execCommand(baseCommand, commandParams)
      .then(() => {
        commandParams = ['clean', '-f', 'force-app'];
        execCommand(baseCommand, commandParams)
          .then(() => {
            commandParams = ['checkout', '--', 'force-app'];
            execCommand(baseCommand, commandParams)
              .then(() => {
                commandParams = ['clean', '-f'];
                execCommand(baseCommand, commandParams)
                  .then(() => {
                    commandParams = ['restore', '--staged', 'force-app'];
                    execCommand(baseCommand, commandParams).catch((err) => {
                      console.error(err);
                    });
                  })
                  .catch((err) => {
                    console.error(err);
                  });
              })
              .catch((err) => {
                console.error(err);
              });
          })
          .catch((err) => {
            console.error(err);
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  }
  public async run(): Promise<ProfilerResult> {
    const { flags } = await this.parse(Profiler);
    const params: execParams = {
      'project-only': flags['project-only'],
      username: flags.username,
      path: flags.path,
    };
    let flag = false;
    if (!params.username) {
      Profiler.getUser()
        .then((result) => {
          params.username = result.body;
        })
        .then(() => {
          Profiler.buildManifest(params)
            .then(() => {
              Profiler.fetchProfileData()
                .then(() => {
                  Profiler.cleanProject();
                })
                .catch((err) => {
                  console.error(err);
                });
            })
            .catch((err) => {
              flag = false;
              throw err;
            });
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      Profiler.buildManifest(params)
        .then(() => {
          Profiler.fetchProfileData()
            .then(() => {
              Profiler.cleanProject();
            })
            .catch((err) => {
              console.error(err);
            });
        })
        .catch((err) => {
          flag = false;
          throw new Error(err);
        });
    }
    return {
      success: flag,
      operationType: 'run',
    };
  }
}
