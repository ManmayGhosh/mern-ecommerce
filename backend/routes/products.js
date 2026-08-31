const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/products?search=&category=
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${values.length}`);
    }
    if (category) {
      values.push(category);
      conditions.push(`c.name = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock,
              c.name AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.id ASC`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock,
              c.name AS category
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

module.exports = router;
