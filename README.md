# Salesforce CLI Plugin sf-orgdevmode-builds

[![NPM](https://img.shields.io/npm/v/sf-orgdevmode-builds.svg?label=sf-orgdevmode-builds)](https://www.npmjs.com/package/sf-orgdevmode-builds) [![Downloads/week](https://img.shields.io/npm/dw/sf-orgdevmode-builds.svg)](https://npmjs.org/package/sf-orgdevmode-builds) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/sf-orgdevmode-builds/main/LICENSE.txt)

Welcome to `sf-orgdevmode-builds`!

The purpose of this plugin is to facilitate and enable multi-step deployments in your Salesforce project. The idea is to handle dependencies easily, especially in situations where you need to apply multiple packages in a specific sequence during a release.

With this plugin, developers working on a release can dynamically define the build structure - composing a sequence of deploys or script executions.

For example, consider a specific release where you need to:

- Deploy a datapack that will create an omniscript LWC (Lightning Web Component);
- Then deploy metadata that refers to this LWC;
- Followed by deploying another metadata package that changes OWD (Organization-Wide Defaults) of a package (triggering a sharing rule recalculation);
- Finally, run an anonymous Apex script that will configure some queues and make assignments to them.

The plugin simplifies the process by having the pipeline execute only `sf builds deploy --buildfile /path/buildfile.json (plus extra parameters)`. Developers working on a release can then configure the sequence of steps in the `buildfile.json`. The plugin will authenticate with the target org (if specified in the input parameters) and execute the steps defined in the `buildfile.json`.

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

## Install

```bash
sf plugins install sf-orgdevmode-builds@x.y.z
```

## Commands

<!-- commands -->

## `sf builds deploy`

With this command you can deploy multiple packages with just one command. You can indicate a buildfile containing the characteristics of this multi-step process and the command will act accordingly.

```
USAGE
  $ sf builds deploy -b <value> [--json] [-t <value>] [-i <value>] [-l <value>] [-f <value>] [-u <value>]

FLAGS
  -b, --buildfile=<value>     (required) Path for the buildfile.json describing the builds that neeeds to be applied.
  -f, --jwt-key-file=<value>  Path for the JWT private key file that are going to sign the JWT. Optional if --target-org is informed
  -i, --client-id=<value>     This is the client id or connected key from the connected app used to authenticate this command.
  -l, --instance-url=<value>  URL for the instance you are going to connect.
  -t, --target-org=<value>    Alias or username for the connected target org. If informed, there is no need to inform the other auth parms.
  -u, --username=<value>      Username used to create the JWT.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  Execute a multi-step deploy as per buildfile.json on an already authenticated org:

    $ sf builds deploy --buildfile buildfile.json --target-org orgAlias

  Authenticate and execute a multi-step deploy as per buildfile.json:

    $ sf builds deploy --buildfile buildfile.json --client-id <client_id> --instance-url https://login.salesforce.com/ --username <username> --jwt-key-file server.key
```

<!-- commandsstop -->

## Authentication & Authorization

The plugin offers two ways to authenticate and authorize in the target org: either by executing it with the `--target-org` parameter to use a previously existing authorization, or by providing specific parameters for authentication.

When executed with the `--target-org` parameter, authentication and authorization are skipped, and deployments use the specified username/alias. Otherwise, you need to provide the `--client-id`, `--instance-url`, `--username`, and `--jwt-key-file` parameters.

In the latter case, the plugin leverages the [JWT Bearer Flow](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_jwt_flow.htm) for authorization in the target org. Only that it utilizes the new sf CLI commands, rather than the legacy sfdx commands. It utilizes the `sf org login jwt` command, as described [here](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_org_commands_unified.htm#cli_reference_org_login_jwt_unified).

To implement this, you'll need to use [OpenSSL to create the key and a self-signed certificate](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_key_and_cert.htm) and [create a connected app, configuring it for Salesforce DX](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_connected_app.htm). Keep in mind that the private key must be kept secure, as anyone with access can log into the org. It can be stored as an encrypted file within the repository or as a secret, and should be provided to the plugin using the `--jwt-key-file` parameter.

## File: buildfile.json

Each release is a different release. It may be necessary to perform deployments that resolve dependencies before deploying the main package. It may be necessary to apply Salesforce Industries/Vlocity datapacks before or after the package. It may be necessary to run APEX scripts that will create reference data before or after the main package. All these nuances are captured by the file located at build/buildfile.json. Here is an example of how to fill in this file:

```json
{
  "builds": [
    {
      "type": "metadata",
      "manifestFile": "manifest/package.xml",
      "testLevel": "RunSpecifiedTests",
      "classPath": "force-app/main/default/classes",
      "preDestructiveChanges": "manifest/preDestructive/destructiveChanges.xml",
      "postDestructiveChanges": "manifest/postDestructive/destructiveChanges.xml",
      "timeout": "33",
      "ignoreWarnings": true,
      "disableTracking": true,
      "outputFormat": "json"
    },
    {
      "type": "datapack",
      "manifestFile": "manifest/sfi-package.yaml"
    },
    {
      "type": "anonymousApex",
      "apexScript": "scripts/apex/hello.apex"
    },
    {
      "type": "command",
      "command": "sf --version"
    }
  ]
}
```

Some considerations regarding this configuration file:

- For builds with the `type` parameter set to `metadata`:
  - The build's manifest file must be provided in the `manifestFile` parameter. This file is a `package.xml`, which is usually stored in `manifest/package.xml`, but it may be necessary to create other `package.xml` files to meet the purpose of the release, which can have different names and locations;
  - If the project has multiple metadata directories (after all, an SFDX project can have other metadata directories in addition to `force-app/main/default`), the classPath parameter must be specified when the `testLevel` is set to `RunSpecifiedTests`. Otherwise, test classes will only be searched in the default directory;
  - All other parameters are optional, including pre/post destructive changes;
  - If the `testLevel` is not specified, the script will deploy using `RunLocalTests`;
  - Normally on your pipeline sandboxes you will deploy using `enableTracking` as a `false` - which is the default value. If you want to use source tracking you can use this value as `true`;
  - `outputFormat` is an optional parameter and the only acceptable value is json. If informed, the `--json` will be append in the `sf project deploy start` command. Please, be aware that if the deployment is big, this output format could impact the maxBuffer size of the command output and fail the process.
- For other types of deployments:
  - If `type` is `datapack`, the `manifestFile` field is required;
  - If `type` is `anonymousApex`, the `apexScript` field is required;
  - If `type` is `command`, the `command` field is required - this could be any shell command that you want to execute.

## Files: package.xml

These files contain all the metadata that will be deployed by the script. If necessary, more than one `package.xml` can be created by the project and specified as separate builds in the `buildfile.json` file. This is typically required when dependencies need to be resolved before the main deployment. The idea is to have the fewest possible `package.xml(s)` in any release, as this will make the deployment process more agile. This file is usually located at `manifest/package.xml`.

Each build will deploy all the metadata listed in the manifest files again. This can result in multiple versions of the same component being generated, such as flows versions, even if it hasn't been changed in the versioning that triggered the build. This is an undesired consequence but also very difficult to avoid, and it is practically inconsequential. If these components use references to elements that only exist after the package deployment, it may be necessary to perform a fix immediately after deployment to adjust these references and align the repository content with the definitions in the target sandbox.

## Destructive changes

When it is necessary to remove metadata from the org during deployment, destructive changes can be used. Destructive changes should always be placed in a directory containing a boilerplate `package.xml` file (an empty package.xml file - a requirement imposed by the Metadata API) and another file named `destructiveChanges.xml`. In this file, the metadata that needs to be deleted is listed as if it were a regular `package.xml`. In the example above, the deployment will delete the listed metadata that is in `manifest/preDestructive/destructiveChanges.xml`, then perform the deployment based on the specified manifest file, and finally delete the metadata listed in `manifest/postDestructive/destructiveChanges.xml`.

## Files: sfi-package.yaml

These files serve the same purpose as the `package.xml` file for deploying Salesforce Industries (previously known as Vlocity) datapacks. The deployment method used by the project is manifest-based, so the datapacks that need to be installed must be explicitly listed.

Each build will deploy all the listed datapacks again, which can result in generating multiple versions of the same component, even if it hasn't been modified in the versioning that triggered the build. This is an unintended consequence but also very difficult to avoid, and it is practically harmless.

For this type of deployment to work, the environment in which the plugin is executing needs to have installed [Vlocity Build Tool CLI](https://github.com/vlocityinc/vlocity_build).

Here is an example of the sfi-package.yaml file:

```yml
projectPath: .
expansionPath: ./vlocity/
manifest:
  - DataRaptor/GetAccDetails
  - DataRaptor/GetAccountBalanceInfo
  - DataRaptor/TransformCashBalance
  - VlocityCard/ReviewBalanceMovements
  - VlocityCard/showAdvanceBalanceMovement
  - VlocityCard/showCashBalanceMovement
  - VlocityCard/showTermBalanceMovement
delete: true
activate: true
compileOnBuild: true
maxDepth: -1
continueAfterError: true
useAllRelationships: false
supportHeadersOnly: true
supportForceDeploy: true
```

The file properties can be changed whenever needed to address requirements for the release being worked.

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.
