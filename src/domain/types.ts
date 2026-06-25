/**
 * The JSON result returned by `sf builds deploy` (and emitted with `--json`).
 */
export type BuildsDeployResult = {
  /** Number of build steps that were executed (skipped initial steps are not counted). */
  stepsExecuted: number;
  /** Total number of build steps declared in the buildfile. */
  totalSteps: number;
};

/**
 * Parameters required to authenticate against the target org with the JWT bearer flow.
 */
export type AuthParameters = {
  instanceUrl?: URL;
  username?: string;
  clientId?: string;
  jwtKeyFile?: string;
};

/**
 * Minimal shape of a parsed `package.xml` (as produced by xml2js).
 */
export type PackageManifest = {
  types?: PackageType[];
};

export type PackageType = {
  name: string[];
  // xml2js omits this entirely for a <types> block with no <members>.
  members?: string[];
};
