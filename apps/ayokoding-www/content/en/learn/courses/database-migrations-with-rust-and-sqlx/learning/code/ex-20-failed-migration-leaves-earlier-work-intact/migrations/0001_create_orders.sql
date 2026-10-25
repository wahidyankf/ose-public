-- 0001: orders are the good version. -- => this file commits before the failure
CREATE TABLE orders ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    total INTEGER NOT NULL -- => totals store as integer minor units
); -- => the definition closes here
