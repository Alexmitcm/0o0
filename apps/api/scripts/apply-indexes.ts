import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pgPromise from "pg-promise";

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pgp = pgPromise({});
  const db = pgp(databaseUrl);

  const migrationsDir = path.resolve(
    __dirname,
    "..",
    "src",
    "prisma",
    "migrations"
  );

  const files = [
    "20250821120000_add_search_indexes/migration.sql",
    "20250821121000_add_composite_indexes/migration.sql"
  ];

  try {
    await db.tx(async (t) => {
      for (const relativeFile of files) {
        const fullPath = path.join(migrationsDir, relativeFile);
        if (!fs.existsSync(fullPath)) {
          console.warn(`Skip missing migration file: ${relativeFile}`);
          continue;
        }
        const sql = fs.readFileSync(fullPath, "utf8");
        console.log(`Applying: ${relativeFile}`);
        await t.none(sql);
      }
    });

    console.log("Index migrations applied successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to apply index migrations:", error);
    process.exit(1);
  } finally {
    pgp.end();
  }
};

run();
