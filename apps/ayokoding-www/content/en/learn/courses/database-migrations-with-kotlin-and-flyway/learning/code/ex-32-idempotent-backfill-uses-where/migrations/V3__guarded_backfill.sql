-- V3: the WHERE guard makes reruns harmless.
UPDATE subs SET tier = 'free' WHERE tier IS NULL;
