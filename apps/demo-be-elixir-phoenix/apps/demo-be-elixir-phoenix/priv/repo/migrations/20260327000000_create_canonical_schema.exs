defmodule DemoBeExph.Repo.Migrations.CreateCanonicalSchema do
  use Ecto.Migration

  def change do
    execute("CREATE EXTENSION IF NOT EXISTS pgcrypto", "")

    create table(:users, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :username, :string, size: 50, null: false
      add :email, :string, size: 512, null: false
      add :password_hash, :string, size: 512, null: false
      add :display_name, :string, size: 512, null: false, default: ""
      add :role, :string, size: 20, null: false, default: "USER"
      add :status, :string, size: 20, null: false, default: "ACTIVE"
      add :failed_login_attempts, :integer, null: false, default: 0
      add :password_reset_token, :string, size: 255
      add :created_at, :timestamptz, null: false, default: fragment("NOW()")
      add :created_by, :string, size: 512, null: false, default: "system"
      add :updated_at, :timestamptz, null: false, default: fragment("NOW()")
      add :updated_by, :string, size: 512, null: false, default: "system"
      add :deleted_at, :timestamptz
      add :deleted_by, :string, size: 255
    end

    create unique_index(:users, [:username])
    create unique_index(:users, [:email])

    create table(:refresh_tokens, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :token_hash, :string, size: 512, null: false
      add :expires_at, :timestamptz, null: false
      add :revoked, :boolean, null: false, default: false
      add :created_at, :timestamptz, null: false, default: fragment("NOW()")
    end

    create unique_index(:refresh_tokens, [:token_hash])
    create index(:refresh_tokens, [:user_id], name: :idx_refresh_tokens_user_id)

    create table(:revoked_tokens, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :jti, :string, size: 512, null: false
      add :user_id, :uuid, null: false
      add :revoked_at, :timestamptz, null: false, default: fragment("NOW()")
    end

    create unique_index(:revoked_tokens, [:jti])
    create index(:revoked_tokens, [:user_id], name: :idx_revoked_tokens_user_id)

    create table(:expenses, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :amount, :decimal, precision: 19, scale: 4, null: false
      add :currency, :string, size: 10, null: false
      add :category, :string, size: 100, null: false
      add :description, :string, size: 500, null: false, default: ""
      add :date, :date, null: false
      add :type, :string, size: 20, null: false
      add :quantity, :decimal, precision: 19, scale: 4
      add :unit, :string, size: 50
      add :created_at, :timestamptz, null: false, default: fragment("NOW()")
      add :created_by, :string, size: 512, null: false, default: "system"
      add :updated_at, :timestamptz, null: false, default: fragment("NOW()")
      add :updated_by, :string, size: 512, null: false, default: "system"
      add :deleted_at, :timestamptz
      add :deleted_by, :string, size: 255
    end

    create index(:expenses, [:user_id])
    create index(:expenses, [:user_id, :date])

    create table(:attachments, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")

      add :expense_id,
          references(:expenses, type: :uuid, on_delete: :delete_all),
          null: false

      add :filename, :string, size: 512, null: false
      add :content_type, :string, size: 100, null: false
      add :size, :bigint, null: false
      add :data, :binary, null: false
      add :created_at, :timestamptz, null: false, default: fragment("NOW()")
    end

    create index(:attachments, [:expense_id])
  end
end
