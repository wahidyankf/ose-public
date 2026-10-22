-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Shipping's file sorts second under includeAll.
-- changeset shipping:shipping-001-make-parcels
-- => the shipping team owns the shipping id space: no billing id fits here
CREATE TABLE parcels (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => parcel codes are required from the first migration
);

-- rollback DROP TABLE parcels;
-- => each team file carries its own reverse, as before the merge
