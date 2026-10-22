-- 0001: articles start slug-less. -- => the column the check inspects
CREATE TABLE articles ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    title TEXT NOT NULL, -- => titles the slugs derive from
    slug TEXT -- => NULL until the backfill derives values
); -- => the definition closes here
