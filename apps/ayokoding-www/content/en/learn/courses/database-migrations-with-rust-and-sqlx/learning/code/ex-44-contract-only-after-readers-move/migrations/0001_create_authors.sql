-- 0001: authors start wide. -- => the shape the arc retires
CREATE TABLE authors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL, -- => the column that stays
    bio TEXT NOT NULL DEFAULT 'unknown' -- => the legacy column the arc removes
); -- => the definition closes here
