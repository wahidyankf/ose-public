-- V003 claimed by developer B after seeing A's reservation.
-- Announced numbers never collide: the protocol costs one message.
ALTER TABLE ex61_claims
ADD COLUMN phone VARCHAR(40);

-- => developer B's claimed change lands under its reserved number
