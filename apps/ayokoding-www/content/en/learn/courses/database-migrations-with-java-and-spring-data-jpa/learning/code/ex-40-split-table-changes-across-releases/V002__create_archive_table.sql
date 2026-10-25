-- V002 archives old orders into their own table: release two.
-- Splitting across releases keeps each promotion small and reviewable.
CREATE TABLE ex40_orders_archive (LIKE ex40_orders INCLUDING ALL);

-- => LIKE copies shape and constraints so archived rows keep their guarantees
INSERT INTO
  ex40_orders_archive
SELECT
  *
FROM
  ex40_orders
WHERE
  placed_on < CURRENT_DATE - 365;

-- => old rows move across, the live table keeps serving fresh traffic
DELETE FROM ex40_orders
WHERE
  placed_on < CURRENT_DATE - 365;

-- => the move completes: archive holds history, live holds the present
