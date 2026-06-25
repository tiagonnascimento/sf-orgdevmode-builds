import { z } from 'zod';

/**
 * The Salesforce `--test-level` values accepted by `sf project deploy start`.
 */
export const TEST_LEVELS = ['NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'] as const;

/**
 * Fields shared by every build step regardless of its `type`.
 *
 * `workingFolder` becomes the child process `cwd` — useful for `datapack`
 * builds when the Vlocity Build Tool trips on unrelated metadata.
 */
const baseBuildShape = {
  workingFolder: z.string().min(1).optional(),
};

/**
 * A `metadata` step deploys a package.xml manifest via `sf project deploy start`.
 */
export const metadataBuildSchema = z
  .object({
    type: z.literal('metadata'),
    manifestFile: z.string().min(1),
    preDestructiveChanges: z.string().min(1).optional(),
    postDestructiveChanges: z.string().min(1).optional(),
    testLevel: z.enum(TEST_LEVELS).optional(),
    /** Path to the Apex classes folder, used to discover @IsTest classes for RunSpecifiedTests. */
    classPath: z.string().min(1).optional(),
    /** When falsy (the default), source tracking is disabled on the target org before deploying. */
    enableTracking: z.boolean().optional(),
    ignoreWarnings: z.boolean().optional(),
    /**
     * `--wait` value (minutes) forwarded to the deploy command. Accepts a
     * non-negative integer or its string form; normalized to a string so the
     * argv is always valid. `z.coerce.string()` was too loose — it would turn
     * `true`/`{}` into `"true"`/`"[object Object]"` and forward garbage to `sf`.
     */
    timeout: z
      .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/, 'must be a non-negative integer')])
      .transform(String)
      .optional(),
    outputFormat: z.enum(['json']).optional(),
    ...baseBuildShape,
  })
  .strict();

/**
 * A `datapack` step deploys Salesforce Industries (Vlocity) datapacks via the `vlocity` CLI.
 */
export const datapackBuildSchema = z
  .object({
    type: z.literal('datapack'),
    manifestFile: z.string().min(1),
    ...baseBuildShape,
  })
  .strict();

/**
 * An `anonymousApex` step runs an anonymous Apex script via `sf apex run`.
 */
export const anonymousApexBuildSchema = z
  .object({
    type: z.literal('anonymousApex'),
    apexScript: z.string().min(1),
    ...baseBuildShape,
  })
  .strict();

/**
 * A `command` step runs an arbitrary CLI command.
 *
 * When `addTargetOrg` is set, the resolved org alias/username is appended using
 * `targetOrgFormat` (defaults to `--target-org`).
 */
export const commandBuildSchema = z
  .object({
    type: z.literal('command'),
    command: z.string().min(1),
    addTargetOrg: z.boolean().optional(),
    targetOrgFormat: z.string().min(1).optional(),
    ...baseBuildShape,
  })
  .strict();

/**
 * A single build step — discriminated on `type`. Each variant carries exactly
 * the fields it needs, so the orchestrator never has to defend against missing
 * required fields at runtime.
 */
export const buildSchema = z.discriminatedUnion('type', [
  metadataBuildSchema,
  datapackBuildSchema,
  anonymousApexBuildSchema,
  commandBuildSchema,
]);

/**
 * The root of a `buildfile.json`: an ordered list of build steps.
 */
export const buildfileSchema = z
  .object({
    builds: z.array(buildSchema).min(1),
  })
  .strict();

export type TestLevel = (typeof TEST_LEVELS)[number];
export type MetadataBuild = z.infer<typeof metadataBuildSchema>;
export type DatapackBuild = z.infer<typeof datapackBuildSchema>;
export type AnonymousApexBuild = z.infer<typeof anonymousApexBuildSchema>;
export type CommandBuild = z.infer<typeof commandBuildSchema>;
export type Build = z.infer<typeof buildSchema>;
export type BuildType = Build['type'];
export type Buildfile = z.infer<typeof buildfileSchema>;
