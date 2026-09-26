# Forkline

A REST API for a restaurant company with multiple outlets:

**Single company → multiple outlets → HQ assigns menu items → outlets record sales → HQ sees reports.**

Built with Node.js, Express 5, TypeScript, TypeORM, PostgreSQL 17, and Zod.

---

## 1. Setup Instructions

### Prerequisites

- Node.js 22+ and npm
- PostgreSQL 17 (or Docker / Docker Compose)

### Environment variables

Copy the example file and adjust if needed:

```bash
cp .env.example .env
```

| Variable      | Default (`.env.example`) | Description                          |
| ------------- | ------------------------ | ------------------------------------ |
| `PORT`        | `9000`                   | HTTP port the API listens on         |
| `NODE_ENV`    | `development`            | `development` / `production` / `test` |
| `DB_HOST`     | `localhost`              | PostgreSQL host                      |
| `DB_PORT`     | `5432`                   | PostgreSQL port                      |
| `DB_USER`     | `root`                   | PostgreSQL user                      |
| `DB_PASSWORD` | `root`                   | PostgreSQL password                  |
| `DB_NAME`     | `forkline`               | PostgreSQL database name             |

### Option A: Run everything with Docker Compose

```bash
docker compose up --build
```

This starts:

- `forkline-postgres-db`: PostgreSQL 17 with a health check and a persistent `postgres_data` volume
- `api`: the Forkline API, which starts only after the database is healthy

The API is available at `http://localhost:9000`.

### Option B: Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start only the database (or point .env at your own Postgres)
docker compose up -d forkline-postgres-db

# 3. Start the dev server (hot reload)
npm run dev
```

Production build:

```bash
npm run build
npm start
```

### Migrations

Migrations are plain SQL files in [migrations/](migrations/), managed by `node-pg-migrate`.
**They run automatically on server startup**, so you don't need a manual step. Applied migrations are tracked in the `pgmigrations` table.

Manual commands (these need `DATABASE_URL` set, e.g. `postgres://root:root@localhost:5432/forkline`):

```bash
npm run migrate:create -- <name>   # create a new SQL migration
npm run migrate:up                 # apply pending migrations
npm run migrate:down               # roll back the last migration
```

### Other scripts

```bash
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
```

### Health check

```bash
curl http://localhost:9000/health
```

```json
{
  "status": "healthy",
  "timestamp": "2026-09-26T10:00:00.000Z",
  "checks": { "database": "up" }
}
```

---

## 2. API Endpoints

Base URL: `http://localhost:9000`. All request and response bodies are JSON.

| Method | Path                           | Purpose                                     |
| ------ | ------------------------------ | ------------------------------------------- |
| GET    | `/health`                      | Service and database health                 |
| POST   | `/outlet/create`               | Create an outlet                            |
| POST   | `/menu-item/create`            | Create a master menu item (HQ)              |
| POST   | `/menu-item/assign-outlet`     | Assign a menu item to an outlet (HQ)        |
| POST   | `/sale/new`                    | Record a sale at an outlet                  |
| GET    | `/report/revenue-by-outlet`    | Revenue and sale count per outlet           |
| GET    | `/report/top-items-by-outlet`  | Best-selling items per outlet               |

### `POST /outlet/create`

```json
{
  "name": "Gulshan Branch",
  "description": "Flagship outlet",
  "location": "Gulshan 2, Dhaka"
}
```

| Field         | Type   | Required | Rules           |
| ------------- | ------ | -------- | --------------- |
| `name`        | string | yes      | 1–255 chars     |
| `description` | string | no       | default text if omitted |
| `location`    | string | no       | defaults to `Dhaka, Bangladesh` |

**201 Created**: returns the created outlet (a UUID `slug` is generated automatically).

### `POST /menu-item/create`

```json
{
  "name": "Chicken Burger",
  "description": "Grilled chicken with cheese",
  "imageUrl": "https://example.com/burger.jpg",
  "masterPrice": 350.0
}
```

| Field         | Type   | Required | Rules                     |
| ------------- | ------ | -------- | ------------------------- |
| `name`        | string | yes      | 1–255 chars               |
| `description` | string | no       | default text if omitted   |
| `imageUrl`    | string | no       | valid URL                 |
| `masterPrice` | number | yes      | > 0, at most 2 decimals   |

**201 Created**: returns the created menu item.

### `POST /menu-item/assign-outlet`

Makes a menu item sellable at an outlet, with an outlet-specific price and stock.

```json
{
  "outletId": 1,
  "menuItemId": 1,
  "priceOverride": 380.0,
  "availableUnit": 100
}
```

| Field           | Type    | Required | Rules                   |
| --------------- | ------- | -------- | ----------------------- |
| `outletId`      | integer | yes      | > 0, must exist         |
| `menuItemId`    | integer | yes      | > 0, must exist         |
| `priceOverride` | number  | yes      | > 0, at most 2 decimals |
| `availableUnit` | integer | yes      | ≥ 0                     |

