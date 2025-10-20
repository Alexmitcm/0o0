"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const pg_promise_1 = __importDefault(require("pg-promise"));
const run = async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }
    const pgp = (0, pg_promise_1.default)({});
    const db = pgp(databaseUrl);
    const migrationsDir = node_path_1.default.resolve(__dirname, "..", "src", "prisma", "migrations");
    const files = [
        "20250821120000_add_search_indexes/migration.sql",
        "20250821121000_add_composite_indexes/migration.sql"
    ];
    try {
        await db.tx(async (t) => {
            for (const relativeFile of files) {
                const fullPath = node_path_1.default.join(migrationsDir, relativeFile);
                if (!node_fs_1.default.existsSync(fullPath)) {
                    console.warn(`Skip missing migration file: ${relativeFile}`);
                    continue;
                }
                const sql = node_fs_1.default.readFileSync(fullPath, "utf8");
                console.log(`Applying: ${relativeFile}`);
                await t.none(sql);
            }
        });
        console.log("Index migrations applied successfully.");
        process.exit(0);
    }
    catch (error) {
        console.error("Failed to apply index migrations:", error);
        process.exit(1);
    }
    finally {
        pgp.end();
    }
};
run();
