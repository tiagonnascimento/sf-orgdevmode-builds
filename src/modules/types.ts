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
  enableTracking?: string;
  classPath?: string;
  ignoreWarnings?: boolean;
  timeout?: string;
  apexScript?: string;
  command?: string;
  outputFormat?: string;
  addTargetOrg?: boolean;
  targetOrgFormat?: string;
};

export type Package = {
  types: PackageType[];
};

export type PackageType = {
  name: string;
  members: string[];
};
