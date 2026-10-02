const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { CatalogService } = require('../src/services/catalogService');
const { createAdminToken, requireAdmin } = require('../src/lib/auth');

// =====================================================
// CATEGORY TESTS
// =====================================================

test('category updates reject self-parent references and cycles', () => {
  const service = new CatalogService();
  const root = service.addCategory({ name: 'Footwear', slug: 'footwear' });
  const child = service.addCategory({ name: 'Running', slug: 'running', parentId: root.id });
  const grandchild = service.addCategory({ name: 'Trail', slug: 'trail', parentId: child.id });

  assert.throws(
    () => service.updateCategory(root.id, { parentId: root.id }),
    /cannot be its own parent/i
  );
  assert.throws(
    () => service.updateCategory(root.id, { parentId: grandchild.id }),
    /cannot contain cycles/i
  );

  assert.equal(root.slug, 'footwear');
  assert.equal(child.parentId, root.id);
});

// =====================================================
// PRODUCT TESTS
// =====================================================

test('products cannot be published without active stock', () => {
  const service = new CatalogService();
  const category = service.addCategory({ name: 'Footwear', slug: 'footwear' });
  const product = service.addProduct({
    categoryId: category.id,
    name: 'Air Runner',
    slug: 'air-runner',
    status: 'draft',
  });

  const variant = service.addVariant({ productId: product.id, size: '40', color: 'Black' });

  assert.throws(
    () => service.updateProduct(product.id, { status: 'published' }),
    /Published products require at least one active SKU with stock/
  );

  const sku = service.addSku({
    variantId: variant.id,
    skuCode: 'AIR-RUNNER-40-BLK',
    price: 129.99,
    stockQuantity: 10,
    active: true,
  });

  const published = service.updateProduct(product.id, { status: 'published' });

  assert.equal(sku.available, true);
  assert.equal(published.status, 'published');
});

// =====================================================
// VARIANT TESTS
// =====================================================

test('variant size and color combinations are unique per product', () => {
  const service = new CatalogService();
  const category = service.addCategory({ name: 'Casual', slug: 'casual' });
  const product = service.addProduct({
    categoryId: category.id,
    name: 'City Step',
    slug: 'city-step',
  });

  service.addVariant({ productId: product.id, size: '39', color: 'White' });

  assert.throws(
    () => service.addVariant({ productId: product.id, size: '39', color: 'White' }),
    /already exists/
  );
});

// =====================================================
// SKU TESTS
// =====================================================

test('SKU rules reject negative pricing and invalid stock', () => {
  const service = new CatalogService();
  const category = service.addCategory({ name: 'Running', slug: 'running' });
  const product = service.addProduct({
    categoryId: category.id,
    name: 'Tempo',
    slug: 'tempo',
  });
  const variant = service.addVariant({ productId: product.id, size: '41', color: 'Blue' });

  assert.throws(
    () => service.addSku({
      variantId: variant.id,
      skuCode: 'TEMP-41-BLU',
      price: -5,
      stockQuantity: 3,
    }),
    /cannot be negative/
  );

  assert.throws(
    () => service.addSku({
      variantId: variant.id,
      skuCode: 'TEMP-41-BLU-2',
      price: 120,
      stockQuantity: -2,
    }),
    /non-negative/
  );
});

test('duplicate SKU codes are rejected', () => {
  const service = new CatalogService();
  const category = service.addCategory({ name: 'Running', slug: 'running' });
  const product = service.addProduct({
    categoryId: category.id,
    name: 'Trail',
    slug: 'trail',
  });
  const variant = service.addVariant({ productId: product.id, size: '42', color: 'Green' });

  service.addSku({
    variantId: variant.id,
    skuCode: 'DUP-CODE-001',
    price: 100,
    stockQuantity: 5,
  });

  assert.throws(
    () => service.addSku({
      variantId: variant.id,
      skuCode: 'DUP-CODE-001',
      price: 100,
      stockQuantity: 5,
    }),
    /globally unique/
  );
});

test('unavailable SKU has available=false and zero stock', () => {
  const service = new CatalogService();
  const category = service.addCategory({ name: 'Running', slug: 'running' });
  const product = service.addProduct({
    categoryId: category.id,
    name: 'Blazer',
    slug: 'blazer',
  });
  const variant = service.addVariant({ productId: product.id, size: '43', color: 'Black' });

  const sku = service.addSku({
    variantId: variant.id,
    skuCode: 'UNAVAIL-43-BLK',
    price: 150,
    stockQuantity: 0,
    active: true,
  });

  assert.equal(sku.available, false);
  assert.equal(sku.stockQuantity, 0);
});

// =====================================================
// AUTH TESTS
// =====================================================

test('admin JWT is generated and validated', () => {
  const token = createAdminToken({ id: 9, email: 'admin@solex.test', role: 'admin' });
  const payload = jwt.verify(token, 'development-secret-change-me');

  assert.equal(payload.role, 'admin');
  assert.equal(payload.email, 'admin@solex.test');

  const req = { headers: { authorization: `Bearer ${token}` } };
  let nextCalled = false;

  const res = {
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('requireAdmin rejects unauthenticated requests with 401', () => {
  const req = { headers: {} };
  let statusCode;

  const res = {
    status(code) { statusCode = code; return this; },
    json() { return this; },
  };

  requireAdmin(req, res, () => {
    throw new Error('next() should not have been called');
  });

  assert.equal(statusCode, 401);
});

test('requireAdmin rejects non-admin tokens with 403', () => {
  const customerToken = jwt.sign(
    { sub: 5, email: 'customer@test', role: 'customer' },
    'development-secret-change-me',
    { expiresIn: '8h' }
  );

  const req = { headers: { authorization: `Bearer ${customerToken}` } };
  let statusCode;

  const res = {
    status(code) { statusCode = code; return this; },
    json() { return this; },
  };

  requireAdmin(req, res, () => {
    throw new Error('next() should not have been called');
  });

  assert.equal(statusCode, 403);
});