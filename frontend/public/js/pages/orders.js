async function initOrdersPage() {
  const mount = document.getElementById("ordersMount");
  const params = new URLSearchParams(window.location.search);
  const placedId = params.get("placed");

  if (!isLoggedIn()) {
    mount.innerHTML = `<div class="alert error">Please log in to view your orders.</div><a class="btn" href="/login.html">Go to Login</a>`;
    return;
  }

  mount.innerHTML = `<p>Loading orders...</p>`;

  try {
    const orders = await api.getOrders();

    if (orders.length === 0) {
      mount.innerHTML = `<div class="empty-state">You haven't placed any orders yet. <a href="/index.html">Start shopping</a></div>`;
      return;
    }

    const banner = placedId
      ? `<div class="alert success">Order #${placedId} placed successfully! Thank you for your purchase.</div>`
      : "";

    mount.innerHTML =
      banner +
      orders
        .map(
          (order) => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <strong>Order #${order.id}</strong>
            <div style="color:#6b7280;font-size:0.85rem">${new Date(order.created_at).toLocaleString()}</div>
          </div>
          <span class="status">${order.status}</span>
        </div>
        ${order.items
          .map(
            (item) => `
          <div class="order-line">
            <span>${item.product_name} × ${item.quantity}</span>
            <span>$${(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        `
          )
          .join("")}
        <div class="summary-row total">
          <span>Total</span>
          <span>$${Number(order.total).toFixed(2)}</span>
        </div>
      </div>
    `
        )
        .join("");
  } catch (err) {
    mount.innerHTML = `<div class="alert error">Failed to load orders: ${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initOrdersPage);
