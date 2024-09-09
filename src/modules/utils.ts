/* eslint-disable no-console */
import * as fs from 'node:fs';
import { spawn, SpawnOptions } from 'node:child_process';
import * as xml2js from 'xml2js';
import { Package, PackageType } from './types.js';

export default class BuildsUtils {
  /**
   * Create the child process and return a Promise to be enqueued by the caller
   *
   * @param command command to be executed
   * @param args array with arguments
   * @param options SpawnOptions for this request
   * @returns
   */
  public static async spawnPromise(command: string, args: string[], options: SpawnOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, options);

      process.stdout?.on('data', (data: Buffer) => {
        console.log(data.toString());
      });

      process.stderr?.on('data', (data: Buffer) => {
        console.error(data.toString());
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('Command executed successfully');
          resolve();
        } else {
          console.error(`Process exited with code ${code ?? 'null or undefined'}`);
          reject(new Error(`Process exited with code ${code ?? 'null or undefined'}`));
        }
      });

      process.on('error', (error) => {
        console.log(`Command failed with the following error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Exec a shell command assynchronously
   *
   * @param {*} command command to be executed
   * @param {*} args array with args
   * @param {*} workingFolder opcional
   */
  public static async execCommand(command: string, args: string[], workingFolder: string | null = null): Promise<void> {
    const options: SpawnOptions = {};

    if (workingFolder) {
      options.cwd = workingFolder;
    }

    const cmdArgs = args ? args.join(' ') : '';

    console.log(`Executing command:  ${command} ${cmdArgs}`);

    return BuildsUtils.spawnPromise(command, args, options);
  }

  /**
   * Externalizing method only to be easier to mock the fs.readFileSync
   *
   * @param path - path of the file to be read
   * @returns JSON representation of the file
   */
  public static execReadFileSync(path: string): string {
    return fs.readFileSync(path, 'utf8');
  }

  /**
   * Get a JSON representation of package.xml
   *
   * @param {*} baseManifestPath Path for package.xml
   * @returns JSON representation of package.xml
   */
  public static parsePackageXml(manifestPath: string): Package {
    const xmlString: string = BuildsUtils.execReadFileSync(manifestPath);
    let xmlJson!: Package;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    xml2js.parseString(xmlString, (err, res) => {
      if (err) {
        console.error(`Error parsing ${manifestPath}`);
        console.error(err);
        throw err;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
    const xmlJson = BuildsUtils.parsePackageXml(manifestPath);
    const apexTestClasses: string[] = [];

    if (xmlJson?.types) {
      const packageTypeFiltered = xmlJson.types.filter((item: PackageType) => item.name[0].startsWith('ApexClass'));
      const apexClasses = packageTypeFiltered[0].members;
      console.log('Apex Classes detected: ', apexClasses);

      apexClasses.forEach((file) => {
        const fileContentTmp = BuildsUtils.execReadFileSync(`${classesFolderPath}/${file}.cls`);

        if (fileContentTmp.match(/@istest*/i)) {
          apexTestClasses.push(file);
        }
      });

      console.log('Test classes detected: ', apexTestClasses);
    }

    return apexTestClasses;
  }
}
