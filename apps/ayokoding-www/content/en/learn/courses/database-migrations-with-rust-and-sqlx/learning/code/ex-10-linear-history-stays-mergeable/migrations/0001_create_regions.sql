-- 0001: regions anchor the rollout schema. -- => the first link in the line
CREATE TABLE regions ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    code TEXT NOT NULL UNIQUE -- => every region owns a short code
); -- => the definition closes here
