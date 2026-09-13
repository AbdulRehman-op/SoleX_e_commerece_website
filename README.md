# SoleX Shoes 

SoleX is a planned full-stack footwear e-commerce application for an E-Commerce
course. The repository currently contains the Sprint 1 architecture
documentation and an empty frontend/backend/database scaffold. Application
features have not been implemented yet.

## Project Overview

SoleX is intended to provide an online shoe store where customers can discover
products, select purchasable shoe variants, manage a cart, and place orders.
Administrators are expected to manage products, variants, categories, and
inventory through protected backend APIs.

The current repository is an architecture and project-setup baseline. The
implementation described below is separated into **Implemented**, **In
Progress**, and **Planned** so that the README reflects the actual state of
the repository.

## Key Features

### Implemented

- Sprint 1 architecture documentation.
- Mermaid relational ERD in [`SPRINT_1.md`](SPRINT_1.md).
- Initial frontend, backend, database, and documentation folder scaffold.
- Repository-level `.gitignore` rules for dependencies, build output, logs,
  coverage, and environment files.

### In Progress

- Project setup and architecture definition.
- Preparing the React/Vite frontend, Express backend, and PostgreSQL database
  for implementation.

### Planned

- Customer registration and login.
- JWT authentication with bcrypt password hashing.
- Role-based admin authorization.
- Product catalog, search, and category filtering.
- Purchasable product SKU/size/color variants.
- One active cart per customer.
- Checkout and order processing.
- Historical order price and delivery-address snapshots.
- Admin product, variant, category, and inventory management.

There are currently no application screens, API endpoints, database tables,
authentication flows, or automated tests in the repository.

## Architecture

The approved target architecture keeps the frontend and backend separate. It
is a planned design; the corresponding runtime code has not yet been created.

```text
React + Vite frontend
        |
        | HTTP/JSON REST API
        v
Node.js + Express backend
        |
        | PostgreSQL client and transactions
        v
PostgreSQL database
```

- **Frontend:** React with Vite will provide the customer and admin user
  interfaces.
- **Backend:** Node.js and Express will provide the REST API, validation,
  business rules, authentication, and authorization.
- **Database:** PostgreSQL will store relational users, products, variants,
  categories, carts, orders, and related records.
- **Authentication:** JWT is planned for authenticated requests, with bcrypt
  planned for password hashing.
- **Authorization:** Backend middleware will independently protect admin APIs;
  frontend visibility alone will not be treated as authorization.

## Technology Stack

No dependency manifests or lockfiles currently exist, so package versions
cannot be verified from the repository.

| Area | Approved technology | Current repository status |
|---|---|---|
| Frontend | React.js with Vite | Planned; no frontend package files yet |
| Language | JavaScript | Planned; no JavaScript source files yet |
| Markup and styling | HTML5, CSS3, Tailwind CSS | Planned; not configured yet |
| Backend | Node.js with Express.js | Planned; no backend package files yet |
| API | REST with JSON | Planned; no routes yet |
| Database | PostgreSQL | Planned; no schema or migrations yet |
| Authentication | JWT | Planned; not implemented yet |
| Password hashing | bcrypt | Planned; not implemented yet |
| Development | Visual Studio Code, Git, GitHub | Repository uses Git; no additional tooling configuration is present |

## Product & SKU Architecture

Product and SKU behavior is currently a planned design, not an implemented
feature.

The approved direction distinguishes a product's general information from
its purchasable variants. A SKU/variant represents a specific combination such
as size and color and should be the inventory and cart line-item unit. This
allows stock and purchase availability to be tracked for each purchasable
combination rather than only for a broad product style.

The repository currently contains no product model, schema, seed data, or
product API with which to verify this behavior.

## Cart

The approved design calls for one active cart per authenticated customer.
Cart items will reference purchasable SKU/variant records and store a
positive quantity.

This is planned only. No cart tables, models, routes, or frontend cart
components have been implemented.

## Orders

The approved order design calls for:

- Order items to store a historical unit-price snapshot.
- Orders to store a delivery-address snapshot.
- Checkout to validate inventory and create order data transactionally.

This preserves order history when a product price, inventory record, or
customer address later changes. No order schema, transaction code, routes, or
checkout UI exists yet.

## Authentication & Authorization

JWT authentication and bcrypt password hashing are approved for the target
implementation. Backend authorization is also required to protect admin APIs
independently from the frontend interface.

These controls are **planned**, not currently implemented. There is no
authentication middleware, password-hashing code, JWT configuration, user
model, or API route in the repository.

## User Roles

The target design includes at least:

| Role | Intended responsibility | Repository status |
|---|---|---|
| `customer` | Browse products, manage a cart, and create/view personal orders | Planned |
| `admin` | Manage products, variants, categories, and inventory through protected APIs | Planned |

No role enum, database constraint, seed record, or authorization middleware
currently exists.

## Project Structure

This is the actual tracked project scaffold. Most directories contain only a
`.gitkeep` placeholder.

```text
SoleX/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── tests/
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
│   ├── api/
│   ├── architecture/
│   └── diagrams/
├── frontend/
│   ├── public/
│   │   └── images/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── admin/
│       │   ├── cart/
│       │   ├── common/
│       │   └── products/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       │   └── admin/
│       ├── routes/
│       ├── services/
│       └── utils/
├── .gitignore
├── README.md
└── SPRINT_1.md
```

