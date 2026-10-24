-- 0002: keys belong to vaults. -- => the second sealed file
CREATE TABLE keys ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    vault_id INTEGER NOT NULL REFERENCES vaults (id), -- => every key lives in a vault
    material TEXT NOT NULL -- => key material never leaves the vault
); -- => the definition closes here