**200 OK**: returns the created outlet–menu-item assignment.
**404**: outlet or menu item not found. **409**: item is already assigned to this outlet.

### `POST /sale/new`

Records a sale. Everything happens in one database transaction: stock is checked and decremented, and a per-outlet receipt number is issued.

```json
{
  "outletId": 1,
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ]
}
```

| Field                | Type    | Required | Rules            |
| -------------------- | ------- | -------- | ---------------- |
| `outletId`           | integer | yes      | > 0              |
| `items`              | array   | yes      | at least 1 item  |
| `items[].menuItemId` | integer | yes      | > 0              |
| `items[].quantity`   | integer | yes      | > 0              |

Behavior:

- Duplicate `menuItemId` entries are merged and their quantities summed.
- Unit price = `price_override` if set, otherwise the menu item's `master_price`.
- `subtotal = unit_price × quantity`; `total_amount = Σ subtotal + tax` (tax is currently `0.00`).
- Money is computed in integer cents to avoid floating-point rounding errors.

**201 Created**: returns the sale with its `saleItems`.
**404**: one or more items are not assigned to this outlet. **409**: an item is unavailable or doesn't have enough stock.

### `GET /report/revenue-by-outlet`

| Query  | Type         | Required | Description                  |
| ------ | ------------ | -------- | ---------------------------- |
| `from` | `YYYY-MM-DD` | no       | Inclusive start date         |
| `to`   | `YYYY-MM-DD` | no       | Inclusive end date (whole day) |

```bash
curl "http://localhost:9000/report/revenue-by-outlet?from=2026-09-01&to=2026-09-30"
```

```json
{
  "from": "2026-09-01",
  "to": "2026-09-30",
  "totalRevenue": "12500.00",
  "sales": [
    { "outletId": 1, "outletName": "Gulshan Branch", "totalSales": 30, "totalRevenue": "9000.00" },
    { "outletId": 2, "outletName": "Banani Branch", "totalSales": 12, "totalRevenue": "3500.00" }
  ]
}
```

Outlets with no sales in the range are still listed, with zero values. Results are sorted by revenue, highest first.

### `GET /report/top-items-by-outlet`

| Query   | Type         | Required | Description                     |
| ------- | ------------ | -------- | ------------------------------- |
| `from`  | `YYYY-MM-DD` | no       | Inclusive start date            |
| `to`    | `YYYY-MM-DD` | no       | Inclusive end date              |
| `limit` | integer      | no       | Items per outlet, 1–50 (default 5) |

```bash
curl "http://localhost:9000/report/top-items-by-outlet?limit=3"
```

```json
{
  "from": null,
  "to": null,
  "limit": 3,
  "outlets": [
    {
      "outletId": 1,
      "outletName": "Gulshan Branch",
      "items": [
        { "rank": 1, "menuItemId": 1, "menuItemName": "Chicken Burger", "quantitySold": 40, "totalRevenue": "15200.00" }
      ]
    }
  ]
}
```

Items are ranked by quantity sold, then revenue, then menu item ID as a tie-breaker.

### Error format

