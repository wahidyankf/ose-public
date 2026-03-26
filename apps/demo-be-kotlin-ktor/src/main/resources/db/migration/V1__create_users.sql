CREATE TABLE users (
  id            UUID          NOT NULL DEFAULT gen_random_uuid(),
  username      VARCHAR(50)   NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  display_name  VARCHAR(100)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(10)   NOT NULL DEFAULT 'USER',
  status        VARCHAR(10)   NOT NULL DEFAULT 'ACTIVE',
  failed_login_count INT      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by    VARCHAR(255)  NOT NULL DEFAULT 'system',
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_by    VARCHAR(255)  NOT NULL DEFAULT 'system',
  deleted_at    TIMESTAMPTZ,
  deleted_by    VARCHAR(255),
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email UNIQUE (email)
);
