-- 0001: vaults hold the secrets. -- => the first sealed file
CREATE TABLE vaults ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every vault must be named
); -- => the definition closes here
