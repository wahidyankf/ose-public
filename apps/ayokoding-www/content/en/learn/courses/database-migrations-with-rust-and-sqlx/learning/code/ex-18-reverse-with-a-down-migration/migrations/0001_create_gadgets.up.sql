-- 0001 up: gadgets arrive with an id and a label. -- => the forward half of the pair
CREATE TABLE gadgets ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every gadget must be labeled
); -- => the definition closes here
