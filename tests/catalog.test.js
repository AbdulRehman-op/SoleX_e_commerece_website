const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Test ke liye ek in-memory version banate hain
// Actual database logic integration tests mein cover hoga (Sprint 3)
const {
  buildSlug,
  isValidStatus,
  validateSku,
  categoryHasCycle,
  ensurePublishedProductHasActiveSku,
} = require('../src/lib/validation');

// Simple in-memory service for unit testing business logic
class InMemoryCatalogService {
  constructor() {
    this.categories = [];
    this.products = [];
    this.variants = [];
    this.skus = [];
    this.nextCategoryId = 1;
    this.nextProductId = 1;
    this.nextVariantId = 1;
    this.nextSkuId = 1;
  }

  addCategory({ name, slug, parentId = null, active = true }) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) throw new Error('Category name is required.');

    const nextSlug = (slug && String(slug).trim()) || buildSlug(normalizedName);
    if (this.categories.some((c) => c.slug === nextSlug)) {
      throw new Error('Category slug must be unique.');
    }

    const category = {
      id: this.nextCategoryId++,
      name: normalizedName,
      slug: nextSlug,
      parentId,
      active,
    };
    this.categories.push(category);
    return category;
  }

  updateCategory(id, updates = {}) {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found.');

    const existing = this.categories[idx];
    const nextParentId = updates.parentId !== undefined ? updates.parentId : existing.parentId;

    if (nextParentId === id) {
      throw new Error('A category cannot be its own parent.');
    }

    if (nextParentId != null && categoryHasCycle(this.categories, id, nextParentId)) {
      throw new Error('Category hierarchy cannot contain cycles.');
    }

    const next = { ...existing, ...updates, id: existing.id };
    this.categories[idx] = next;
    return next;
  }

  addProduct({ categoryId, name, slug, status = 'draft' }) {
    if (!categoryId) throw new Error('Product category is required.');
    if (!isValidStatus(status)) throw new Error('Product status must be one of: draft, published, archived.');

    const normalizedName = String(name || '').trim();
    if (!normalizedName) throw new Error('Product name is required.');

    const nextSlug = (slug && String(slug).trim()) || buildSlug(normalizedName);
    if (this.products.some((p) => p.slug === nextSlug)) {
      throw new Error('Product slug must be unique.');
    }

    const product = {
      id: this.nextProductId++,
      categoryId,
      name: normalizedName,
      slug: nextSlug,
      status,
    };
    this.products.push(product);
    return product;
  }

  updateProduct(id, updates = {}) {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found.');

    const existing = this.products[idx];
    const next = { ...existing, ...updates, id: existing.id };

    if (next.status === 'published') {
      const productSkus = this.skus.filter((sku) =>
        this.variants.some((v) => v.id === sku.variantId && v.productId === next.id)
      );
      ensurePublishedProductHasActiveSku(next.status, productSkus);
    }

    this.products[idx] = next;
    return next;
  }

  addVariant({ productId, size, color }) {
    if (!productId) throw new Error('Variant requires a product id.');
    if (!this.products.some((p) => p.id === productId)) {
      throw new Error('Variant must belong to an existing product.');
    }

    const normalizedSize = String(size || '').trim();
    const normalizedColor = String(color || '').trim();
    if (!normalizedSize || !normalizedColor) {
      throw new Error('Variant size and color are required.');
    }

    if (this.variants.some((v) =>
      v.productId === productId &&
      v.size.toLowerCase() === normalizedSize.toLowerCase() &&
      v.color.toLowerCase() === normalizedColor.toLowerCase()
    )) {
      throw new Error('The same size and color combination already exists for this product.');
    }

    const variant = {
      id: this.nextVariantId++,
      productId,
      size: normalizedSize,
      color: normalizedColor,
    };
    this.variants.push(variant);
    return variant;
  }

  addSku({ variantId, skuCode, price, stockQuantity, active = true }) {
    if (!variantId) throw new Error('SKU requires a variant id.');
    if (!this.variants.some((v) => v.id === variantId)) {
      throw new Error('SKU must reference an existing variant.');
    }

    const nextSkuCode = String(skuCode || '').trim();
    if (!nextSkuCode) throw new Error('SKU code is required.');
    if (this.skus.some((s) => s.skuCode === nextSkuCode)) {
      throw new Error('SKU code must be globally unique.');
    }

    const sanitizedPrice = Number(price);
    const sanitizedStock = Number(stockQuantity);
    const available = active && sanitizedStock > 0;

    validateSku({
      skuCode: nextSkuCode,
      price: sanitizedPrice,
      stockQuantity: sanitizedStock,
      active,
      available,
    });

    const sku = {
      id: this.nextSkuId++,
      variantId,
      skuCode: nextSkuCode,
      price: sanitizedPrice,
      stockQuantity: sanitizedStock,
      active,
      available,
    };
    this.skus.push(sku);
    return sku;
  }
}

// ---------- CATEGORY TESTS ----------

test('category updates reject self-parent references and cycles', () => {
  const service = new InMemoryCatalogService();
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

// ---------- PRODUCT TESTS ----------

test('products cannot be published without active stock', () => {
  const service = new InMemoryCatalogService();
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

// ---------- VARIANT TESTS ----------

test('variant size and color combinations are unique per product', () => {
  const service = new InMemoryCatalogService();
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

// ---------- SKU TESTS ----------

test('SKU rules reject negative pricing and invalid stock', () => {
  const service = new InMemoryCatalogService();
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
  const service = new InMemoryCatalogService();
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
  const service = new InMemoryCatalogService();
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

// ---------- AUTH TESTS ----------

const TEST_JWT_SECRET = 'solex-super-secret-key-change-me-12345';

function createTestToken(payload) {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '8h' });
}

test('admin JWT is generated and validated', () => {
  const token = createTestToken({
    sub: 9,
    email: 'admin@solex.test',
    role: 'admin',
  });

  const payload = jwt.verify(token, TEST_JWT_SECRET);

  assert.equal(payload.role, 'admin');
  assert.equal(payload.email, 'admin@solex.test');

  // Import requireAdmin with mocked config
  const authModule = require('../src/lib/auth');
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  // Note: auth.js reads JWT_SECRET at require time, so this test works
  // when JWT_SECRET env matches TEST_JWT_SECRET
  assert.ok(token);

  process.env.JWT_SECRET = originalSecret;
});

test('requireAdmin rejects unauthenticated requests with 401', () => {
  const { requireAdmin } = require('../src/lib/auth');

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
  const { requireAdmin } = require('../src/lib/auth');

  const customerToken = createTestToken({
    sub: 5,
    email: 'customer@test',
    role: 'customer',
  });

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