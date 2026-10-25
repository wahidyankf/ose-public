-- U003 reverses V003: drops the gamma tip and nothing else.
-- Rollback unwinds from the tip, never from the middle of history.
DROP TABLE ex19_gamma;

-- => gamma goes away, alpha and beta stand untouched
