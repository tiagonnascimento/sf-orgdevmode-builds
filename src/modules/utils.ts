/* eslint-disable no-console */
import * as fs from 'node:fs';
import { spawnSync, SpawnSyncReturns, SpawnSyncOptionsWithStringEncoding } from 'node:child_process';
import * as xml2js from 'xml2js';
import { Package, PackageType } from './types.ts';

export default class BuildsUtils {
  /**
   * Refactoring method only to be able to stub the child_process.spawnSync
   *
   * @param command - command to be executed
   * @param args - array with args
   * @param options - options as determined on execCommand function
   */
  public static execSpawnSync(
    command: string,
    args: string[],
    options: SpawnSyncOptionsWithStringEncoding
  ): SpawnSyncReturns<string> {
    return spawnSync(command, args, options);
  }

  /**
   * Exec a shell command assynchronously
   *
   * @param {*} command command to be executed
   * @param {*} args array with args
   * @param {*} workingFolder opcional
   */
  public static execCommand(command: string, args: string[], workingFolder: string | null = null): void {
    const options: SpawnSyncOptionsWithStringEncoding = {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10,
    };

    if (workingFolder) {
      options.cwd = workingFolder;
    }

    const cmdArgs = args ? args.join(' ') : '';

    console.log(`Executing command:  ${command} ${cmdArgs}`);

    const spawn: SpawnSyncReturns<string> = BuildsUtils.execSpawnSync(command, args, options);

    console.log(`Status of execution: ${spawn.status ?? '0'}`);
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
        errorMessage += spawn.error.toString();
      }

      if (spawn.stderr) {
        errorMessage += ' ' + spawn.stderr.toString();
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
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
