-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-subscribers
-- => the table changeset creates subscribers and seeds three emails
-- => the tier column arrives later, so these rows start life tierless
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  email VARCHAR(120) NOT NULL
  -- => the email domain below decides each row's derived tier
);
INSERT INTO subscribers (email) VALUES ('budi@kampus.edu'), ('sari@mail.id'), ('agus@kampus.edu');
-- => three seeded rows: two edu addresses and one regular address
-- => reruns skip this changeset as applied, so the rows never duplicate

-- rollback DROP TABLE subscribers;
-- => dropping the table reverses exactly what this changeset built

-- changeset course:002-add-tier
-- => the schema changeset adds the tier column, nullable for now
-- => old rows hold NULL until the backfill below derives their values
ALTER TABLE subscribers ADD COLUMN tier VARCHAR(20);

-- rollback ALTER TABLE subscribers DROP COLUMN tier;
-- => dropping the column reverses exactly what this changeset added

-- changeset course:003-backfill-tier
-- => the data changeset derives every row's tier from its email domain
-- => reruns skip it as applied, so values never double-derive
UPDATE subscribers SET tier = CASE WHEN email LIKE '%@kampus.edu' THEN 'pro' ELSE 'basic' END;

-- rollback UPDATE subscribers SET tier = NULL;
-- => nulling the column un-derives every row without dropping the column
