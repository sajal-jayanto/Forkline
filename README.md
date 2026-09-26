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

## 5. Scaling Plan

**Target: 10 outlets, 100,000 transactions (sales) per month.**

The plan does not need to be implemented yet. It explains how the current design grows to meet this target, and what would change beyond it.

### 5.1 Sizing the workload

Sizing the load first shows which changes are actually needed.

| Metric                                  | Estimate                                   |
| --------------------------------------- | ------------------------------------------ |
| Sales per month                         | 100,000                                    |
| Sales per day                           | ~3,300 (~330 per outlet)                   |
| Average rate over a 12-hour trading day | ~280 sales/hour ≈ **0.08 sales/second**    |
| Peak rate (lunch/dinner, ~5–10× average) | **~1–2 sales/second** across all outlets  |
| `sales` rows per year                   | ~1.2 million                               |
| `sale_items` rows per year (~3 lines/sale) | ~3.6 million                            |
| Storage growth (data + indexes)         | roughly **1–2 GB per year**                |

**Conclusion:** the write load is small. One PostgreSQL instance can handle thousands of simple transactions per second, and this target needs about 2 at peak. Writes will not be the bottleneck. The real risks are:

1. **Reports get slower as history grows.** They scan all of `sales` / `sale_items` for the requested range, and at 5M+ rows an unindexed full-history report takes seconds instead of milliseconds.
2. **Correctness under concurrency.** More outlets and more simultaneous tills expose race conditions that don't show up in testing.
3. **Availability.** With 10 outlets taking payments, a single database container with no backups is the biggest operational risk.

The plan therefore focuses on reporting, correctness and reliability, not raw throughput.

### 5.2 Database scaling strategies

**Stay on a single primary PostgreSQL. Do not shard.** Sharding (or splitting the database per outlet) adds cross-outlet reporting complexity and solves a throughput problem this system doesn't have.

**a) Indexes for time-range queries.** Every report filters on `sales.created_at`, but today only `sales(outlet_id)` is indexed. Add:

```sql
-- Revenue report: range scan per outlet; INCLUDE allows index-only scans for SUM(total_amount)
CREATE INDEX idx_sales_outlet_created ON sales (outlet_id, created_at) INCLUDE (total_amount);
-- Company-wide date filters (top-items subquery filters by date before grouping)
CREATE INDEX idx_sales_created_at ON sales (created_at);
```

**b) Fix the receipt-number race.** `receipt_number` is currently `MAX(receipt_number) + 1` inside the sale transaction. The `FOR UPDATE` lock covers only the `outlet_menu_items` rows being sold. Two tills at the same outlet selling *different* items at the same moment can read the same `MAX` value, and one of them then fails on `UNIQUE (outlet_id, receipt_number)`. With 10 busy outlets this will happen at peak times. Fix it with a per-outlet counter row that serializes only receipt issuance:

```sql
CREATE TABLE outlet_receipt_counters (
  outlet_id    INT PRIMARY KEY REFERENCES outlets(id),
  last_receipt INT NOT NULL DEFAULT 0
);
-- inside the sale transaction:
UPDATE outlet_receipt_counters SET last_receipt = last_receipt + 1
WHERE outlet_id = $1 RETURNING last_receipt;
```

This also replaces a `MAX()` over a growing table with a single-row update.

**c) Idempotent sale creation.** Outlet POS terminals run on real-world networks. When a request times out after the server committed, the retry must not create a second sale. Add an `Idempotency-Key` header on `POST /sale/new`, stored in a `sales.client_reference UUID UNIQUE` column. A retry with the same key returns the original sale.

**d) Connection management.** With 2–3 API replicas, each TypeORM pool (default 10) stays well under Postgres's `max_connections`. Set the pool size explicitly. Add PgBouncer (transaction mode) only when replica count or serverless deployment makes connection count a problem.

**e) Timezone-correct timestamps.** `created_at` is `TIMESTAMP` without a time zone, and the reports turn `from`/`to` into day boundaries. Migrate to `TIMESTAMPTZ` and compute day boundaries in the business time zone (`Asia/Dhaka`), so "sales on 1 September" means the same thing to every outlet and every server.

**f) Partitioning and archiving: not yet.** At ~1.2M sales/year, monthly partitioning of `sales` / `sale_items` adds operational work with no measurable benefit. Revisit it at around 50–100M rows, or when old data needs cheap archiving (`DETACH PARTITION`). The schema already allows it, because `created_at` is on every sale.

