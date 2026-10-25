-- V2: the first versioned change touches both tables.
ALTER TABLE legacy_shops ADD COLUMN city TEXT;
UPDATE legacy_shops SET city = 'bandung';
ALTER TABLE legacy_visits ADD COLUMN note TEXT;
UPDATE legacy_visits SET note = 'ok';
