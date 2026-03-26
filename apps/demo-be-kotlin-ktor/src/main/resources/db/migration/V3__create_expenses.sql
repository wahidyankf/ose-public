CREATE TABLE expenses (
  id          UUID           NOT NULL DEFAULT gen_random_uuid(),
  user_id     UUID           NOT NULL,
  type        VARCHAR(10)    NOT NULL,
  amount      DECIMAL(20, 8) NOT NULL,
  currency    VARCHAR(10)    NOT NULL,
  category    VARCHAR(100)   NOT NULL,
  description VARCHAR(500)   NOT NULL,
  date        DATE           NOT NULL,
  quantity    DECIMAL(20, 8),
  unit        VARCHAR(50),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_expenses PRIMARY KEY (id),
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users (id)
);
