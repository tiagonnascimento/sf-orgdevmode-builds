# summary

Use this command to enable multi step deploys for a Salesforce project.

# description

With this command you can fetch all your project profiles in a consistent way. You can specify to only fetch current project definitions or perform the data fetch based on what's on your org.

# flags.project-only.summary

Specify if the profiles will be fetched based on the current project or the whole org.

# flags.path.summary

Specify project path when only fetching current project definitions (i.e: force-app/).

# flags.username.summary

You can use this argument to indicate from which org or username fetch the data. By default we use the current connected org if no value passed.

# examples

- <%= config.bin %> <%= command.id %>
