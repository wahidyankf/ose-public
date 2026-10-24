-- 0002: projects belong to tenants. -- => the second of three recorded runs
CREATE TABLE projects ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    tenant_id INTEGER NOT NULL REFERENCES tenants (id), -- => every project belongs to a tenant
    name TEXT NOT NULL -- => every project must be named
); -- => the definition closes here
