-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The wired backfill step: heavy rows become A, light rows become B.
-- changeset kata:002-grade-ingots
-- => the added step derives every row's grade from its weight
UPDATE ingots SET grade = CASE WHEN weight_kg >= 25 THEN 'A' ELSE 'B' END;
-- => two and two: the verification below recounts both bands

-- rollback UPDATE ingots SET grade = NULL;
-- => nulling the grades un-derives every row without dropping the column
