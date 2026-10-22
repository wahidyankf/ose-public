-- 0001: posts start with title only. -- => the shape before the mistake
CREATE TABLE posts ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    title TEXT NOT NULL -- => every post must be titled
); -- => the definition closes here