## Prerequisites

The following tools are expected for the planned implementation:

- Git
- Node.js and npm
- PostgreSQL
- Visual Studio Code or another JavaScript-capable editor

Exact Node.js, npm, and PostgreSQL versions are not specified in the current
repository because no package manifest, runtime configuration, or tool-version
file exists.

## Installation

The repository is not installable as an application yet. There are no
`package.json` files, lockfiles, build scripts, or dependency manifests.

After the frontend and backend manifests are added, installation instructions
should be updated with the verified commands for each workspace. Do not run
`npm install` from this repository based on the current contents because no
project dependencies have been declared.

## Environment Variables

No `.env.example` file currently exists, and no runtime environment variables
are referenced by source code.

The eventual implementation is expected to require environment variables for
values such as:

- PostgreSQL connection settings.
- JWT signing secret and token configuration.
- Backend and frontend runtime URLs where needed.

Variable names and required values must be documented only after they are
defined in the implementation. Real secrets, passwords, API keys, and
database credentials must never be committed. The current
[`.gitignore`](.gitignore) excludes `.env` and `.env.*` while allowing a
future `.env.example`.

## Database Setup

PostgreSQL is the approved database, but database setup is not available yet:

- `database/migrations/` contains no migration files.
- `database/seeds/` contains no seed files.
- No schema, connection configuration, or database initialization script
  exists.

The future database should use migrations for relational tables, primary keys,
foreign keys, uniqueness constraints, and transactional order creation.

## Running the Project

There are currently no verified run commands. No `package.json`, scripts,
frontend entry point, backend entry point, or database command exists.

The following commands are therefore intentionally **not** provided as
executable instructions:

- Frontend start/build commands.
- Backend start/dev commands.
- Database migration or seed commands.

This section must be updated when those commands are added to the repository.

## API

No REST API routes currently exist. The backend route directory contains only
a `.gitkeep` placeholder, so no endpoint list can be documented without
inventing functionality.

The approved API direction is a versioned REST API, but its path prefix,
resources, request formats, response formats, and authentication behavior
remain to be implemented and verified.

## Development Workflow

Development is organized around the sprint-based course workflow:

1. Complete and review the Sprint 1 architecture.
2. Initialize frontend and backend dependency manifests.
3. Add PostgreSQL migrations and seed data.
4. Implement authentication and authorization.
5. Implement catalog and SKU/variant management.
6. Implement the cart and transactional checkout flow.
7. Add admin inventory management.
8. Add focused tests and update documentation from the actual code.

[`SPRINT_1.md`](SPRINT_1.md) is the architecture and assignment reference. It
does not represent implemented application functionality.

## Testing

Automated tests are not implemented. `backend/tests/` exists as an empty
scaffold directory containing `.gitkeep`, but there is no test runner,
test configuration, or test file.

## Security

The following security items are currently present or documented:

- [`.gitignore`](.gitignore) excludes `.env` and `.env.*` files.
- Sprint 1 documentation prohibits committing credentials and secrets.
- The approved design requires bcrypt for password hashing.
- The approved design requires JWT authentication.
- The approved design requires backend role-based authorization.

Only the `.gitignore` protection is currently present in repository
configuration. JWT, bcrypt, authorization middleware, input validation, and
database access controls have not yet been implemented.

## Project Status

| Area | Status | Notes |
|---|---|---|
| Sprint 1 architecture | Implemented | Documented in [`SPRINT_1.md`](SPRINT_1.md) |
| Repository scaffold | Implemented | Empty frontend, backend, database, and docs directories exist |
| Frontend application | Planned | No source files or package manifest |
| Backend application | Planned | No source files or package manifest |
| PostgreSQL schema | Planned | No migrations or schema files |
| Authentication | Planned | No JWT or bcrypt implementation |
| Admin authorization | Planned | No role middleware or protected routes |
| Cart and checkout | Planned | No models, routes, or UI |
| Automated testing | Planned | No test runner or tests |

## Future Improvements

The following items are future work, subject to implementation and verification:

- Create separate frontend and backend `package.json` files.
- Configure React/Vite and Tailwind CSS.
- Build the Express REST API.
- Add PostgreSQL migrations and development seeds.
- Implement product styles and purchasable SKU/size/color variants.
- Implement JWT authentication, bcrypt hashing, and backend role checks.
- Implement one active cart per customer.
- Implement transactional checkout with price and delivery-address snapshots.
- Add admin product and inventory management.
- Add API and database tests.
- Add setup, API, and deployment documentation based on actual commands.

## Git Workflow

The repository is under Git version control and currently has an initial
commit. No project-specific branch naming or commit-message convention is
defined.

Useful commands:

```bash
git status
git add <files>
git commit -m "Describe the change"
git log --oneline
```

Commit messages should accurately describe the change and must not include
secrets or generated private configuration.

## AI-Assisted Development

No `.github/copilot-instructions.md` or other repository-level AI development
instruction file was found. The project may add one later if consistent
conventions for AI-assisted contributions are needed.

## License

No license has been defined in the repository yet.
