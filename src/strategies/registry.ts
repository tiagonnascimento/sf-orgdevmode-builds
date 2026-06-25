import { Build, BuildType } from '../domain/buildfile.js';
import { ApexTestDiscovery } from '../services/apex-test-discovery.js';
import { AnonymousApexStrategy } from './anonymous-apex-strategy.js';
import { CommandStrategy } from './command-strategy.js';
import { DatapackStrategy } from './datapack-strategy.js';
import { MetadataStrategy } from './metadata-strategy.js';
import { BuildStrategy, CommandSpec } from './types.js';

/**
 * Maps each {@link BuildType} to the {@link BuildStrategy} that handles it.
 *
 * This is the dispatch table that replaced the original `if/else` chain: adding
 * a new build type is a matter of adding a union variant (in `buildfile.ts`) and
 * one entry here — the orchestrator stays untouched (Open/Closed).
 */
export class StrategyRegistry {
  private readonly strategies: Record<BuildType, BuildStrategy>;

  public constructor(apexTestDiscovery: ApexTestDiscovery) {
    // Casts are safe: the key/value variants are paired by construction, but
    // TypeScript can't correlate the discriminated-union key with the matching
    // strategy variant inside a Record literal.
    this.strategies = {
      metadata: new MetadataStrategy(apexTestDiscovery) as BuildStrategy,
      datapack: new DatapackStrategy() as BuildStrategy,
      anonymousApex: new AnonymousApexStrategy() as BuildStrategy,
      command: new CommandStrategy() as BuildStrategy,
    };
  }

  /**
   * Resolve the command spec for a build step by delegating to its strategy.
   */
  public async resolve(build: Build, targetOrg: string): Promise<CommandSpec> {
    const strategy = this.strategies[build.type];
    if (!strategy) {
      // Unreachable while the Record stays total, but keeps the original's
      // explicit "build type not supported" error if the union and the table
      // ever drift, rather than an opaque "cannot read properties of undefined".
      throw new Error(`No strategy registered for build type: ${String(build.type)}`);
    }
    return strategy.build(build, targetOrg);
  }
}
