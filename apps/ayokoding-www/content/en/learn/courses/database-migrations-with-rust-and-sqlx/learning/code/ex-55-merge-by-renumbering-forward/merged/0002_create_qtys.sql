-- 0002 team B renumbered: quantities live apart. -- => the next free number, no collision
CREATE TABLE qtys ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    cart_id INTEGER NOT NULL REFERENCES carts (id), -- => every quantity belongs to a cart
    qty INTEGER NOT NULL -- => the work team B kept, renumbered
); -- => the definition closes here
