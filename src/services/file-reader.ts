import { readFileSync } from 'node:fs';

/**
 * Reads files from disk. Extracted behind an interface so the orchestrator and
 * services can be unit-tested with an in-memory fake instead of touching the FS.
 */
export type FileReader = {
  read(path: string): string;
};

/**
 * Default {@link FileReader} backed by `node:fs`.
 */
export const fsFileReader: FileReader = {
  read: (path: string): string => readFileSync(path, 'utf8'),
};
