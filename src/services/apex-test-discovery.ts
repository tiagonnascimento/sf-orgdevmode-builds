import { parseStringPromise } from 'xml2js';
import { PackageManifest, PackageType } from '../domain/types.js';
import { FileReader } from './file-reader.js';
import { Logger, silentLogger } from './logger.js';

const DEFAULT_CLASS_PATH = 'force-app/main/default/classes';
const IS_TEST_PATTERN = /@istest/i;

/**
 * Discovers the `@IsTest`-annotated Apex classes referenced by a `package.xml`.
 *
 * Used to translate `testLevel: RunSpecifiedTests` into the concrete `--tests`
 * list that `sf project deploy start` expects.
 */
export class ApexTestDiscovery {
  public constructor(private readonly fileReader: FileReader, private readonly logger: Logger = silentLogger) {}

  /**
   * Parse a `package.xml` into its typed manifest shape.
   */
  public async parsePackageXml(manifestPath: string): Promise<PackageManifest> {
    const xml = this.fileReader.read(manifestPath);
    const parsed = (await parseStringPromise(xml)) as { Package?: PackageManifest };
    return parsed.Package ?? {};
  }

  /**
   * Return the subset of ApexClass members in `package.xml` whose source is an
   * `@IsTest` class.
   *
   * @param manifestPath - path to package.xml
   * @param classesFolderPath - folder holding the `.cls` sources
   * @returns the names of the test classes (may be empty)
   */
  public async getTestClasses(manifestPath: string, classesFolderPath = DEFAULT_CLASS_PATH): Promise<string[]> {
    const manifest = await this.parsePackageXml(manifestPath);

    const apexType = manifest.types?.find((type: PackageType) => type.name[0]?.startsWith('ApexClass'));
    // package.xml is untrusted XML (not covered by the zod buildfile schema): a
    // <types> block can legally omit <members>, in which case xml2js yields
    // `undefined`. Default to [] so we surface the clear "no test classes" error
    // downstream rather than a raw TypeError.
    const members = apexType?.members ?? [];
    if (members.length === 0) {
      return [];
    }

    this.logger.log(`Apex classes detected: ${members.join(', ')}`);

    const testClasses = members.filter((member) => {
      const source = this.fileReader.read(`${classesFolderPath}/${member}.cls`);
      return IS_TEST_PATTERN.test(source);
    });

    this.logger.log(`Test classes detected: ${testClasses.join(', ')}`);
    return testClasses;
  }
}
