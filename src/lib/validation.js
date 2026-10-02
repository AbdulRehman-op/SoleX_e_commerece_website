const allowedStatuses = new Set(['draft', 'published', 'archived']);

function buildSlug(value) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200) || 'item'
  );
}

function isValidStatus(status) {
  return allowedStatuses.has(status);
}

function variantKey(size, color) {
  return `${String(size).trim().toLowerCase()}::${String(color).trim().toLowerCase()}`;
}

// =====================================================
// CATEGORY CYCLE PREVENTION
// =====================================================

function categoryHasCycle(categories, currentId, candidateParentId) {
  if (candidateParentId == null || currentId == null) {
    return false;
  }

  const visited = new Set();
  let parentId = candidateParentId;

  while (parentId != null) {
    // Self-loop
    if (parentId === currentId) {
      return true;
    }

    // Already visited → cycle
    if (visited.has(parentId)) {
      return true;
    }
    visited.add(parentId);

    const parent = categories.find((category) => category.id === parentId);
    if (!parent) {
      return false;
    }

    parentId = parent.parentId ?? null;
  }

  return false;
}

function validateCategoryState(category, categories) {
  if (!category.name || !category.name.trim()) {
    throw new Error('Category name is required.');
  }

  if (category.parentId != null && category.parentId === category.id) {
    throw new Error('A category cannot be its own parent.');
  }

  if (
    category.parentId != null &&
    categoryHasCycle(categories, category.id, category.parentId)
  ) {
    throw new Error('Category hierarchy cannot contain cycles.');
  }
}

// =====================================================
// PRODUCT / SKU VALIDATION
// =====================================================

function ensurePublishedProductHasActiveSku(productStatus, skus) {
  if (productStatus !== 'published') {
    return;
  }

  const hasActiveSku = skus.some(
    (sku) => sku.active === true && Number(sku.stockQuantity) > 0
  );

  if (!hasActiveSku) {
    throw new Error('Published products require at least one active SKU with stock.');
  }
}

function validateSku({ skuCode, price, stockQuantity, active = true, available = true }) {
  if (!skuCode || !String(skuCode).trim()) {
    throw new Error('SKU code is required.');
  }

  if (Number(price) < 0) {
    throw new Error('SKU price cannot be negative.');
  }

  if (!Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0) {
    throw new Error('SKU stock must be a non-negative integer.');
  }

  if (available === false && Number(stockQuantity) > 0) {
    throw new Error('Out-of-stock SKUs must have zero stock quantity.');
  }

  if (available === true && Number(stockQuantity) <= 0 && active === true) {
    throw new Error('Available SKUs must have positive stock.');
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  allowedStatuses,
  buildSlug,
  isValidStatus,
  variantKey,
  categoryHasCycle,
  validateCategoryState,
  ensurePublishedProductHasActiveSku,
  validateSku,
};