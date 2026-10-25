-- V002 adds locale with the previously implicit default made explicit.
-- Compatible defaults preserve old behavior: old writes read correctly today.
-- The default mirrors what the application assumed before the column existed.
ALTER TABLE ex43_profiles
ADD COLUMN locale VARCHAR(10) NOT NULL DEFAULT 'en';

-- => 'en' was always the assumption, now the schema states it plainly
