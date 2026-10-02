# SoleX Sprint 2

This repository contains the Sprint 2 catalog foundation for the SoleX e-commerce platform.

## Included work

- PostgreSQL migration scripts for categories, products, variants, SKUs, and asset metadata.
- Seed data for a sample product catalog.
- Admin-only catalog API skeleton with JWT authentication.
- Validation and tests covering category constraints, product publishing requirements, variant uniqueness, and SKU rules.

## Quick start

1. Copy `.env.example` to `.env` and set your local values.
2. Install dependencies: `npm install`
3. Start the API: `npm start`
4. Run tests: `npm test`

## Admin login

Use the seeded admin demo user through the login endpoint:

- Email: `admin@solex.test`
- Password: `admin123`

The API issues a JWT with an `admin` role and protects the catalog routes.
