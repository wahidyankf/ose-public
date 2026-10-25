-- 0003: the WHERE guard makes reruns safe. -- => filled rows never match again
UPDATE gamers -- => only the still-missing rows change
    SET nick = 'player-' || id WHERE nick IS NULL; -- => the guard is the idempotence