All errors use the same shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "details": [{ "path": "masterPrice", "message": "Master price is required." }]
}
```

In `development` a `stack` field is also included. Unknown routes return `404`.

---

## 3. Schema Explanation

![Forkline ER diagram](docs/er-diagram.png)

### `menu_items`: HQ's master catalog

| Column         | Type          | Notes                          |
| -------------- | ------------- | ------------------------------ |
| `id`           | SERIAL PK     |                                |
| `name`         | VARCHAR(255)  |                                |
| `slug`         | VARCHAR(255)  | unique, auto-generated UUID    |
| `description`  | TEXT          |                                |
| `image_url`    | VARCHAR(500)  |                                |
| `master_price` | NUMERIC(10,2) | default price, `>= 0`          |
| `is_active`    | BOOLEAN       | default `true`                 |
| `created_at` / `updated_at` | TIMESTAMP |                    |

### `outlets`

| Column        | Type         | Notes                       |
| ------------- | ------------ | --------------------------- |
| `id`          | SERIAL PK    |                             |
| `name`        | VARCHAR(255) |                             |
| `slug`        | VARCHAR(255) | unique, auto-generated UUID |
| `description` | TEXT         |                             |
| `location`    | VARCHAR(500) |                             |
| `is_active`   | BOOLEAN      | default `true`              |
| `created_at` / `updated_at` | TIMESTAMP |                 |

### `outlet_menu_items`: which items an outlet sells, at what price, with how much stock

| Column           | Type          | Notes                                        |
| ---------------- | ------------- | -------------------------------------------- |
| `id`             | SERIAL PK     |                                              |
| `outlet_id`      | FK → outlets  | `ON DELETE CASCADE`                          |
| `menu_item_id`   | FK → menu_items | `ON DELETE CASCADE`                        |
| `price_override` | NUMERIC(10,2) | nullable; if NULL, `master_price` is used    |
| `available_unit` | INT           | stock on hand, `>= 0` (DB-enforced)          |
| `is_available`   | BOOLEAN       | lets an outlet switch an item off without deleting it |
| `created_at` / `updated_at` | TIMESTAMP |                                    |

`UNIQUE (outlet_id, menu_item_id)`: an item can be assigned to an outlet only once.

### `sales`: one row per receipt

| Column           | Type          | Notes                              |
| ---------------- | ------------- | ---------------------------------- |
| `id`             | SERIAL PK     |                                    |
| `outlet_id`      | FK → outlets  | `ON DELETE RESTRICT` (sales history is never lost) |
| `receipt_number` | INT           | sequential **per outlet**          |
| `tax_amount`     | NUMERIC(10,2) | `>= 0`                             |
| `total_amount`   | NUMERIC(10,2) | `>= 0`                             |
| `created_at` / `updated_at` | TIMESTAMP |                         |

`UNIQUE (outlet_id, receipt_number)`: every outlet has its own receipt sequence (1, 2, 3 …).

### `sale_items`: line items of a sale

| Column                | Type                  | Notes                                  |
| --------------------- | --------------------- | -------------------------------------- |
| `id`                  | SERIAL PK             |                                        |
| `sale_id`             | FK → sales            | `ON DELETE CASCADE`                    |
| `outlet_menu_item_id` | FK → outlet_menu_items | `ON DELETE RESTRICT`                  |
| `quantity`            | INT                   | `> 0`                                  |
| `unit_price`          | NUMERIC(10,2)         | price **snapshot** at time of sale     |
| `subtotal`            | NUMERIC(10,2)         | `unit_price × quantity`                |
| `created_at` / `updated_at` | TIMESTAMP       |                                        |

`UNIQUE (sale_id, outlet_menu_item_id)`: one line per item per sale.

### Design decisions

- **Master price + per-outlet override.** HQ sets one catalog price, and each outlet can charge a different price without duplicating the catalog.
- **Price snapshot on sale items.** `unit_price` is copied at sale time, so later price changes don't rewrite historical revenue.
- **`NUMERIC` for money.** Exact decimal storage. The app does arithmetic in integer cents.
- **Integrity in the database.** `CHECK` constraints (non-negative prices and stock, positive quantity) and `UNIQUE` constraints back up the application-level validation.
- **`RESTRICT` on sales history.** An outlet or outlet-menu-item that has sales can't be deleted, which protects reports.

### Indexes

Defined in [migrations/1790356760761_create-indexes.sql](migrations/1790356760761_create-indexes.sql):

- `outlet_menu_items(outlet_id)`, `outlet_menu_items(menu_item_id)`
- `sales(outlet_id)`
- `sale_items(sale_id)`, `sale_items(outlet_menu_item_id)`

These cover the foreign-key joins used by the sale flow and the report queries.

---

## 4. Architecture Explanation

### Layered structure

```
HTTP request
   │
   ▼
Middlewares   helmet · cors · JSON parser · pino request logger
   │
   ▼
