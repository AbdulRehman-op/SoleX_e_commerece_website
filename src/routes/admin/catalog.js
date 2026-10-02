const express = require('express');
const { requireAdmin } = require('../../lib/auth');
const { catalogService } = require('../../services/catalogService');

const router = express.Router();
router.use(requireAdmin);

// ---------- CATEGORIES ----------
router.get('/categories', async (req, res) => {
  try {
    const items = await catalogService.listCategories();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const category = await catalogService.addCategory(req.body || {});
    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch('/categories/:id', async (req, res) => {
  try {
    const category = await catalogService.updateCategory(req.params.id, req.body || {});
    return res.json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// ---------- PRODUCTS ----------
router.get('/products', async (req, res) => {
  try {
    const items = await catalogService.listProducts();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await catalogService.addProduct(req.body || {});
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const product = await catalogService.updateProduct(req.params.id, req.body || {});
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// ---------- VARIANTS ----------
router.get('/variants', async (req, res) => {
  try {
    const items = await catalogService.listVariants();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/variants', async (req, res) => {
  try {
    const variant = await catalogService.addVariant(req.body || {});
    return res.status(201).json(variant);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// ---------- SKUS ----------
router.get('/skus', async (req, res) => {
  try {
    const items = await catalogService.listSkus();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/skus', async (req, res) => {
  try {
    const sku = await catalogService.addSku(req.body || {});
    return res.status(201).json(sku);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch('/skus/:id', async (req, res) => {
  try {
    const sku = await catalogService.updateSku(req.params.id, req.body || {});
    return res.json(sku);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;