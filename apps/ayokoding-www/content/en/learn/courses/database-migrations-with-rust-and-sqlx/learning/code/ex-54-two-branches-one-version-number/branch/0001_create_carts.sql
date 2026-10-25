-- 0001 team B: carts hold quantities. -- => the competing claim on version 1
CREATE TABLE carts ( -- => same number, different content
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    qty INTEGER NOT NULL -- => team B shaped the table differently
); -- => the definition closes here
