-- 0002: beta arrives with the merge. -- => the only pending file in the second run
CREATE TABLE beta ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    code TEXT NOT NULL -- => every beta row carries a code
); -- => the definition closes here
