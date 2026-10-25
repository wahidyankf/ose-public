-- 0001: books come first. -- => the first row in the audit trail
CREATE TABLE books ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    title TEXT NOT NULL -- => every book must name itself
); -- => the definition closes here
