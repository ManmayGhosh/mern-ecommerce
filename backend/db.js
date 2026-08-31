const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// DATABASE_URL (as provided by Render/managed Postgres) takes priority.
// Falls back to individual DB_* vars for local Docker Compose.
const useSsl = process.env.DB_SSL === "true";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || "db",
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || "ecommerce",
      password: process.env.DB_PASSWORD || "ecommerce_pass",
      database: process.env.DB_NAME || "ecommerce_db",
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });

// Retry helper: postgres container may not accept connections the instant
// it starts, even with a healthcheck, so we retry a few times on boot.
async function waitForDb(retries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("Connected to Postgres");
      return;
    } catch (err) {
      console.log(
        `Waiting for database... (attempt ${attempt}/${retries}): ${err.message}`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Could not connect to the database after several retries");
}

// Managed Postgres (Render, RDS, etc.) has no docker-entrypoint-initdb.d
// mechanism, so on those platforms we run the schema/seed file ourselves.
// init.sql is written to be idempotent (CREATE TABLE IF NOT EXISTS, ON
// CONFLICT DO NOTHING, WHERE NOT EXISTS) so re-running it on every boot
// is safe. Only runs when RUN_MIGRATIONS=true, since local Docker Compose
// already handles this via docker-entrypoint-initdb.d.
async function runMigrationsIfNeeded() {
  if (process.env.RUN_MIGRATIONS !== "true") return;
  const sqlPath = path.join(__dirname, "db", "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log("Running database migrations...");
  await pool.query(sql);
  console.log("Migrations complete");
}

module.exports = { pool, waitForDb, runMigrationsIfNeeded };