### 5.3 Reporting performance considerations

Reports are read-heavy, used mainly by HQ, and mostly about *past* days, whose data never changes. Three steps, in order:

**1. Daily rollup tables (main change).**

```sql
CREATE TABLE daily_outlet_sales (
  outlet_id     INT  NOT NULL REFERENCES outlets(id),
  sale_date     DATE NOT NULL,
  sale_count    INT  NOT NULL,
  revenue       NUMERIC(14,2) NOT NULL,
  PRIMARY KEY (outlet_id, sale_date)
);

CREATE TABLE daily_item_sales (
  outlet_id     INT  NOT NULL REFERENCES outlets(id),
  menu_item_id  INT  NOT NULL REFERENCES menu_items(id),
  sale_date     DATE NOT NULL,
  quantity_sold INT  NOT NULL,
  revenue       NUMERIC(14,2) NOT NULL,
  PRIMARY KEY (outlet_id, menu_item_id, sale_date)
);
```

- **How they're kept up to date:** upsert (`INSERT … ON CONFLICT DO UPDATE`) inside the existing sale transaction. The sale already holds a `FOR UPDATE` lock on the same `(outlet, menu item)` rows, so the rollup upsert adds no new lock contention. The rollup is always exactly consistent with `sales`.
- **Size:** 10 outlets × ~100 items × 365 days ≈ 365k rows/year at most, compared with ~3.6M `sale_items` rows. A one-year report reads a few thousand rows.
- **Queries:** `revenue-by-outlet` becomes `SUM` over `daily_outlet_sales`. `top-items-by-outlet` keeps the same `ROW_NUMBER() OVER (PARTITION BY outlet_id …)` logic, but runs it over `daily_item_sales`.
- A one-off backfill script builds the rollups from existing sales. A nightly check compares rollup totals with the raw tables.

(Alternative: materialized views with `REFRESH MATERIALIZED VIEW CONCURRENTLY` every few minutes. This is simpler to add, but reports become slightly stale, and each refresh recomputes everything.)

**2. Response caching.** Cache report responses in Redis, keyed by endpoint and query parameters. Ranges that end before today are immutable and can be cached for hours. Ranges that include today get a short TTL (30–60 s). With rollups in place, this is an optimization, not a requirement.

**3. Read replica (when needed).** Send report traffic to a streaming replica (TypeORM `replication: { master, slaves }`), so heavy ad-hoc reporting or exports never compete with sale writes. At this scale the replica matters more for **failover** than for performance.

Also add pagination/limits for any future list endpoints, such as a sales history per outlet.

### 5.4 Infrastructure considerations

| Area                | Today                                   | At 10 outlets / 100k per month |
| ------------------- | --------------------------------------- | -------------------------------- |
| Database            | Postgres container with a Docker volume | **Managed PostgreSQL** (RDS / Cloud SQL / Azure) with automated backups, point-in-time recovery and a Multi-AZ standby. A modest instance (2 vCPU / 4–8 GB RAM) is plenty. |
| API                 | Single container                        | **2–3 stateless replicas** behind a load balancer, for zero-downtime deploys and fault tolerance rather than throughput. Autoscale on CPU / p95 latency. |
| Migrations          | Run on every API startup                | Run as a **separate release step** (CI/CD job or Kubernetes init job) before new pods roll out. `node-pg-migrate`'s advisory lock already makes concurrent startup safe, but a separate step makes failures visible and keeps startup fast. |
| Secrets             | `.env` file                             | Secrets manager (AWS Secrets Manager / Vault). No default `root/root` credentials. |
| Security            | Open API                                | **Authentication + roles**: HQ (catalog, reports) vs. outlet staff (sales for their own outlet only). TLS at the load balancer. Rate limiting per client. |
| Observability       | pino logs to stdout                     | Central logs (Loki / ELK / CloudWatch). Metrics (Prometheus / Grafana): request rate, p95 latency, error rate, DB pool usage, **409 rate on sales** (a stock-contention signal). Alerts on `/health`. Optional tracing with OpenTelemetry. |
| Backups / DR        | None                                    | Daily snapshots + WAL archiving (PITR). Regular restore tests. RPO ≤ 5 min, RTO ≤ 1 hour. |
| Environments        | Local only                              | CI pipeline (lint, tests, build image), then staging, then production. |

### 5.5 Architectural evolution

