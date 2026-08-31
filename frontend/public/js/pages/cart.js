function renderCartPage() {
  const itemsMount = document.getElementById("cartItems");
  const summaryMount = document.getElementById("cartSummary");
  const cart = getCart();

  if (cart.length === 0) {
    itemsMount.innerHTML = `<div class="empty-state">Your cart is empty. <a href="/index.html">Browse products</a></div>`;
    summaryMount.innerHTML = "";
    return;
  }

  itemsMount.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.product_id}">
      <img src="${item.image_url}" alt="${item.name}" />
      <div class="details">
        <div class="name">${item.name}</div>
        <div class="unit-price">$${item.price.toFixed(2)} each</div>
      </div>
      <div class="qty-control">
        <button class="qty-minus">−</button>
        <input type="number" class="qty-value" value="${item.quantity}" min="1" />
        <button class="qty-plus">+</button>
      </div>
      <div style="width:70px;text-align:right;font-weight:600">
        $${(item.price * item.quantity).toFixed(2)}
      </div>
      <button class="btn danger remove-btn" style="padding:8px 12px">Remove</button>
    </div>
  `
    )
    .join("");

  const total = cartTotal();
  summaryMount.innerHTML = `
    <div class="cart-summary">
      <div class="summary-row total">
        <span>Total</span>
        <span>$${total.toFixed(2)}</span>
      </div>
      <a href="/checkout.html" class="btn full" style="margin-top:14px;display:block;text-align:center">
        Proceed to Checkout
      </a>
    </div>
  `;

  itemsMount.querySelectorAll(".cart-item").forEach((row) => {
    const productId = parseInt(row.getAttribute("data-id"), 10);
    const qtyInput = row.querySelector(".qty-value");

    row.querySelector(".qty-minus").addEventListener("click", () => {
      const newQty = Math.max(1, parseInt(qtyInput.value, 10) - 1);
      updateCartQuantity(productId, newQty);
      renderCartPage();
      renderNavbar();
    });
    row.querySelector(".qty-plus").addEventListener("click", () => {
      const newQty = parseInt(qtyInput.value, 10) + 1;
      updateCartQuantity(productId, newQty);
      renderCartPage();
      renderNavbar();
    });
    qtyInput.addEventListener("change", () => {
      const newQty = Math.max(1, parseInt(qtyInput.value || "1", 10));
      updateCartQuantity(productId, newQty);
      renderCartPage();
      renderNavbar();
    });
    row.querySelector(".remove-btn").addEventListener("click", () => {
      removeFromCart(productId);
      renderCartPage();
      renderNavbar();
    });
  });
}

document.addEventListener("DOMContentLoaded", renderCartPage);
