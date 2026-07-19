import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/db.js";
import { requiredMigrations } from "../migration/manifest.js";

const migrationDirectory = process.env.MIGRATION_DIR || path.resolve(process.cwd(), "src/migration");
const lockName = "coinplay:schema:migrations";

const checksum = (contents: string) => createHash("sha256").update(contents).digest("hex");

async function main() {
  const client = await pool.connect();
  let lockHeld = false;

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(128) PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query("SELECT pg_advisory_lock(hashtext($1))", [lockName]);
    lockHeld = true;

    const files = [...requiredMigrations];

    for (const file of files) {
      const contents = await readFile(path.join(migrationDirectory, file), "utf8");
      const fileChecksum = checksum(contents);
      const existing = await client.query<{ checksum: string }>(
        "SELECT checksum FROM schema_migrations WHERE version = $1",
        [file],
      );

      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== fileChecksum) {
          throw new Error(`Migration ${file} was modified after it was applied`);
        }
        console.log(`Already applied ${file}`);
        continue;
      }

      console.log(`Applying ${file}`);
      await client.query(contents);
      await client.query(
        "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
        [file, fileChecksum],
      );
    }

    console.log(`Migration check complete (${files.length} migration file(s))`);
  } finally {
    if (lockHeld) await client.query("SELECT pg_advisory_unlock(hashtext($1))", [lockName]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
