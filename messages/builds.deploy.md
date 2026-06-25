# summary

Run a multi-step build against a Salesforce org from a buildfile.json.

# description

Reads a buildfile.json describing an ordered list of build steps and executes them sequentially against a target org. Each step is one of: metadata (sf project deploy start), datapack (Vlocity/Salesforce Industries packDeploy), anonymousApex (sf apex run), or command (an arbitrary CLI command). Use this to deploy releases that require several coordinated steps with a single command, identically on CI and locally.

# flags.buildfile.summary

Path to the buildfile.json describing the build steps to run.

# flags.target-org.summary

Alias or username of the target org. When omitted, the command authenticates with the JWT flow using --client-id, --instance-url, --username and --jwt-key-file.

# flags.client-id.summary

Consumer key (client id) of the connected app used for JWT authentication.

# flags.instance-url.summary

URL of the instance to authenticate against. Defaults to https://login.salesforce.com.

# flags.jwt-key-file.summary

Path to the private key file used to sign the JWT.

# flags.initial-step.summary

Zero-based index of the first step to run; earlier steps are skipped. Use it to resume a partially completed build. Default: 0.

# flags.username.summary

Username to authenticate as with the JWT flow.

# info.success

Build completed: executed %s of %s step(s).

# examples

- Run a build against an already-authenticated org by alias:

  <%= config.bin %> <%= command.id %> --buildfile manifest/buildfile.json --target-org my-sandbox

- Authenticate with the JWT flow and run the build:

  <%= config.bin %> <%= command.id %> --buildfile manifest/buildfile.json --client-id <consumer-key> --username ci@example.com --jwt-key-file ./server.key

- Resume a build starting from the third step (index 2):

  <%= config.bin %> <%= command.id %> --buildfile manifest/buildfile.json --target-org my-sandbox --initial-step 2
