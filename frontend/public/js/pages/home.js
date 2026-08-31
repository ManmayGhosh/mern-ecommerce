async function initHomePage() {
  const grid = document.getElementById("productGrid");
  const categoryBar = document.getElementById("categoryBar");

  const params = new URLSearchParams(window.location.search);
  const search = params.get("search") || "";
  const activeCategory = params.get("category") || "";

  grid.innerHTML = `<p>Loading products...</p>`;

  try {
    const [products, categories] = await Promise.all([
      api.getProducts({ search, category: activeCategory }),
      api.getCategories(),
    ]);

    // Category chips
    const chips = [{ name: "All" }, ...categories];
    categoryBar.innerHTML = chips
      .map((c) => {
        const name = c.name === "All" ? "" : c.name;
        const isActive = name === activeCategory ? "active" : "";
        return `<button class="chip ${isActive}" data-category="${name}">${c.name}</button>`;
      })
      .join("");

    categoryBar.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const cat = chip.getAttribute("data-category");
        const qs = new URLSearchParams();
        if (search) qs.set("search", search);
        if (cat) qs.set("category", cat);
        window.location.href = `/index.html${qs.toString() ? `?${qs}` : ""}`;
      });
    });

    // Product grid
    if (products.length === 0) {
      grid.innerHTML = `<div class="empty-state">No products found.</div>`;
      return;
    }

    grid.innerHTML = products
      .map(
        (p) => `
      <a class="product-card" href="/product.html?id=${p.id}">
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" />
        <div class="info">
          <div class="category">${p.category || ""}</div>
          <div class="name">${p.name}</div>
          <div class="price">$${Number(p.price).toFixed(2)}</div>
        </div>
      </a>
    `
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<div class="alert error">Failed to load products: ${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initHomePage);
