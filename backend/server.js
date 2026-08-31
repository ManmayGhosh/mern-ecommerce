require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { waitForDb, runMigrationsIfNeeded } = require("./db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await waitForDb();
  await runMigrationsIfNeeded();
  app.listen(PORT, () => {
    console.log(`Backend API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
