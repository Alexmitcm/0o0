import "dotenv/config";
import pgPromise from "pg-promise";

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pgp = pgPromise({});
  const db = pgp(databaseUrl);

  try {
    const indexes = await db.manyOrNone(
      `
      select schemaname, tablename, indexname
      from pg_indexes
      where schemaname = 'public'
        and tablename in (
          'PremiumProfile','UserReward','UserQuest','UserNotification','Game'
        )
      order by tablename, indexname;
      `
    );
    console.log("Existing indexes (subset):");
    for (const row of indexes) {
      console.log(` - ${row.tablename}.${row.indexname}`);
    }

    const trgm = await db.oneOrNone(
      `select * from pg_extension where extname = 'pg_trgm'`
    );
    console.log(`pg_trgm enabled: ${Boolean(trgm)}`);

    const sampleWallet = "0x123";
    const sampleStatus = "Pending";
    const sampleIsRead = false;
    const sampleSearch = "%game%";

    const explains = [
      {
        name: "UserNotification by wallet + isRead order createdAt",
        params: [sampleWallet, sampleIsRead],
        sql: 'EXPLAIN SELECT id FROM "UserNotification" WHERE "walletAddress"=$1 AND "isRead"=$2 ORDER BY "createdAt" DESC LIMIT 50'
      },
      {
        name: "UserReward by wallet + status order createdAt",
        params: [sampleWallet, sampleStatus],
        sql: 'EXPLAIN SELECT id FROM "UserReward" WHERE "walletAddress"=$1 AND "status"=$2 ORDER BY "createdAt" DESC'
      },
      {
        name: "UserQuest by wallet + status order createdAt",
        params: [sampleWallet, "Active"],
        sql: 'EXPLAIN SELECT id FROM "UserQuest" WHERE "walletAddress"=$1 AND "status"=$2 ORDER BY "createdAt" DESC'
      },
      {
        name: "Game by status order createdAt",
        params: ["Published"],
        sql: 'EXPLAIN SELECT id FROM "Game" WHERE "status"=$1 ORDER BY "createdAt" DESC LIMIT 10'
      },
      {
        name: "Game search title/description ILIKE",
        params: [sampleSearch],
        sql: 'EXPLAIN SELECT id FROM "Game" WHERE title ILIKE $1 OR description ILIKE $1 LIMIT 10'
      }
    ];

    for (const ex of explains) {
      const plan = await db.many(ex.sql, ex.params);
      console.log(`\n${ex.name}:`);
      for (const line of plan) {
        const l = (line as any)["QUERY PLAN"] as string;
        console.log(`  ${l}`);
      }
    }

    console.log("\nVerification complete.");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
};

run();
