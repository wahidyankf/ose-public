-- 0001: the reviewed copy; title stays nullable. -- => the checksum recorded at apply time
CREATE TABLE books ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    title TEXT -- => nullable in the reviewed copy
); -- => the definition closes here
