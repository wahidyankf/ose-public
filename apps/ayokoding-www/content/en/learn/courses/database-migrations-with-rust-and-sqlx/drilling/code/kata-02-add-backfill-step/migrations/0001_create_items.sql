-- 0001: items start quantity-less. -- => the column the backfill fills
CREATE TABLE items ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL, -- => every item must be named
    qty INTEGER -- => NULL until the backfill derives values
); -- => the definition closes here
