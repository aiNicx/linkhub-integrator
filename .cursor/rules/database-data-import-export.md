If you're bootstrapping your app from existing data, Convex provides three ways to get the data in:

Import from csv/json into a single table via the CLI.
Restore from a backup via the dashboard or CLI.
Streaming import from any existing database via Airbyte destination connector.
You can export data from Convex in two ways.

Download a backup as a zip from the dashboard.
Set up streaming export to any external database via Fivetran or Airbyte. Great for connecting to a custom BI setup (eg Snowflake, Databricks, or BigQuery):

Data Export
You can export your data from Convex by taking a backup and downloading it as a zip file.

Alternatively, you can export the same data with the command line:

npx convex export --path ~/Downloads

Data Import
You can import data into Convex from a local file using the command line.

npx convex import

Data import is in beta
Data import is currently a beta feature. If you have feedback or feature requests, let us know on Discord!

Use --help to see all options. The most common flows are described here.

Single table import
npx convex import --table <tableName> <path>

Import a CSV, JSON, or JSONLines file into a Convex table.

.csv files must have a header, and each row's entries are interpreted either as a (floating point) number or a string.
.jsonl files must have a JSON object per line.
.json files must be an array of JSON objects.
JSON arrays have a size limit of 8MiB. To import more data, use CSV or JSONLines. You can convert json to jsonl with a command like jq -c '.[]' data.json > data.jsonl
Imports into a table with existing data will fail by default, but you can specify --append to append the imported rows to the table or --replace to replace existing data in the table with your import.

The default is to import into your dev deployment. Use --prod to import to your production deployment or --preview-name to import into a preview deployment.

Restore data from a backup ZIP file
npx convex import <path>.zip

Import from a Backup into a Convex deployment, where the backup is a ZIP file that has been downloaded on the dashboard. Documents will retain their _id and _creationTime fields so references between tables are maintained.

Imports where tables have existing data will fail by default, but you can specify --replace to replace existing data in tables mentioned in the ZIP file.

Use cases
Seed dev deployments with sample data.
# full backup - exported from prod or another dev deployment.
npx convex import seed_data.zip

# Import single table from jsonl/csv
npx convex import --table <table name> data.jsonl

Restore a deployment from a backup programmatically. Download a backup, and restore from this backup if needed.
npx convex import --prod --replace backup.zip

Seed preview deployments with sample data, exported from prod, dev, or another preview deployment. Example for Vercel, seeding data from seed_data.zip committed in the root of the repo.
npx convex deploy --cmd 'npm run build' &&
if [ "$VERCEL_ENV" == "preview" ]; then
npx convex import --preview-name "$VERCEL_GIT_COMMIT_REF" seed_data.zip;
fi

Clear a table efficiently with an empty import.
touch empty_file.jsonl
npx convex import --replace --table <tableNameToClear> empty_file.jsonl

Features
Data import is the only way to create documents with pre-existing _id and _creationTime fields.
The _id field must match Convex's ID format.
If _id or _creationTime are not provided, new values are chosen during import.
Data import creates and replaces tables atomically (except when using --append).
Queries and mutations will not view intermediate states where partial data is imported.
Indexes and schemas will work on the new data without needing time for re-backfilling or re-validating.
Data import only affects tables that are mentioned in the import, either by --table or as entries in the ZIP file.
While JSON and JSONLines can import arbitrary JSON values, ZIP imports can additionally import other Convex values: Int64, Bytes, etc. Types are preserved in the ZIP file through the generated_schema.jsonl file.
Data import of ZIP files that include file storage import the files and preserve _storage documents, including their _id, _creationTime, and contentType fields.
Warnings
Streaming Export (Fivetran or Airbyte) does not handle data imports or backup restorations, similar to table deletion and creation and some schema changes. We recommend resetting streaming export sync after a restore or a data import.
Avoid changing the ZIP file between downloading it from Data Export and importing it with npx convex import. Some manual changes of the ZIP file may be possible, but remain undocumented. Please share your use case and check with the Convex team in Discord.
Data import is not always supported when importing into a deployment that was created before Convex version 1.7.
The import may work, especially when importing a ZIP backup from a deployment created around the same time as the target deployment. As a special case, you can always restore from backups from its own deployment.
Reach out in Discord if you encounter issues, as there may be a workaround.