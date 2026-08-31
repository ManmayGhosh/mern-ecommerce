// Cart is kept client-side in localStorage as an array of:
// { product_id, name, price, image_url, quantity }

const CART_KEY = "cart";

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.product_id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url,
      quantity,
    });
  }
  saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.product_id !== productId);
  } else {
    const item = cart.find((i) => i.product_id === productId);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.product_id !== productId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + item.quantity * item.price, 0);
}
