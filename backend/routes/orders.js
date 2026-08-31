const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders/checkout
// body: { items: [{ product_id, quantity }], shipping_name, shipping_address }
router.post("/checkout", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, shipping_name, shipping_address } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    await client.query("BEGIN");

    let total = 0;
    const resolvedItems = [];

    for (const item of items) {
      const productId = item.product_id;
      const quantity = parseInt(item.quantity, 10);

      if (!productId || !quantity || quantity <= 0) {
        throw { status: 400, message: "Invalid cart item" };
      }

      const productResult = await client.query(
        "SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE",
        [productId]
      );
      const product = productResult.rows[0];

      if (!product) {
        throw { status: 400, message: `Product ${productId} not found` };
      }
      if (product.stock < quantity) {
        throw { status: 400, message: `Not enough stock for ${product.name}` };
      }

      total += Number(product.price) * quantity;
      resolvedItems.push({ product, quantity });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, shipping_name, shipping_address)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [req.user.id, total.toFixed(2), shipping_name || req.user.name, shipping_address || ""]
    );
    const order = orderResult.rows[0];

    for (const { product, quantity } of resolvedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, product.id, product.name, product.price, quantity]
      );
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [
        quantity,
        product.id,
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      order_id: order.id,
      total: total.toFixed(2),
      created_at: order.created_at,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  } finally {
    client.release();
  }
});

// GET /api/orders - order history for the logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      "SELECT id, status, total, shipping_name, shipping_address, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    const orders = ordersResult.rows;
    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map((o) => o.id);
    const itemsResult = await pool.query(
      "SELECT order_id, product_id, product_name, unit_price, quantity FROM order_items WHERE order_id = ANY($1)",
      [orderIds]
    );

    const itemsByOrder = {};
    for (const item of itemsResult.rows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }

    const withItems = orders.map((o) => ({ ...o, items: itemsByOrder[o.id] || [] }));
    res.json(withItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;
