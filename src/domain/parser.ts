import { z } from 'zod';
import { Buildfile, buildfileSchema } from './buildfile.js';

/**
 * Render zod issues into a compact, human-readable list.
 */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `  • ${path}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Thrown when a `buildfile.json` fails schema validation. Carries a
 * pre-formatted, multi-line message listing every offending path.
 */
export class BuildfileValidationError extends Error {
  public constructor(public readonly issues: string) {
    super(`The buildfile is invalid:\n${issues}`);
    this.name = 'BuildfileValidationError';
  }
}

/**
 * Parse and validate the raw contents of a `buildfile.json`.
 *
 * This is the single trust boundary for untrusted input: everything downstream
 * works with the fully-typed, validated {@link Buildfile} and never has to
 * re-check for missing required fields.
 *
 * @param raw - the raw file contents
 * @returns the validated buildfile
 * @throws {BuildfileValidationError} when the JSON is malformed or fails the schema
 */
export function parseBuildfile(raw: string): Buildfile {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new BuildfileValidationError(`  • (root): not valid JSON (${reason})`);
  }

  const result = buildfileSchema.safeParse(json);
  if (!result.success) {
    throw new BuildfileValidationError(formatIssues(result.error));
  }

  return result.data;
}
