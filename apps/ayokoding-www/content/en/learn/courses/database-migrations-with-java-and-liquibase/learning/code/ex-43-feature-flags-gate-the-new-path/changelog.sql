-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-flags
-- => the flags table ships with both paths defaulting off
-- => schema lands first; no reader switches until a flag says so
CREATE TABLE feature_flags (
  name VARCHAR(60) PRIMARY KEY,
  -- => the flag name is the key readers ask for by constant
  enabled BOOLEAN NOT NULL DEFAULT FALSE
  -- => new paths start disabled: shipping the schema enables nothing
);
INSERT INTO feature_flags (name) VALUES ('new_checkout'), ('new_reports');
-- => two dark flags; the flip below lights exactly one of them

-- rollback DROP TABLE feature_flags;
-- => dropping the table reverses the flags and the flip together

-- changeset course:002-flip-checkout
-- => the flip changeset lights the ready path once readers can take it
-- => flipping is data, so it ships as a tracked changeset like the rest
UPDATE feature_flags SET enabled = TRUE WHERE name = 'new_checkout';

-- rollback UPDATE feature_flags SET enabled = FALSE WHERE name = 'new_checkout';
-- => unflipping restores the dark default without dropping the flag
