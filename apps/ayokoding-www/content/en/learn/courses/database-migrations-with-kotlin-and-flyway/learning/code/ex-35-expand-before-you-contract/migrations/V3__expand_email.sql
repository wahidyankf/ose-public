-- V3: expand only; old readers keep working.
ALTER TABLE customers ADD COLUMN email_new TEXT;
UPDATE customers SET email_new = email;
