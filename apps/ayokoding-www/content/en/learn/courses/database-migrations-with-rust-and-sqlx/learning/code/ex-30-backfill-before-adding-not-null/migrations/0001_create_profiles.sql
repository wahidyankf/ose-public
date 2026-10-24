-- 0001: handles start nullable. -- => strictness comes later, data comes now
CREATE TABLE profiles ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    handle TEXT -- => NULL until the backfill invents values
); -- => the definition closes here
