-- 0001: nicks start missing. -- => the backfill target
CREATE TABLE gamers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    nick TEXT -- => NULL until the guarded update claims the row
); -- => the definition closes here
