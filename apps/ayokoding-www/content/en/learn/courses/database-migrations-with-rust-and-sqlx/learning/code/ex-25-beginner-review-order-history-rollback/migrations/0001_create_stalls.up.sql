-- 0001 up: stalls anchor the market. -- => the version that survives the review
CREATE TABLE stalls ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every stall must be named
); -- => the definition closes here
