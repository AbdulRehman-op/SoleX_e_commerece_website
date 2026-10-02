CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NULL,
    variant_id INTEGER NULL,
    storage_key VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL DEFAULT 'gallery',
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_assets_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_assets_variant
        FOREIGN KEY (variant_id)
        REFERENCES variants(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_asset_target
        CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL),
    CONSTRAINT uq_asset_storage_key UNIQUE (storage_key)
);

CREATE INDEX IF NOT EXISTS idx_assets_product_id
ON assets (product_id);

CREATE INDEX IF NOT EXISTS idx_assets_variant_id
ON assets (variant_id);
