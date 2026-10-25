-- 0002: one real row before the alter. -- => the row the alter must preserve
INSERT INTO inventory (sku) -- => seed data ships as a migration, not a side load
    VALUES ('WIDGET-1'); -- => the survivor under test
