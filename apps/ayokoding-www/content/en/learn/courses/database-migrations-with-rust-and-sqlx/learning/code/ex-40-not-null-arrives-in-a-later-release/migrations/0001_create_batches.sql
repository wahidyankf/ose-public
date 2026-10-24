-- 0001: batches start codeless. -- => the column arrives in the next release
CREATE TABLE batches ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY -- => surrogate key: the row identity never changes
); -- => the definition closes here
