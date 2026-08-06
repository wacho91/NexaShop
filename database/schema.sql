-- ============================================================
-- NexaShop - SQLite Database Schema
-- Plataforma E-commerce B2C
-- Entorno: Desarrollo local
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA recursive_triggers = OFF;
PRAGMA journal_mode = WAL;

-- ============================================================
-- TABLAS DE DOMINIO
-- ============================================================

-- Usuarios (clientes y administradores)
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    full_name     TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'cliente'
                          CHECK (role IN ('cliente', 'admin')),
    is_active     INTEGER NOT NULL DEFAULT 1
                          CHECK (is_active IN (0, 1)),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Categorías de productos
CREATE TABLE categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    slug       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Productos del catálogo
CREATE TABLE products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    slug        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT    NOT NULL DEFAULT '',
    price       REAL    NOT NULL CHECK (price > 0),
    stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id INTEGER NOT NULL,
    images      TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(images)),
    is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Carrito de compras (autenticado o invitado)
CREATE TABLE cart_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    session_id TEXT,
    product_id INTEGER NOT NULL,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),
    CHECK (user_id IS NULL OR session_id IS NULL),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Pedidos
CREATE TABLE orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    subtotal         REAL    NOT NULL CHECK (subtotal >= 0),
    shipping_cost    REAL    NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    total            REAL    NOT NULL CHECK (total >= 0),
    shipping_address TEXT    NOT NULL CHECK (json_valid(shipping_address)),
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    paid_at          TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Líneas de pedido (snapshot del producto para histórico)
CREATE TABLE order_items (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id             INTEGER NOT NULL,
    product_id           INTEGER NOT NULL,
    product_name_snapshot TEXT   NOT NULL,
    unit_price           REAL    NOT NULL CHECK (unit_price >= 0),
    quantity             INTEGER NOT NULL CHECK (quantity > 0),
    total                REAL    NOT NULL CHECK (total >= 0),
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Refresh tokens para autenticación JWT
CREATE TABLE refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token_hash TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Productos
CREATE INDEX idx_products_category      ON products(category_id);
CREATE INDEX idx_products_active        ON products(is_active);
CREATE INDEX idx_products_featured      ON products(is_featured);
CREATE INDEX idx_products_created_at    ON products(created_at);

-- Carrito
CREATE INDEX idx_cart_user              ON cart_items(user_id);
CREATE INDEX idx_cart_session           ON cart_items(session_id);

-- Unicidad por usuario/producto y sesión/producto
CREATE UNIQUE INDEX idx_cart_user_product
    ON cart_items(user_id, product_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_cart_session_product
    ON cart_items(session_id, product_id)
    WHERE session_id IS NOT NULL;

-- Pedidos
CREATE INDEX idx_orders_user            ON orders(user_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_created_at      ON orders(created_at);
CREATE INDEX idx_orders_status_created  ON orders(status, created_at);

-- Líneas de pedido
CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_order_items_product    ON order_items(product_id);

-- Refresh tokens
CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Mantener updated_at en products
CREATE TRIGGER trg_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products
       SET updated_at = datetime('now')
     WHERE id = OLD.id;
END;

-- Registrar paid_at cuando el pedido pasa a pagado/enviado
CREATE TRIGGER trg_orders_paid_at
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN NEW.status IN ('paid', 'shipped')
 AND OLD.status NOT IN ('paid', 'shipped')
BEGIN
    UPDATE orders
       SET paid_at = COALESCE(OLD.paid_at, datetime('now'))
     WHERE id = OLD.id;
END;

-- ============================================================
-- VISTAS PARA MÉTRICAS DEL PANEL ADMIN
-- ============================================================

-- Ventas diarias agregadas (pedidos pagados/enviados)
CREATE VIEW v_sales_daily AS
SELECT
    date(created_at) AS day,
    COUNT(*)         AS num_orders,
    SUM(total)       AS total_sales
FROM orders
WHERE status IN ('paid', 'shipped')
GROUP BY date(created_at);

-- Productos más vendidos
CREATE VIEW v_top_products AS
SELECT
    oi.product_id,
    oi.product_name_snapshot AS product_name,
    SUM(oi.quantity)         AS total_quantity,
    SUM(oi.total)            AS total_sales
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY oi.product_id, oi.product_name_snapshot
ORDER BY total_quantity DESC;
