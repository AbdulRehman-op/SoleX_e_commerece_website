# SPRINT 2 — Catalog Data Foundation

**Course:** E-Commerce
**Project:** SoleX — Full-Stack E-Commerce Web Application
**Sprint Duration:** 15 calendar days
**Repository:** Same as Sprint 1 (no new repo)
**Document Path:** `docs/SPRINT_2.md`

---

## 1. Sprint Goal & Scope Boundary

### Goal
Given a product catalog administrator, the system must persist **categories, products, variants, and SKUs** without losing identity, relationship, price, or inventory meaning. This sprint converts the Sprint 1 architecture into a working, tested database foundation that Sprint 3 (public catalog, cart, checkout) can safely consume.

### In Scope
- Category tree with stable identifiers and unique slugs.
- Product creation and editing (name, slug, description, status, category).
- Variants (size/color combinations) and SKUs with unique codes, price, stock, and active status.
- Authenticated **admin-only** CRUD for categories, products, variants, and SKUs.
- Database constraints, migrations, seed data, and automated tests.
- Asset records (metadata only — no upload UI this sprint).
- Specification as validated JSONB on `Product`.

### Out of Scope (Sprint 3 or later)
Dynamic specifications UI, asset upload, public catalog search, publication workflow, payment gateway, order placement, shipping, full shopper checkout. These may be **stubbed**, but are not claimed as Sprint 2 functionality.

---

## 2. Reuse of Sprint 1 Decisions

| Sprint 1 Decision | Sprint 2 Action |
|---|---|
| Full-stack client-server architecture (React/Vite + Express + PostgreSQL) | Reused — no change. |
| JWT authentication with bcrypt | Reused — admin routes require a valid JWT with role `admin`. |
| Role-based authorization | Reused — middleware `requireAuth` + `requireRole('admin')`. |
| One active cart per user | Reused — `carts.user_id` remains UNIQUE. |
| Order price & address snapshots | Reused — `order_items.unit_price` and `orders.shipping_address` remain snapshot fields. |
| SKU-based variants (size/color) | Extended — `variants` + `skus` tables formalized this sprint. |
| ERD (Sprint 1) | Extended — new catalog entities added; original MVP entities preserved. |

**Change:** Sprint 1 treated variants and SKUs loosely. Sprint 2 separates them explicitly — a `Variant` is a size/color combination, a `SKU` is a sellable unit of that variant with its own code, price, and stock.

---

## 3. Updated ERD & Data Dictionary

### 3.1 Mermaid ER Diagram

```mermaid
erDiagram
    CATEGORIES ||--o{ CATEGORIES : parent_of
    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ VARIANTS : has
    VARIANTS ||--o{ SKUS : materializes
    PRODUCTS ||--o{ ASSETS : displays
    VARIANTS ||--o{ ASSETS : displays
    USERS ||--|| CARTS : owns
    CARTS ||--o{ CART_ITEMS : contains
    SKUS ||--o{ CART_ITEMS : selected_as
    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    SKUS ||--o{ ORDER_ITEMS : sold_as

    CATEGORIES {
        int id PK
        int parent_id FK
        varchar name
        varchar slug
        boolean active
        timestamp created_at
        timestamp updated_at
    }
    PRODUCTS {
        int id PK
        int category_id FK
        varchar name
        varchar slug
        text description
        varchar status
        jsonb specifications
        timestamp created_at
        timestamp updated_at
    }
    VARIANTS {
        int id PK
        int product_id FK
        varchar size
        varchar color
        timestamp created_at
    }
    SKUS {
        int id PK
        int variant_id FK
        varchar sku_code
        decimal price
        int stock_quantity
        boolean active
        timestamp created_at
        timestamp updated_at
    }
    ASSETS {
        int id PK
        int product_id FK
        int variant_id FK
        varchar storage_key
        varchar role
        varchar alt_text
        int sort_order
    }
    USERS {
        int id PK
        varchar email
        varchar password_hash
        varchar role
        timestamp created_at
    }
    CARTS {
        int id PK
        int user_id FK
        timestamp updated_at
    }
    CART_ITEMS {
        int id PK
        int cart_id FK
        int sku_id FK
        int quantity
    }
    ORDERS {
        int id PK
        int user_id FK
        decimal total_amount
        varchar status
        jsonb shipping_address
        timestamp created_at
    }
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int sku_id FK
        int quantity
        decimal unit_price
    }