const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "ecommerce",
  password: process.env.DB_PASSWORD || "ecommerce_pass",
  database: process.env.DB_NAME || "ecommerce_db",
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

module.exports = { pool, waitForDb };
