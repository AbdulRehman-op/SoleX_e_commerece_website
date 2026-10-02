-- ---------- CATEGORIES (2 levels) ----------
INSERT INTO categories (name, slug, parent_id, active)
VALUES
    ('Footwear', 'footwear', NULL, TRUE),
    ('Running', 'running', 1, TRUE),
    ('Casual', 'casual', 1, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ---------- PRODUCTS (3 products) ----------
INSERT INTO products (category_id, name, slug, description, status, specifications)
VALUES
    (
        2,
        'SoleX Air Runner',
        'solex-air-runner',
        'Lightweight daily running shoe built for comfort and traction.',
        'draft',
        '{"material": "Mesh", "sole_type": "Rubber", "gender": "Unisex"}'::jsonb
    ),
    (
        3,
        'SoleX City Step',
        'solex-city-step',
        'Premium casual sneaker designed for everyday wear.',
        'draft',
        '{"material": "Leather", "sole_type": "Cushion", "gender": "Unisex"}'::jsonb
    ),
    (
        2,
        'SoleX Trail Blazer',
        'solex-trail-blazer',
        'Rugged trail running shoe with multi-surface grip.',
        'draft',
        '{"material": "Synthetic", "sole_type": "Grip", "gender": "Men"}'::jsonb
    )
ON CONFLICT (slug) DO NOTHING;

-- ---------- VARIANTS ----------
-- Product 1 (Air Runner) — 2 variants
-- Product 2 (City Step) — 1 variant
-- Product 3 (Trail Blazer) — 3 variants (multiple-variant demo)
INSERT INTO variants (product_id, size, color)
VALUES
    (1, '40', 'Black'),
    (1, '41', 'Black'),
    (2, '39', 'White'),
    (3, '42', 'Green'),
    (3, '43', 'Green'),
    (3, '42', 'Black')
ON CONFLICT (product_id, size, color) DO NOTHING;

-- ---------- SKUS (6 valid + 1 unavailable) ----------
INSERT INTO skus (variant_id, sku_code, price, stock_quantity, active, available)
VALUES
    (1, 'SOLEX-AIR-40-BLK',   129.99, 12, TRUE,  TRUE),
    (2, 'SOLEX-AIR-41-BLK',   129.99,  0, TRUE,  FALSE),   -- intentionally unavailable
    (3, 'SOLEX-CITY-39-WHT',  119.00,  4, TRUE,  TRUE),
    (4, 'SOLEX-TRAIL-42-GRN', 149.99,  8, TRUE,  TRUE),
    (5, 'SOLEX-TRAIL-43-GRN', 149.99,  5, TRUE,  TRUE),
    (6, 'SOLEX-TRAIL-42-BLK', 149.99,  0, TRUE,  FALSE)    -- another unavailable combination
ON CONFLICT (sku_code) DO NOTHING;

-- ---------- ASSETS ----------
INSERT INTO assets (product_id, variant_id, storage_key, role, alt_text, sort_order)
VALUES
    (1, 1, 'uploads/products/1/hero.jpg', 'hero', 'SoleX Air Runner hero image', 1),
    (2, 3, 'uploads/products/2/hero.jpg', 'hero', 'SoleX City Step hero image', 2),
    (3, 4, 'uploads/products/3/hero.jpg', 'hero', 'SoleX Trail Blazer hero image', 3)
ON CONFLICT (storage_key) DO NOTHING;