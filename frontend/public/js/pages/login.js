document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("formMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.innerHTML = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const result = await api.login({ email, password });
      setSession(result.token, result.user);
      window.location.href = "/index.html";
    } catch (err) {
      msg.innerHTML = `<div class="alert error">${err.message}</div>`;
    }
  });
});
