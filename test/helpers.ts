import { FileReader } from '../src/services/file-reader.js';
import { Logger } from '../src/services/logger.js';
import { ProcessRunner, RunOptions } from '../src/services/process-runner.js';

/**
 * A {@link FileReader} backed by an in-memory map. Throws on unknown paths, which
 * keeps tests honest about exactly which files they expect to be read.
 */
export class FakeFileReader implements FileReader {
  public readonly reads: string[] = [];

  public constructor(private readonly files: Record<string, string>) {}

  public read(path: string): string {
    this.reads.push(path);
    const content = this.files[path];
    if (content === undefined) {
      throw new Error(`FakeFileReader: no content registered for "${path}"`);
    }
    return content;
  }
}

/**
 * One recorded invocation of {@link RecordingRunner.run}.
 */
export type RecordedCall = {
  command: string;
  args: string[];
  options: RunOptions;
};

/**
 * A {@link ProcessRunner} stand-in that records every invocation instead of
 * spawning a process. Tests assert on the assembled argv (not call counts), so
 * they verify behavior rather than internal call ordering.
 */
export class RecordingRunner extends ProcessRunner {
  public readonly calls: RecordedCall[] = [];

  public constructor() {
    super();
  }

  public override async run(command: string, args: string[], options: RunOptions = {}): Promise<void> {
    this.calls.push({ command, args, options });
    return Promise.resolve();
  }

  /** Flatten a recorded call back into a single command line for convenient matching. */
  public commandLine(index: number): string {
    const call = this.calls[index];
    return [call.command, ...call.args].join(' ');
  }
}

/**
 * A {@link Logger} that captures everything written, for assertions on output.
 */
export class CapturingLogger implements Logger {
  public readonly logs: string[] = [];
  public readonly warnings: string[] = [];

  public log(message = ''): void {
    this.logs.push(message);
  }

  public warn(message: string): void {
    this.warnings.push(message);
  }
}
