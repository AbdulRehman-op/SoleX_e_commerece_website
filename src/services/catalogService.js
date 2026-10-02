const pool = require('../db');
const {
  buildSlug,
  ensurePublishedProductHasActiveSku,
  validateSku,
  isValidStatus,
} = require('../lib/validation');

class CatalogService {
  // ---------- CATEGORIES ----------
  async addCategory({ name, slug, parentId = null, active = true }) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      throw new Error('Category name is required.');
    }

    const nextSlug = (slug && String(slug).trim()) || buildSlug(normalizedName);

    try {
      const result = await pool.query(
        `INSERT INTO categories (name, slug, parent_id, active)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, slug, parent_id, active, created_at, updated_at`,
        [normalizedName, nextSlug, parentId, active]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Category slug must be unique.');
      }
      if (error.message.includes('cycle')) {
        throw new Error('Category hierarchy cannot contain cycles.');
      }
      if (error.message.includes('own parent')) {
        throw new Error('A category cannot be its own parent.');
      }
      throw error;
    }
  }

  async listCategories() {
    const result = await pool.query(
      `SELECT id, name, slug, parent_id, active, created_at, updated_at
       FROM categories
       ORDER BY id ASC`
    );
    return result.rows;
  }

  async updateCategory(id, updates = {}) {
    const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw new Error('Category not found.');
    }

    const current = existing.rows[0];
    const nextName = updates.name !== undefined ? String(updates.name).trim() : current.name;
    const nextSlug = updates.slug !== undefined ? String(updates.slug).trim() : current.slug;
    const nextParentId = updates.parentId !== undefined ? updates.parentId : current.parent_id;
    const nextActive = updates.active !== undefined ? Boolean(updates.active) : current.active;

    try {
      const result = await pool.query(
        `UPDATE categories
         SET name = $1, slug = $2, parent_id = $3, active = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, name, slug, parent_id, active, created_at, updated_at`,
        [nextName, nextSlug, nextParentId, nextActive, id]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Category slug must be unique.');
      }
      if (error.message.includes('cycle')) {
        throw new Error('Category hierarchy cannot contain cycles.');
      }
      if (error.message.includes('own parent')) {
        throw new Error('A category cannot be its own parent.');
      }
      throw error;
    }
  }

  // ---------- PRODUCTS ----------
  async addProduct({ categoryId, name, slug, description = '', status = 'draft', specifications = {} }) {
    if (!categoryId) {
      throw new Error('Product category is required.');
    }
    if (!isValidStatus(status)) {
      throw new Error('Product status must be one of: draft, published, archived.');
    }

    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      throw new Error('Product name is required.');
    }

    const nextSlug = (slug && String(slug).trim()) || buildSlug(normalizedName);

    try {
      const result = await pool.query(
        `INSERT INTO products (category_id, name, slug, description, status, specifications)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, category_id, name, slug, description, status, specifications, created_at, updated_at`,
        [categoryId, normalizedName, nextSlug, description, status, specifications]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Product slug must be unique.');
      }
      if (error.code === '23503') {
        throw new Error('Product category does not exist.');
      }
      throw error;
    }
  }

  async listProducts() {
    const result = await pool.query(
      `SELECT id, category_id, name, slug, description, status, specifications, created_at, updated_at
       FROM products
       ORDER BY id ASC`
    );
    return result.rows;
  }

  async updateProduct(id, updates = {}) {
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw new Error('Product not found.');
    }

    const current = existing.rows[0];
    const nextName = updates.name !== undefined ? String(updates.name).trim() : current.name;
    const nextSlug = updates.slug !== undefined ? String(updates.slug).trim() : current.slug;
    const nextDescription = updates.description !== undefined ? updates.description : current.description;
    const nextStatus = updates.status !== undefined ? String(updates.status).trim() : current.status;
    const nextSpecs = updates.specifications !== undefined ? updates.specifications || {} : current.specifications;

    if (!isValidStatus(nextStatus)) {
      throw new Error('Product status must be one of: draft, published, archived.');
    }

    if (nextStatus === 'published') {
      const skuCheck = await pool.query(
        `SELECT COUNT(*)::int AS active_count
         FROM skus s
         INNER JOIN variants v ON v.id = s.variant_id
         WHERE v.product_id = $1 AND s.active = TRUE AND s.stock_quantity > 0`,
        [id]
      );
      ensurePublishedProductHasActiveSku(nextStatus, [
        { active: skuCheck.rows[0].active_count > 0, stockQuantity: skuCheck.rows[0].active_count },
      ]);
    }

    try {
      const result = await pool.query(
        `UPDATE products
         SET name = $1, slug = $2, description = $3, status = $4, specifications = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING id, category_id, name, slug, description, status, specifications, created_at, updated_at`,
        [nextName, nextSlug, nextDescription, nextStatus, nextSpecs, id]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Product slug must be unique.');
      }
      throw error;
    }
  }

  // ---------- VARIANTS ----------
  async addVariant({ productId, size, color }) {
    if (!productId) {
      throw new Error('Variant requires a product id.');
    }

    const normalizedSize = String(size || '').trim();
    const normalizedColor = String(color || '').trim();
    if (!normalizedSize || !normalizedColor) {
      throw new Error('Variant size and color are required.');
    }

    try {
      const result = await pool.query(
        `INSERT INTO variants (product_id, size, color)
         VALUES ($1, $2, $3)
         RETURNING id, product_id, size, color, created_at`,
        [productId, normalizedSize, normalizedColor]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('The same size and color combination already exists for this product.');
      }
      if (error.code === '23503') {
        throw new Error('Variant must belong to an existing product.');
      }
      throw error;
    }
  }

  async listVariants() {
    const result = await pool.query(
      `SELECT id, product_id, size, color, created_at
       FROM variants
       ORDER BY id ASC`
    );
    return result.rows;
  }

  // ---------- SKUS ----------
  async addSku({ variantId, skuCode, price, stockQuantity, active = true }) {
    if (!variantId) {
      throw new Error('SKU requires a variant id.');
    }

    const nextSkuCode = String(skuCode || '').trim();
    if (!nextSkuCode) {
      throw new Error('SKU code is required.');
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

    try {
      const result = await pool.query(
        `INSERT INTO skus (variant_id, sku_code, price, stock_quantity, active, available)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, variant_id, sku_code, price, stock_quantity, active, available, created_at, updated_at`,
        [variantId, nextSkuCode, sanitizedPrice, sanitizedStock, active, available]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('SKU code must be globally unique.');
      }
      if (error.code === '23503') {
        throw new Error('SKU must reference an existing variant.');
      }
      if (error.code === '23514') {
        throw new Error('SKU stock or availability constraint violated.');
      }
      throw error;
    }
  }

  async listSkus() {
    const result = await pool.query(
      `SELECT id, variant_id, sku_code, price, stock_quantity, active, available, created_at, updated_at
       FROM skus
       ORDER BY id ASC`
    );
    return result.rows;
  }

  async updateSku(id, updates = {}) {
    const existing = await pool.query('SELECT * FROM skus WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw new Error('SKU not found.');
    }

    const current = existing.rows[0];
    const nextPrice = updates.price !== undefined ? Number(updates.price) : Number(current.price);
    const nextStock = updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : current.stock_quantity;
    const nextActive = updates.active !== undefined ? Boolean(updates.active) : current.active;

    if (nextPrice < 0) {
      throw new Error('SKU price cannot be negative.');
    }
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      throw new Error('SKU stock must be a non-negative integer.');
    }

    try {
      const result = await pool.query(
        `UPDATE skus
         SET price = $1, stock_quantity = $2, active = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, variant_id, sku_code, price, stock_quantity, active, available, created_at, updated_at`,
        [nextPrice, nextStock, nextActive, id]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23514') {
        throw new Error('SKU stock or availability constraint violated.');
      }
      throw error;
    }
  }
}

module.exports = {
  CatalogService,
  catalogService: new CatalogService(),
};