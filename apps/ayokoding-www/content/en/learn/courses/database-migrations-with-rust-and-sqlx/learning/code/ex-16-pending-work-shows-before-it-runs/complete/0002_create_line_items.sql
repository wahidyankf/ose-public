-- 0002: line items belong to quotes. -- => the one pending version
CREATE TABLE line_items ( -- => the preview names this file without running it
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    quote_id INTEGER NOT NULL REFERENCES quotes (id), -- => every line item belongs to a quote
    amount INTEGER NOT NULL -- => amounts store as integer minor units
); -- => the definition closes here
