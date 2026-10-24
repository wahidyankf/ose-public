-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset course:001-create-users
-- => author "course", id "001-create-users": this changeset's identity
-- => 001- prefix sorts before 002-, so users exists before products
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  username VARCHAR(50) NOT NULL
  -- => NOT NULL at creation time keeps the first migration honest
);

-- rollback DROP TABLE users;
-- => every changeset that can be undone declares its reverse here
