/* eslint-disable no-console */
/**
 * Generate `schemas/buildfile.schema.json` from the zod schema so the published
 * JSON Schema can never drift from the runtime validation (single source of truth).
 *
 * Run with: `yarn schema:buildfile`
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { buildfileSchema } from '../src/domain/buildfile.js';

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = join(here, '..', 'schemas', 'buildfile.schema.json');

const jsonSchema = zodToJsonSchema(buildfileSchema, {
  name: 'Buildfile',
  $refStrategy: 'root',
});

writeFileSync(outputPath, `${JSON.stringify(jsonSchema, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
