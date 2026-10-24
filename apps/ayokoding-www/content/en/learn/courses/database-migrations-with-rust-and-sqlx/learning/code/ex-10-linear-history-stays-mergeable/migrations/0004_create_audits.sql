-- 0004: audits watch the stock. -- => the fourth link in the line
CREATE TABLE audits ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    stock_id INTEGER NOT NULL REFERENCES stock (id), -- => every audit covers a stock row
    noted_at TIMESTAMPTZ NOT NULL DEFAULT now() -- => the audit moment records itself
); -- => the definition closes here
