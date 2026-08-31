async function initProductPage() {
  const container = document.getElementById("productContainer");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML = `<div class="alert error">No product specified.</div>`;
    return;
  }

  try {
    const p = await api.getProduct(id);
    document.title = `${p.name} - ShopEasy`;

    container.innerHTML = `
      <div class="product-detail">
        <img src="${p.image_url}" alt="${p.name}" />
        <div>
          <div class="category">${p.category || ""}</div>
          <h1>${p.name}</h1>
          <div class="price">$${Number(p.price).toFixed(2)}</div>
          <p>${p.description || ""}</p>
          <p style="color:#6b7280;font-size:0.9rem">${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>

          <div class="qty-control">
            <button id="qtyMinus">−</button>
            <input type="number" id="qtyInput" value="1" min="1" max="${p.stock}" />
            <button id="qtyPlus">+</button>
          </div>

          <div id="addMsg"></div>
          <button class="btn" id="addToCartBtn" ${p.stock === 0 ? "disabled" : ""}>
            Add to Cart
          </button>
        </div>
      </div>
    `;

    const qtyInput = document.getElementById("qtyInput");
    document.getElementById("qtyMinus").addEventListener("click", () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || "1", 10) - 1);
    });
    document.getElementById("qtyPlus").addEventListener("click", () => {
      qtyInput.value = Math.min(p.stock, parseInt(qtyInput.value || "1", 10) + 1);
    });

    document.getElementById("addToCartBtn").addEventListener("click", () => {
      const qty = Math.max(1, parseInt(qtyInput.value || "1", 10));
      addToCart(p, qty);
      renderNavbar();
      const msg = document.getElementById("addMsg");
      msg.innerHTML = `<div class="alert success">Added ${qty} × ${p.name} to your cart. <a href="/cart.html">View cart</a></div>`;
    });
  } catch (err) {
    container.innerHTML = `<div class="alert error">Failed to load product: ${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initProductPage);
