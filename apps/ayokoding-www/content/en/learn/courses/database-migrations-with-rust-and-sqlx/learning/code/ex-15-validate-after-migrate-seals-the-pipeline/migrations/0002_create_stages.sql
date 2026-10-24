-- 0002: stages belong to pipelines. -- => the second sealed file
CREATE TABLE stages ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    pipeline_id INTEGER NOT NULL REFERENCES pipelines (id), -- => every stage runs in a pipeline
    name TEXT NOT NULL -- => every stage must be named
); -- => the definition closes here
