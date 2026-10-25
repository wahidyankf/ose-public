-- V3: the new column every reader will move to.
ALTER TABLE contacts ADD COLUMN phone_new TEXT;
UPDATE contacts SET phone_new = phone;
