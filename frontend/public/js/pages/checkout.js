function renderCheckout() {
  const container = document.getElementById("checkoutContainer");
  const cart = getCart();

  if (!isLoggedIn()) {
    container.innerHTML = `
      <h1>Checkout</h1>
      <div class="alert error">Please log in to complete your order.</div>
      <a class="btn" href="/login.html">Go to Login</a>
    `;
    return;
  }

  if (cart.length === 0) {
    container.innerHTML = `
      <h1>Checkout</h1>
      <div class="empty-state">Your cart is empty. <a href="/index.html">Browse products</a></div>
    `;
    return;
  }

  const user = getUser();
  const total = cartTotal();

  container.innerHTML = `
    <h1>Checkout</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start" id="checkoutGrid">
      <div class="form-card" style="max-width:none">
        <h2 style="margin-top:0">Shipping details</h2>
        <div id="checkoutMsg"></div>
        <form id="checkoutForm">
          <div class="form-group">
            <label for="shipName">Full name</label>
            <input type="text" id="shipName" value="${user.name}" required />
          </div>
          <div class="form-group">
            <label for="shipAddress">Shipping address</label>
            <textarea id="shipAddress" rows="3" placeholder="Street, City, State, ZIP" required></textarea>
          </div>
          <button type="submit" class="btn full" id="placeOrderBtn">Place Order</button>
        </form>
      </div>

      <div class="cart-summary" style="margin-top:0">
        <h2 style="margin-top:0">Order summary</h2>
        ${cart
          .map(
            (item) => `
          <div class="summary-row">
            <span>${item.name} × ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `
          )
          .join("")}
        <div class="summary-row total">
          <span>Total</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("checkoutMsg");
    const btn = document.getElementById("placeOrderBtn");
    msg.innerHTML = "";
    btn.disabled = true;
    btn.textContent = "Placing order...";

    try {
      const payload = {
        items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        shipping_name: document.getElementById("shipName").value.trim(),
        shipping_address: document.getElementById("shipAddress").value.trim(),
      };
      const result = await api.checkout(payload);
      clearCart();
      window.location.href = `/orders.html?placed=${result.order_id}`;
    } catch (err) {
      msg.innerHTML = `<div class="alert error">${err.message}</div>`;
      btn.disabled = false;
      btn.textContent = "Place Order";
    }
  });
}

document.addEventListener("DOMContentLoaded", renderCheckout);
