CREATE TABLE IF NOT EXISTS skus (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL,
    sku_code VARCHAR(120) NOT NULL UNIQUE,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_skus_variant
        FOREIGN KEY (variant_id)
        REFERENCES variants(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_sku_availability
        CHECK (available = FALSE OR (available = TRUE AND stock_quantity > 0))
);

CREATE OR REPLACE FUNCTION sync_sku_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active = FALSE OR NEW.stock_quantity <= 0 THEN
        NEW.available := FALSE;
    ELSE
        NEW.available := TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skus_sync_availability ON skus;
CREATE TRIGGER skus_sync_availability
BEFORE INSERT OR UPDATE OF stock_quantity, active ON skus
FOR EACH ROW
EXECUTE FUNCTION sync_sku_availability();

DROP TRIGGER IF EXISTS skus_set_updated_at ON skus;
CREATE TRIGGER skus_set_updated_at
BEFORE UPDATE ON skus
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_skus_variant_id
ON skus (variant_id);