The current layered monolith (router → service → repository) is the right architecture for this target. Splitting it into microservices would add network hops and distributed transactions to what is currently a single ACID transaction (stock + sale + receipt). The evolution is incremental:

**Phase 1: reach the 10-outlet target (the changes above)**
- Composite `created_at` indexes, receipt counter table, idempotency keys, `TIMESTAMPTZ`.
- Daily rollup tables updated in the sale transaction; reports read from them.
- Managed Postgres with backups, 2+ API replicas, authentication/roles, monitoring.

**Phase 2: resilient outlets and decoupled side effects**
- **Offline-tolerant POS.** An outlet must keep selling when its internet drops. The POS client queues sales locally with a client-generated idempotency key and syncs when it reconnects. The server-side idempotency from 5.2c makes replays safe. Stock conflicts found during sync are flagged for review rather than rejected silently.
- **Transactional outbox.** The sale transaction also writes a `sale.created` row to an `outbox` table. A worker publishes these events to a queue (SQS / RabbitMQ) for side effects that must not slow down or fail a sale: low-stock alerts to HQ, accounting/ERP export, receipts by SMS/email, and eventually rollup maintenance.
- **Modular monolith.** Keep one deployable, but enforce module boundaries (catalog, outlets, sales, inventory, reporting) so any of them could be extracted later.

**Phase 3: well beyond the target (e.g. 100+ outlets, millions of sales per month)**
- Monthly partitioning of `sales` / `sale_items`, with old partitions archived to cheap storage.
- Change data capture (Debezium / logical replication) into an analytics store (ClickHouse, BigQuery) for BI dashboards and ad-hoc analysis. The OLTP database then serves only operational reads.
- Extract **reporting** as its own service fed by events. It has different scaling and freshness needs from the sale path, so it's the first natural candidate for extraction.
- Only if write throughput is ever genuinely exhausted: partition by outlet (e.g. Citus). Sales are naturally outlet-local, and cross-outlet queries go to the analytics store.

**What stays the same at every phase:** the sale is one ACID transaction; money is `NUMERIC` in the database and integer cents in code; prices are snapshotted on `sale_items`; and integrity rules (`CHECK`, `UNIQUE`, `RESTRICT`) are enforced by the database, not only by the application.

---

## 6. Conversion to Microservices

Section 5.5 argues that a monolith is right for the current target. This section describes what the system would look like *if* it grows to the point where separate services pay off: many more outlets, several teams working on it, or parts of the system that need to scale or deploy independently.

### 6.1 Guiding rule: split along data ownership, not along layers

A service is worth extracting when it **owns its own data** and can do its job without a synchronous call to another service in the middle of a transaction. Splitting by layer (a "repository service", a "validation service") or by table would only turn in-process calls into network calls.

The code already has natural seams: each domain has its own router → service → repository chain (`outlet`, `menuItem`, `sale`, `report`). The first step is to make those boundaries strict inside the monolith (the "modular monolith" of Phase 2): no module reads another module's tables directly. Once that holds, extracting a module is mostly a deployment change.

### 6.2 Proposed services

```
                    ┌──────────────────────────┐
  POS / KDS / HQ ──▶│ API Gateway (auth, TLS,  │
                    │ rate limiting, routing)  │
                    └──┬──────┬──────┬──────┬──┘
                       │      │      │      │
          ┌────────────┘      │      │      └─────────────┐
          ▼                   ▼      ▼                    ▼
   ┌─────────────┐   ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
   │  Identity   │   │  Catalog    │ │ Sales &      │ │  Reporting   │
   │  & Access   │   │  (menu +    │ │ Inventory    │ │  (read-only) │
   │             │   │  outlets +  │ │ (orders,     │ │              │
   │             │   │  pricing)   │ │ stock,       │ │              │
   └─────────────┘   └──────┬──────┘ │ receipts)    │ └──────▲───────┘
                            │        └──────┬───────┘        │
                            │ events        │ events         │ events
                            ▼               ▼                │
                    ┌──────────────────────────────────────────────┐
                    │  Message broker (Kafka / RabbitMQ / SQS)    │
                    └──────┬─────────────────┬──────────────┬─────┘
                           ▼                 ▼              ▼
                    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
                    │  Kitchen    │  │ Notification │  │ Outlet Sync  │
                    │  (KDS)      │  │ (SMS/email,  │  │ (offline POS │
                    │             │  │  alerts)     │  │  gateway)    │
                    └─────────────┘  └──────────────┘  └──────────────┘
```