Router        src/routes/*.router.ts      URL → handler, attaches Zod validation
   │
   ▼
Validation    src/middlewares/validate.middleware.ts + src/schemas/*.schema.ts
   │
   ▼
Service       src/service/*.service.ts    business rules, transactions, money math
   │
   ▼
Repository    src/repository/*.repository.ts   all DB access (TypeORM / SQL)
   │
   ▼
PostgreSQL    tables defined by SQL migrations in migrations/
```

| Folder              | Responsibility |
| ------------------- | -------------- |
| `src/config/`       | Env loading, pino logger, TypeORM `DataSource` |
| `src/db/`           | DataSource initialization, migrations run on startup |
| `src/entities/`     | TypeORM entity classes that map to the tables |
| `src/schemas/`      | Zod request schemas (body/query validation) |
| `src/routes/`       | Express routers. Thin: validate, call a service, send the response |
| `src/service/`      | Business logic. Has no knowledge of HTTP beyond throwing `HttpError` |
| `src/repository/`   | Data access. Methods accept an optional `EntityManager` so they can join a transaction |
| `src/middlewares/`  | Async error wrapper, validation, 404 handling, central error handler, request logging |

### Startup sequence ([src/server.ts](src/server.ts))

1. Connect to PostgreSQL through TypeORM (exit on failure).
2. Run pending SQL migrations with `node-pg-migrate` (exit on failure).
3. Start the HTTP server.
4. On `SIGTERM`, close the DB pool and exit cleanly.

### Sale flow: consistency under concurrency

`POST /sale/new` runs in a single transaction ([src/service/sale.service.ts](src/service/sale.service.ts)):

1. Merge duplicate items in the request.
2. `SELECT … FOR UPDATE` the matching `outlet_menu_items` rows, ordered by `id` so concurrent sales lock rows in the same order and avoid deadlocks.
3. Reject items that aren't assigned to the outlet (404), or that are unavailable or short on stock (409).
4. Compute unit prices, subtotals, and totals in integer cents.
5. Issue the next per-outlet `receipt_number`.
6. Insert the `sales` row and bulk-insert the `sale_items` rows.
7. Decrement stock in one `UPDATE … FROM unnest(...)` statement.

If any step fails, everything rolls back, so stock and sales can't drift apart. Because the rows are locked, two concurrent sales of the last unit can't both succeed.

### Reports

Aggregation happens inside PostgreSQL, not in Node:

- **Revenue by outlet:** `outlets LEFT JOIN sales` with the date filter in the join condition, so outlets with zero sales still appear.
- **Top items by outlet:** a subquery groups `sale_items` by outlet and menu item, then ranks them with `ROW_NUMBER() OVER (PARTITION BY outlet_id …)`. The outer query keeps `rank <= limit`.

### Cross-cutting concerns

- **Validation:** Zod schemas with user-facing messages. Failures return `400` with a `details` array.
- **Errors:** services and repositories throw `HttpError(message, status)`. One error middleware formats all responses and hides internals outside development.
- **Logging:** structured JSON logs through `pino` / `pino-http`, pretty-printed in development.
- **Security headers:** `helmet`. **CORS:** `cors`.
- **Container:** multi-stage [Dockerfile](Dockerfile) (build stage, then a slim runtime with production dependencies only, running as the non-root `node` user).

---

## 5. Scaling Strategy

### Application tier

- **Stateless API.** No in-process sessions or caches, so you can run N replicas behind a load balancer (Nginx, an ALB, or a Kubernetes Service) and scale horizontally.
- **Migrations on startup.** Safe with multiple replicas because `node-pg-migrate` takes an advisory lock. At larger scale, move migrations to a separate release or init job so pods start faster.
- **Health endpoint.** `/health` can drive load balancer and Kubernetes readiness/liveness probes.

### Database tier

- **Connection pooling.** Put PgBouncer (transaction mode) in front of Postgres as the replica count grows, and tune the TypeORM pool size per instance.
- **Read replicas for reports.** Report queries are read-only and aggregation-heavy. Send them to a read replica (TypeORM supports `replication: { master, slaves }`) so they never compete with sale writes.
- **Indexes for time-range reports.** Add `sales(created_at)` or a composite `sales(outlet_id, created_at)` index once sales volume grows.
- **Partitioning.** Partition `sales` and `sale_items` by month (range on `created_at`) to keep indexes small and make archiving cheap.

### Reporting at scale

- **Pre-aggregation.** Keep daily rollup tables (`daily_outlet_revenue`, `daily_item_sales`), or materialized views refreshed on a schedule. Reports then read a few thousand rows instead of millions.
- **Caching.** Cache report responses in Redis, keyed by query parameters, with a short TTL. Past date ranges are immutable, so they can be cached for much longer.
- **Analytics offload.** For heavy BI workloads, stream changes (CDC with Debezium, or logical replication) into a warehouse such as ClickHouse or BigQuery.

### Write path (sales)

- **Contention is per item.** Row locks are taken only on the specific `outlet_menu_items` rows being sold, so different outlets, and different items within an outlet, don't block each other.
- **Receipt numbers.** `MAX(receipt_number) + 1` is safe against duplicates because of the `UNIQUE (outlet_id, receipt_number)` constraint. However, two concurrent sales at the same outlet that touch *different* items can race and one will fail with a constraint error. For high-throughput outlets, use a per-outlet counter row (`UPDATE outlet_counters SET last_receipt = last_receipt + 1 … RETURNING`), or lock the outlet row inside the transaction.
- **Idempotency.** Add an `Idempotency-Key` header on `POST /sale/new` so POS clients can safely retry on network failures without creating duplicate sales.
- **Event-driven side effects.** Publish a `sale.created` event (transactional outbox, then a queue such as RabbitMQ, SQS, or Kafka) to update rollups, notify inventory, and so on, without slowing the sale request.

### Operations

- Add authentication and role-based access (HQ vs. outlet staff) and rate limiting before exposing the API publicly.
- Ship pino logs to a central store (Loki, ELK). Add metrics (Prometheus: request latency, error rate, DB pool usage) and tracing (OpenTelemetry).
- Run managed Postgres (RDS, Cloud SQL) with automated backups and point-in-time recovery.

---

## License

See [LICENSE](LICENSE).
