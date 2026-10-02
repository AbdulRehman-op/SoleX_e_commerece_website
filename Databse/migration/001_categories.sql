CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    parent_id INTEGER NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_category_parent_not_self
        CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE OR REPLACE FUNCTION validate_category_parent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL AND NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'Category cannot be its own parent';
    END IF;

    IF NEW.parent_id IS NOT NULL THEN
        IF EXISTS (
            WITH RECURSIVE category_chain AS (
                SELECT id, parent_id
                FROM categories
                WHERE id = NEW.parent_id

                UNION ALL

                SELECT c.id, c.parent_id
                FROM categories c
                INNER JOIN category_chain cc ON cc.parent_id = c.id
            )
            SELECT 1
            FROM category_chain
            WHERE id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Category hierarchy cannot contain cycles';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_parent_guard ON categories;
CREATE TRIGGER categories_parent_guard
BEFORE INSERT OR UPDATE OF parent_id ON categories
FOR EACH ROW
EXECUTE FUNCTION validate_category_parent();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
