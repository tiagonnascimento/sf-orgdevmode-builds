# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`sf-orgdevmode-builds` is a Salesforce CLI (`sf`) plugin that exposes a single command: `sf builds deploy`. It reads a `buildfile.json` describing an ordered list of "builds" (steps) and executes them sequentially against a target org. Each step is one of four types: `metadata`, `datapack` (Vlocity / Salesforce Industries), `anonymousApex`, or `command` (arbitrary shell). The plugin is a thin orchestrator — it does not call Salesforce APIs directly. It shells out to `sf`, `vlocity`, and other CLIs via `child_process.spawn`.

## Common commands

This project uses [`wireit`](https://github.com/google/wireit) to wrap npm scripts with caching/dependency-tracking.

- `yarn build` — compile TypeScript and lint (runs `compile` + `lint`).
- `yarn compile` — `tsc -p . --pretty --incremental` only. Output goes to `lib/`.
- `yarn lint` — ESLint with cache (`.eslintcache`). Configured via `eslint-config-salesforce-typescript` + `plugin:sf-plugin/recommended`.
- `yarn format` — Prettier across `src`, `test`, `schemas`, `command-snapshot.json`.
- `yarn test` — runs `test:compile` + `test:only` + `lint`. **Note**: lint failures fail the test task.
- `yarn test:only` — run unit tests only: `nyc mocha "test/**/*.test.ts"` (uses `ts-node/esm` loader, 600s timeout per `.mocharc.json`).
- Run a single test: `yarn mocha --grep "<pattern>" "test/**/*.test.ts"` or point mocha at a specific file. There is no NUTs suite (`test:nuts` is a no-op).
- `./bin/dev.js builds deploy ...` — invoke the plugin locally without installing (uses ts-node).
- `./bin/run.js builds deploy ...` — invoke the compiled plugin from `lib/`.

## Architecture

The runtime flow is small and worth holding in your head:

1. **Entry point** — `src/commands/builds/deploy.ts` (`BuildsDeploy` extends `SfCommand`). oclif discovers it via `package.json#oclif.commands` → `./lib/commands`. Flags are defined here; user-facing strings live in `messages/builds.deploy.md` (loaded via `Messages.loadMessages('sf-orgdevmode-builds', 'builds.deploy')`).
2. **Auth** — if `--target-org` is not provided, `Commands.auth()` shells out to `sf org login jwt` using `--client-id`, `--instance-url`, `--username`, `--jwt-key-file`. Otherwise auth is skipped and the alias/username flows directly into each step.
3. **Step loop** — for each `Build` in `buildfile.builds`, `Commands.deploy(build, username)` constructs an argv and calls `BuildsUtils.execCommand`. The `--initial-step` flag (`-s`) lets you resume a partially-completed run by skipping the first N steps.
4. **Source tracking** — for `metadata` builds where `enableTracking` is falsy, `Commands.disableTracking(username)` runs `sf org disable tracking` _before_ the deploy. This is the default; pipelines normally want tracking off.
5. **Test class discovery** — for `metadata` builds with `testLevel: 'RunSpecifiedTests'`, `BuildsUtils.getApexTestClassesFromPackageXml` parses `package.xml` (xml2js), reads each listed `ApexClass` from `classPath` (default `force-app/main/default/classes`), and includes only those whose source matches `/@istest/i`. If the result is empty the deploy throws.
6. **Process execution** — `BuildsUtils.spawnPromise` wraps `child_process.spawn` with `{ shell: true }`, streams stdout/stderr to `console.log`/`console.error`, and resolves on exit code 0. `workingFolder` (set on `datapack` builds when VBT trips on unrelated metadata) becomes `cwd`.

### Key files

- `src/commands/builds/deploy.ts` — oclif command, flag definitions, top-level orchestration.
- `src/modules/commands.ts` — argv builders for each build `type`. **Adding a new step type means extending the if/else chain here and updating `Build` in `types.ts`.**
- `src/modules/utils.ts` — `spawnPromise`, `execCommand`, `execReadFileSync`, `parsePackageXml`, `getApexTestClassesFromPackageXml`. Tests stub `BuildsUtils.spawnPromise` and `BuildsUtils.execReadFileSync` — keep those static and mockable.
- `src/modules/types.ts` — `Build`, `AuthParameters`, `BuildsDeployResult`, `Package`, `PackageType`. `Build.type` is a free-form `string`; supported values are gated by the if/else in `commands.ts`.
- `messages/builds.deploy.md` — all user-facing strings. Adding a new flag requires a corresponding `flags.<name>.summary` section here.
- `dockerfiles/Dockerfile` — based on `salesforce/cli:latest-full`; bundles `vlocity`, `@salesforce/sfdx-scanner`, `gh`, Playwright (Chromium + deps), and Puppeteer. This image is what pipelines consume.

## Conventions and gotchas

- **ESM, NodeNext.** `package.json` is `"type": "module"`; `tsconfig` extends `@salesforce/dev-config/tsconfig-strict-esm`. All relative imports must include the `.js` extension (e.g. `import ... from './utils.js'`) even though the source is `.ts`.
- **Static-only modules.** `Commands` and `BuildsUtils` are classes with only static methods. Tests rely on stubbing those statics — don't refactor to instances without updating the test strategy.
- **`Build.enableTracking` is typed `string`** in `types.ts` but used as a truthy check in `deploy.ts`. Treat the type as effectively `boolean | undefined` when changing it; don't tighten without auditing the buildfile docs.
- **`build.command` is split on spaces** (`build.command.split(' ')`) — quoted arguments containing spaces will not survive. If you need that, change the type/parser deliberately.
- **`{ shell: true }`** is set in `spawn`. Any new code that interpolates user-controlled strings into `command`/`args` needs to consider shell-injection risk.
- **Test framework**: `@oclif/test` + Mocha + Sinon. Tests run the command via `BuildsDeploy.run([...])` and assert on captured stdout plus stub call counts/args. New tests should follow `test/commands/builds/deploy.test.ts` — stub `spawnPromise` and `execReadFileSync` in `beforeEach`, configure per-test return values with `.onCall(n).returns(...)`.
- **Commits**: husky + commitlint enforce conventional commits (`chore(release): ...`, `feat: ...`, etc.). lint-staged runs prettier on staged files. Releases are tagged via `chore(release): x.y.z [skip ci]` commits — don't bump `package.json#version` manually outside that flow.
- **`yarn version`** is overridden to `oclif readme`, which regenerates the README's `<!-- commands -->` block from oclif metadata. Run it after changing flags or messages.