| Service | Owns (tables) | Why separate it |
| ------- | ------------- | --------------- |
| **Catalog** | `menu_items`, `outlets`, `outlet_menu_items` pricing and assignment | Changed only by HQ, rarely, and read constantly. It can be cached aggressively and scaled for reads. Its release cycle (new menus, price changes) has nothing to do with the sale path. |
| **Sales & Inventory** | `sales`, `sale_items`, stock levels, receipt counters | This is the critical write path. Stock check, stock decrement, receipt number and sale insert **must stay in one ACID transaction** (see 4, "Sale flow"). Splitting sales from inventory would replace one transaction with a saga and create windows where stock and sales disagree, so they stay together. |
| **Reporting** | Rollup tables / analytics store (its own copy of the data) | Read-heavy, used by HQ, tolerant of a few seconds of lag, with very different query patterns (large scans, aggregations). It is fed by `sale.created` events and never touches the sales database, so a heavy report can never slow down a till. This is the **first** service to extract. |
| **Kitchen (KDS)** | Kitchen tickets and their status (`NEW → IN_PROGRESS → READY → SERVED`) | Has real-time needs (WebSockets) and different load (open connections, not transactions). A KDS problem must never block taking payment. |
| **Notification** | Delivery logs | Talks to slow, unreliable third parties (SMS, email). Must be asynchronous and retryable, and must never be part of a sale's transaction. |
| **Identity & Access** | Users, roles, outlet membership | Auth is cross-cutting. HQ staff vs. outlet staff scoping is needed by every service, so it's issued once as a JWT and verified locally by each service. |
| **Outlet Sync** | Per-outlet sync cursors, ingestion log | Receives batched offline sales from outlets (see section 7) and replays them into Sales & Inventory idempotently. It absorbs bursty reconnect traffic so the live sale path doesn't have to. |

### 6.3 How the services communicate

- **Synchronous (REST/gRPC) only for commands that need an immediate answer**, such as a POS submitting a sale to Sales & Inventory. Catalog data needed during a sale (price, assignment) is **copied into Sales & Inventory** through events, so the sale transaction never calls Catalog over the network.
- **Asynchronous events for everything else.** Sales & Inventory writes `sale.created`, `stock.low`, etc. to an **outbox table in the same transaction** as the sale, and a relay publishes them to the broker. This guarantees an event is published if and only if the sale committed. Catalog publishes `menu_item.updated`, `outlet_menu_item.assigned`, `price.changed`.
- **Consumers are idempotent.** Every event carries a unique ID and consumers record which IDs they've processed, because brokers deliver at least once.
- **Each service has its own database** (or at least its own schema with its own credentials). Cross-service joins are replaced by local read models built from events. The existing `revenue-by-outlet` join of `outlets` with `sales`, for example, becomes a query against Reporting's own copy of both.

### 6.4 Migration path (strangler pattern)

1. **Enforce module boundaries in the monolith.** Add the outbox table and a broker. No behaviour change.
2. **Extract Reporting.** It consumes `sale.created` and builds its own rollups. The gateway routes `/report/*` to it. Lowest risk, because it's read-only.
3. **Extract Notification and Kitchen (KDS)** as pure event consumers.
4. **Extract Catalog.** Sales & Inventory switches from reading catalog tables to its own event-fed copy of prices and assignments.
5. **Extract Identity** once there are several consumers of auth.
6. Sales & Inventory is what remains of the original monolith. It is the last thing that would ever be split further, and probably never needs to be.

### 6.5 Costs to accept

Microservices bring distributed tracing (OpenTelemetry), contract testing between services, one pipeline per service, eventual consistency in reports, and more infrastructure (broker, gateway, several databases). These costs are why the split is tied to real triggers (team size, independent scaling needs, outlet count) rather than done up front.

---

## 7. Offline POS Mode Strategy

A restaurant can't stop selling because the internet is down. The design goal: **an outlet with no internet connection can still take orders, send them to the kitchen, take payment, and print receipts. When the connection comes back, everything syncs to HQ automatically, exactly once, with nothing lost.**

### 7.1 Outlet topology: a local hub on the LAN

Each outlet runs a small **Outlet Hub**: a mini-PC or a designated POS machine, on a UPS, on the outlet's local network. POS terminals and KDS screens talk to the hub, **not directly to the cloud**.

