-- 0001: the tampered copy; title turned strict. -- => different bytes, different checksum
CREATE TABLE books ( -- => same version number, different content
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    title TEXT NOT NULL -- => the well-meaning cleanup that breaks the seal
); -- => the definition closes here
