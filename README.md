# ShopEasy — Dockerized E-commerce Site

A self-contained e-commerce demo store: browse products, register/login, add
items to a cart, check out, and view order history. Built to run entirely
inside Docker via `docker compose`.

## Stack

| Layer     | Tech                                             |
|-----------|---------------------------------------------------|
| Database  | PostgreSQL 16                                     |
| Backend   | Node.js 20 + Express (REST API), JWT auth, bcrypt |
| Frontend  | Static HTML/CSS/vanilla JS, served by nginx       |
| Orchestration | Docker Compose                                |

No build tooling (webpack/vite/etc.) is required for the frontend — nginx
serves the static files directly, and it proxies `/api/*` requests to the
backend container so the browser only ever talks to one origin.

## Project layout

```
ecommerce/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   ├── db/init.sql        # schema + seed data, auto-run on first db start
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js        # register / login
│       ├── products.js    # product listing / detail / categories
│       └── orders.js      # checkout / order history
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── public/
        ├── index.html      # product grid + search + category filter
        ├── product.html    # product detail + add to cart
        ├── cart.html        # cart management
        ├── checkout.html   # shipping form + place order
        ├── login.html / register.html
        ├── orders.html     # order history
        ├── css/style.css
        └── js/             # api client, cart store, navbar, per-page logic
```

## Running it

1. **Copy the environment file and edit the secrets:**

   ```bash
   cd ecommerce
   cp .env.example .env
   ```

   Open `.env` and set a strong `JWT_SECRET` and a real `POSTGRES_PASSWORD`
   before deploying anywhere beyond your own machine.

2. **Build and start everything:**

   ```bash
   docker compose up --build
   ```

   The first startup runs `backend/db/init.sql` automatically to create the
   schema and load ~12 sample products across 5 categories.

3. **Open the site:**

   - Storefront: http://localhost:8080
   - Backend API directly (optional, for testing): http://localhost:4000/api/health
   - Postgres (optional, for a DB client): localhost:5432

4. **Stop it:**

   ```bash
   docker compose down          # stop containers, keep data
   docker compose down -v       # stop containers and wipe the database volume
   ```

## How it works

- **Products** are loaded from Postgres and rendered by `js/pages/home.js`
  and `js/pages/product.js`. Search and category filtering are done via
  query params passed straight to `GET /api/products`.
- **Cart** is stored client-side in `localStorage` (see `js/cart-store.js`)
  so it survives page reloads without needing a logged-in session.
- **Auth** uses email + password with bcrypt-hashed passwords and JWTs
  (7-day expiry) stored in `localStorage`. Protected API routes require an
  `Authorization: Bearer <token>` header.
- **Checkout** (`POST /api/orders/checkout`) is transactional: it re-checks
  live prices and stock in the database, decrements stock, and writes the
  order + line items atomically, so it can't oversell or use a stale price
  from the browser.
- **Orders** page lists a logged-in user's past orders with line items.

## API reference

| Method | Path                     | Auth | Description                        |
|--------|--------------------------|------|-------------------------------------|
| GET    | `/api/health`            | No   | Health check                        |
| GET    | `/api/products`          | No   | List products (`?search=&category=`) |
| GET    | `/api/products/:id`      | No   | Single product                      |
| GET    | `/api/products/categories` | No | List categories                     |
| POST   | `/api/auth/register`     | No   | `{ name, email, password }`         |
| POST   | `/api/auth/login`        | No   | `{ email, password }`               |
| POST   | `/api/orders/checkout`   | Yes  | `{ items, shipping_name, shipping_address }` |
| GET    | `/api/orders`            | Yes  | Order history for the logged-in user |

## Customizing

- **Add/edit products:** edit the seed `INSERT` block in
  `backend/db/init.sql` (only applies on a fresh volume), or insert rows
  directly into Postgres, or add an admin API route yourself — `is_admin`
  is already a column on `users` if you want to build one.
- **Change ports:** edit the `ports:` mappings in `docker-compose.yml`.
- **Real product images:** swap the `picsum.photos` seed URLs for your own
  image URLs or set up a static `/images` volume.
- **Payments:** checkout currently just records the order — plug in a real
  payment provider (e.g. Stripe) inside `routes/orders.js` before marking
  an order as paid if you plan to take real payments.

## Production notes

This is set up for local/self-hosted Docker use. Before exposing it to the
public internet:

- Set a strong, random `JWT_SECRET` and `POSTGRES_PASSWORD` in `.env`.
- Put the site behind HTTPS (e.g. a reverse proxy like Traefik or Caddy in
  front of the `frontend` service).
- Restrict `CORS_ORIGIN` to your real domain.
- Don't expose the Postgres port (`5432`) publicly — remove that `ports:`
  mapping in `docker-compose.yml` once you don't need direct DB access.
- Add real input validation/rate limiting on the auth endpoints.
