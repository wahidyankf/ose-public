CREATE TABLE tokens (
  jti        VARCHAR(255) NOT NULL,
  user_id    UUID         NOT NULL,
  token_type VARCHAR(10)  NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT pk_tokens PRIMARY KEY (jti),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);
