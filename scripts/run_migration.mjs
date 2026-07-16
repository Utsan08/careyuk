// Runs the given SQL file (or inline statements) directly against Postgres.
// Usage: DATABASE_URL=... node scripts/run_migration.mjs path/to/file.sql

import pg from "pg";
import { readFileSync } from "node:fs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/run_migration.mjs <sql-file>");
  process.exit(1);
}

const sql = readFileSync(filePath, "utf8");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log("Connected.");
  await client.query(sql);
  console.log("Migration applied successfully.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
