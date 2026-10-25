-- 0001 team A: carts hold items. -- => applies once, skips on re-runs
CREATE TABLE carts ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    item TEXT NOT NULL -- => every cart row names an item
); -- => the definition closes here
