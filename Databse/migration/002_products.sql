CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_specifications_object
        CHECK (jsonb_typeof(COALESCE(specifications, '{}'::jsonb)) = 'object')
);

CREATE OR REPLACE FUNCTION validate_product_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND NOT EXISTS (
        SELECT 1
        FROM variants v
        INNER JOIN skus s ON s.variant_id = v.id
        WHERE v.product_id = NEW.id
          AND s.active = TRUE
          AND s.stock_quantity > 0
    ) THEN
        RAISE EXCEPTION 'Published products require at least one active SKU with stock.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_status_guard ON products;
CREATE TRIGGER products_status_guard
BEFORE INSERT OR UPDATE OF status ON products
FOR EACH ROW
EXECUTE FUNCTION validate_product_status();

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
