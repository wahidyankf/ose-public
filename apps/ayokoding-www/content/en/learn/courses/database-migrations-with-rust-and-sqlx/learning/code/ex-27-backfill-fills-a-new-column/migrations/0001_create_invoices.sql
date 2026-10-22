-- 0001: invoices start without totals. -- => the shape before the backfill
CREATE TABLE invoices ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    qty INTEGER NOT NULL, -- => quantities the backfill multiplies
    price INTEGER NOT NULL -- => unit prices the backfill multiplies
); -- => the definition closes here
