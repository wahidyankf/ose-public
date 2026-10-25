-- 0002: three parcels, two kinds. -- => duplicates collapse in the lookup
INSERT INTO parcels (kind) -- => kinds buried in row data
    VALUES ('fragile'), -- => parcel 1
    ('heavy'), -- => parcel 2
    ('fragile'); -- => parcel 3 repeats parcel 1
