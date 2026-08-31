# ShopEasy — Dockerized E-commerce Site

A self-contained e-commerce demo store: browse products, register/login, add
items to a cart, check out, and view order history. Built to run entirely
inside Docker via `docker compose`.

**[Live demo](https://shopeasy-frontend-jiaq.onrender.com/)**
---

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

## Deploying it as a live website (Render)

This deploys as **three separate pieces**, matching how you've deployed
other projects: a managed Postgres database, the backend as a Docker Web
Service, and the frontend as a Static Site. The frontend being a static
site (not a Dockerized nginx service) means there's no `proxy_pass`
hostname to resolve at all — the browser calls the backend's public URL
directly, so the nginx/Render network-isolation issues you've hit before
don't apply here.

### Option A — One-shot with the included Blueprint

1. Push this repo to GitHub.
2. In the Render dashboard: **New > Blueprint**, point it at the repo. It
   reads `render.yaml` and creates all three services (`shopeasy-db`,
   `shopeasy-backend`, `shopeasy-frontend`) in one go, with `JWT_SECRET`
   auto-generated and `DATABASE_URL` wired to the database automatically.
3. If the service names are already taken on Render, rename them in
   `render.yaml` — but if you do, update the two cross-references too:
   `CORS_ORIGIN` (in the backend service) and the backend URL baked into
   the frontend's `buildCommand`, since Render URLs are `https://<service-name>.onrender.com`.
4. First deploy runs `db/init.sql` automatically (via `RUN_MIGRATIONS=true`)
   since managed Postgres has no `docker-entrypoint-initdb.d` — it's
   idempotent, so this is safe to leave on.

### Option B — Manual, via the Render dashboard

1. **Database:** New > PostgreSQL. Once created, copy the **Internal
   Database URL**.
2. **Backend:** New > Web Service > connect the repo > root directory
   `backend` > Runtime: Docker. Set env vars:
   - `DATABASE_URL` — the Internal Database URL from step 1
   - `DB_SSL` = `true`
   - `RUN_MIGRATIONS` = `true` (only needed for the first deploy, but
     harmless to leave on since `init.sql` is idempotent)
   - `JWT_SECRET` — a long random string
   - `CORS_ORIGIN` — you'll fill this in after step 3
   - Do **not** set `PORT` — Render injects its own and `server.js`
     already reads `process.env.PORT`.
3. **Frontend:** New > Static Site > same repo > publish directory
   `frontend/public`. No build command needed — but first edit
   `frontend/public/js/config.js` and set:
   ```js
   window.__API_BASE__ = "https://<your-backend-service>.onrender.com/api";
   ```
   then commit and push (Render redeploys on push).
4. Go back to the backend service and set `CORS_ORIGIN` to your frontend's
   `https://<your-frontend-service>.onrender.com` URL, then redeploy the
   backend.

### After deploying

- Visit the frontend URL — it should load products from the backend.
- If products don't load, check the backend logs for CORS or DB
  connection errors first; those are the two most common first-deploy
  issues.
- Once things are stable, you can drop `RUN_MIGRATIONS` if you don't want
  the schema re-checked on every boot.

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
