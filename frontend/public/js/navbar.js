function renderNavbar() {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  const user = getUser();
  const count = cartCount();

  mount.innerHTML = `
    <div class="navbar-inner">
      <a class="brand" href="/index.html">ShopEasy</a>
      <div class="search-box">
        <input type="text" id="navSearch" placeholder="Search products..." />
      </div>
      <div class="nav-links">
        <a href="/index.html">Home</a>
        <a href="/cart.html">Cart${count > 0 ? `<span class="cart-badge">${count}</span>` : ""}</a>
        ${
          user
            ? `<a href="/orders.html">Orders</a>
               <span style="color:#6b7280">Hi, ${user.name.split(" ")[0]}</span>
               <button id="logoutBtn">Logout</button>`
            : `<a href="/login.html">Login</a>
               <a href="/register.html">Register</a>`
        }
      </div>
    </div>
  `;

  const searchInput = document.getElementById("navSearch");
  const params = new URLSearchParams(window.location.search);
  if (params.get("search")) searchInput.value = params.get("search");

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = e.target.value.trim();
      window.location.href = `/index.html${q ? `?search=${encodeURIComponent(q)}` : ""}`;
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "/index.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", renderNavbar);
