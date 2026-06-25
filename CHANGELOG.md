# [2.0.0](https://github.com/tiagonnascimento/sf-orgdevmode-builds/compare/1.7.2...2.0.0) (2026-06-25)


* refactor!: state-of-the-art rework of builds deploy ([e205c7c](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/e205c7ca46b7d72809b14b8ed46ca6962f108eeb)), closes [#286](https://github.com/tiagonnascimento/sf-orgdevmode-builds/issues/286)


### Reverts

* Revert "chore(release): 1.7.3 [skip ci]" ([f5cf703](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/f5cf70333db8983a8f76e4d5e4a890210335d9c7))


### BREAKING CHANGES

* the `--json` result shape changed from `{ success: boolean }`
to `{ stepsExecuted: number, totalSteps: number }`. Any automation parsing the
previous `success` field must be updated. Internals were also restructured
(domain/services/strategies) but the buildfile.json contract and the
`sf builds deploy` flags are unchanged.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>



## [1.7.2](https://github.com/tiagonnascimento/sf-orgdevmode-builds/compare/1.7.1...1.7.2) (2025-07-19)


### Bug Fixes

* **deps:** bump @oclif/core from 4.2.4 to 4.2.10 ([94256ae](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/94256ae6779cf6882b9c333d47afecf8d45461b6))



## [1.7.1](https://github.com/tiagonnascimento/sf-orgdevmode-builds/compare/1.7.0...1.7.1) (2025-01-25)


### Bug Fixes

* **deps:** bump @oclif/core from 4.2.2 to 4.2.4 ([214b10c](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/214b10c5184774e64ddeb008fa9913801c890514))



# [1.7.0](https://github.com/tiagonnascimento/sf-orgdevmode-builds/compare/1.6.1...1.7.0) (2025-01-11)


### Bug Fixes

* **deps:** bump @oclif/core from 4.0.20 to 4.0.27 ([2420d03](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/2420d034108494d3b2d9c214c4a6f7eaf4af0464))
* **deps:** bump @oclif/core from 4.0.27 to 4.2.2 ([37a9de0](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/37a9de08d3983904e73f4550b64097bc92d8cc99))



## [1.6.1](https://github.com/tiagonnascimento/sf-orgdevmode-builds/compare/1.6.0...1.6.1) (2024-09-09)


### Bug Fixes

* removing stdout and stderr from spawnPromise to avoid memory allocation increasing ([80b0e11](https://github.com/tiagonnascimento/sf-orgdevmode-builds/commit/80b0e11e93fe84f930903760f0bf5b4a7d48f665))



