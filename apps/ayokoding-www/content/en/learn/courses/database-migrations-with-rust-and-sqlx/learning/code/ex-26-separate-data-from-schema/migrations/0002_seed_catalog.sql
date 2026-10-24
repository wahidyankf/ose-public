-- 0002: the opening catalog is data, not schema. -- => content ships as a version too
INSERT INTO products (sku, price) -- => the shape already exists from version 1
    VALUES ('BOOK-1', 1200), -- => the first catalog row
    ('BOOK-2', 950), -- => the second catalog row
    ('BOOK-3', 2100); -- => the third catalog row