```
                         Internet (may be down)
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │  HQ API / Outlet Sync  │
                     └────────────▲───────────┘
                                  │ sync when online
  ┌─────────────────── Outlet LAN │ (always up) ─────────────────┐
  │                   ┌───────────┴───────────┐                  │
  │                   │     Outlet Hub        │                  │
  │                   │ local DB (SQLite/PG)  │                  │
  │                   │ outbox · menu cache   │                  │
  │                   │ message broker (WS)   │                  │
  │                   └──┬─────────────────┬──┘                  │
  │          WebSocket   │                 │  WebSocket          │
  │        ┌─────────────┴──┐           ┌──┴─────────────┐       │
  │        │ POS terminals  │           │  KDS screens   │       │
  │        │ (local queue)  │           │ (local store)  │       │
  │        └────────────────┘           └────────────────┘       │
  └──────────────────────────────────────────────────────────────┘
```

This makes offline mode the **normal** code path, not an emergency branch: the POS always writes to the hub, and the hub always syncs to HQ in the background. Losing the internet only means the background sync pauses.

### 7.2 What the hub keeps locally

| Data | Source | Purpose offline |
| ---- | ------ | --------------- |
| Menu items, outlet assignments, prices, `is_available` | Pulled from HQ (Catalog) | The POS can build orders and compute totals with correct prices. |
| Stock levels (`available_unit`) | Pulled from HQ, then decremented locally for every sale | Prevents selling what the outlet clearly doesn't have. |
| Receipt counter | Owned by the hub | Issues gap-free, unique receipt numbers without asking HQ. |
| Sales + sale items | Created locally | The record of truth until HQ confirms it. |
| Outbox (`sync_queue`) | Written in the same local transaction as each sale | The list of what still has to be sent to HQ. |
| Kitchen tickets | Created from each order | Drives the KDS. |

### 7.3 Making sales safe to replay

The current API assigns IDs and receipt numbers on the server, which doesn't work offline. Changes needed:

- **Client-generated identity.** Every sale gets a **UUID (v7, time-ordered)** when it is created at the POS. It is stored as `sales.client_reference UUID UNIQUE` (the idempotency key from 5.2c). HQ uses it to detect duplicates, so resending a sale is always safe.
- **Receipt numbers issued by the outlet.** The hub owns the per-outlet receipt counter, so HQ **accepts** the outlet's `receipt_number` instead of generating one. The existing `UNIQUE (outlet_id, receipt_number)` constraint still holds. If the hub itself is down and a terminal must work alone (7.5), it uses a terminal-prefixed series (e.g. `T2-000145`) so two terminals can never collide.
- **Keep both timestamps.** `occurred_at` (device time when the sale happened; this is what reports use) and `synced_at` (when HQ received it). The hub syncs its clock via NTP whenever it's online, and HQ logs large clock drift.
- **Record provenance.** Add `terminal_id`, `source` (`online` / `offline_sync`) and `price_snapshot` (the price the outlet actually charged) to the sale.

### 7.4 Syncing sales to HQ when the internet reconnects

**Push (outlet → HQ): transactional outbox + ordered, idempotent batches**

1. Every local sale is written, in one local transaction, to `sales`, `sale_items`, the stock decrement and a `sync_queue` row with a monotonically increasing `seq`.
2. A sync worker on the hub continuously checks connectivity (a heartbeat to HQ `/health`). When online, it sends the oldest unsent entries in **batches** (e.g. 100 sales) to a new endpoint:
   ```
   POST /sync/outlets/:outletId/sales
   { "batch": [ { "clientReference": "…uuid…", "receiptNumber": 1043,
                  "occurredAt": "…", "terminalId": "T2",
                  "items": [ { "menuItemId": 7, "quantity": 2, "unitPrice": "250.00" } ] }, … ] }
   ```
3. HQ processes each sale in its own transaction, using `INSERT … ON CONFLICT (client_reference) DO NOTHING`. It returns a per-sale result (`created`, `duplicate`, `accepted_with_conflict`) and the highest `seq` it has durably stored.
4. The hub marks everything up to that `seq` as synced. If the connection drops mid-batch, the next attempt resends from the last acknowledged `seq`. Duplicates are harmless because of step 3. This gives **exactly-once effect on top of at-least-once delivery**.
5. Retries use **exponential backoff with jitter**, so 10 outlets coming back after a regional outage don't all hit HQ at the same moment.
6. After a successful sync, HQ publishes `sale.created` events as normal (section 6.3), so reports, rollups and notifications catch up automatically.

**Pull (HQ → outlet): catalog changes**

