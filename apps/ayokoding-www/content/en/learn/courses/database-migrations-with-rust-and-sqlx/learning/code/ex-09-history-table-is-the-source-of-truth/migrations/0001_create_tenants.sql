-- 0001: tenants anchor the SaaS schema. -- => the first of three recorded runs
CREATE TABLE tenants ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    slug TEXT NOT NULL UNIQUE -- => every tenant owns a unique slug
); -- => the definition closes here
