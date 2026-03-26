CREATE TABLE attachments (
  id           UUID         NOT NULL DEFAULT gen_random_uuid(),
  expense_id   UUID         NOT NULL,
  user_id      UUID         NOT NULL,
  filename     VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes   BIGINT       NOT NULL,
  stored_path  VARCHAR(500) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL,
  CONSTRAINT pk_attachments PRIMARY KEY (id),
  CONSTRAINT fk_attachments_expense FOREIGN KEY (expense_id) REFERENCES expenses (id),
  CONSTRAINT fk_attachments_user FOREIGN KEY (user_id) REFERENCES users (id)
);
