-- 0002: authors come second. -- => the second row in the audit trail
CREATE TABLE authors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every author must be named
); -- => the definition closes here