- The hub keeps a `last_catalog_version` cursor and calls `GET /sync/outlets/:outletId/catalog?since=<version>` to get only what changed (new items, price changes, assignment removals, stock top-ups by HQ).
- Push happens **before** pull, so HQ's stock view already includes the offline sales before the outlet receives a fresh stock figure.

**Conflict rules (decided in advance, never left to chance)**

An offline sale **already happened**: the customer paid and ate. HQ must never reject it, only record and flag.

| Conflict | Resolution |
| -------- | ---------- |
| Stock at HQ would go below zero | Accept the sale. Allow stock to go negative or clamp at 0, and create a `stock_discrepancy` record for the outlet manager. For synced sales, the `CHECK (available_unit >= 0)` path is replaced by this reconciliation step. |
| Price changed at HQ while the outlet was offline | Keep the price the outlet actually charged (`price_snapshot`). Revenue must match the cash in the drawer. |
| Item unassigned or marked unavailable while offline | Accept the sale and flag it for review. |
| Same `client_reference` sent twice | Return `duplicate`. No effect. |
| Receipt number already used (should not happen) | Reject that one sale with a clear error. It stays in the hub's queue as a **dead letter** and is shown on an HQ dashboard for manual resolution. It never blocks the rest of the queue. |

**Visibility**

- HQ stores `last_synced_at` and `pending_count` per outlet. Reports show a banner such as *"Outlet Gulshan: data up to 14:32, 37 sales pending sync"*, so HQ doesn't mistake an offline outlet for a slow day.
- The POS shows a clear **online / offline / syncing (n pending)** indicator. Alerts fire if an outlet has been offline or has unsynced sales for more than a set time (e.g. 30 minutes).

### 7.5 Keeping POS and KDS working together offline

The POS and KDS communicate **over the outlet LAN through the hub**, so an internet outage doesn't affect them at all.

**Normal offline operation (internet down, LAN up)**

1. The cashier submits an order. The POS sends it to the hub over a WebSocket.
2. The hub stores the order and its kitchen ticket in its local DB, **then** acknowledges the POS and pushes a `ticket.created` message to every KDS subscribed to that station (grill, drinks, …).
3. The KDS stores the ticket locally and replies `ticket.ack`. Until the hub receives that ack, it resends the ticket, so nothing is lost if a KDS screen reboots.
4. Kitchen staff bump the ticket (`IN_PROGRESS → READY`). The KDS sends each status change to the hub, which forwards it to the POS (e.g. "Order 1043 ready").
5. Each message carries `ticketId + version`, so replays and out-of-order delivery are harmless: a device ignores any update older than the version it already has.
6. When any device reconnects (after a reboot or a Wi-Fi drop), it asks the hub for **all open tickets and orders** and rebuilds its state. It does not rely on remembering what it missed.

**Resilience inside the outlet (the hub or the LAN fails)**

| Failure | Behaviour |
| ------- | --------- |
| Internet down | No visible effect on POS/KDS. Only HQ sync pauses. |
| One POS terminal fails | Other terminals keep working. All state is on the hub. |
| KDS screen reboots | Re-subscribes and pulls open tickets from the hub. |
| Hub fails | POS terminals keep a local queue (IndexedDB/SQLite) and **fall back to talking to the KDS directly**. KDS devices announce themselves on the LAN (mDNS) and accept tickets peer-to-peer. When the hub returns, the POS pushes its queued sales to the hub, and the hub syncs them to HQ as usual. A second machine can act as a warm standby hub. |
| Everything on the LAN fails | Last resort: the POS prints kitchen tickets on a **kitchen printer**, the traditional fallback every restaurant already understands. |

**Physical setup:** the hub, network switch and Wi-Fi access point are on a UPS. KDS screens are wired over Ethernet where possible. The POS, KDS and hub software are delivered as an installable/PWA app with all assets cached, so no screen needs the internet to start up.

### 7.6 Summary

- **The outlet is self-sufficient:** local hub, local menu and stock copy, local receipt numbering, POS ↔ KDS over the LAN.
- **The sync is safe:** a transactional outbox, client-generated UUIDs, idempotent batch ingestion at HQ, acknowledgement by sequence number, retries with backoff.
- **Conflicts have rules decided in advance:** an offline sale is a fact to reconcile, never a request to reject.
- **Everyone can see the state:** the POS shows its sync status, HQ shows per-outlet freshness, and alerts fire on long outages.

---

## License

See [LICENSE](LICENSE).
