-- 0002 broken: an invalid type fails the file. -- => nothing recorded, so retry stays clean
CREATE TABLE broken ( -- => this statement never commits
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    amount NOT_A_TYPE -- => unknown types fail at parse time
); -- => the definition closes here
