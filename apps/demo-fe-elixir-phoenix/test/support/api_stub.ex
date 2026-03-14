defmodule DemoFeExph.Test.ApiStub do
  @moduledoc """
  Global stub store for API responses in LiveView unit tests.

  Uses an ETS table (owned by the test supervisor process) so responses are
  accessible from any process, including LiveView GenServer processes that
  run in a separate BEAM process from the test process.

  All Cabbage feature tests run with `async: false`, so a single shared
  ETS table is safe.

  Usage:

      setup do
        DemoFeExph.Test.ApiStub.reset()
        :ok
      end

      DemoFeExph.Test.ApiStub.put(:health, {:ok, %{"status" => "UP"}})
      DemoFeExph.Test.ApiStub.get(:health)
  """

  @table __MODULE__

  @doc "Creates the ETS table. Called once from test_helper.exs."
  def start do
    :ets.new(@table, [:named_table, :public, :set, read_concurrency: true])
  end

  @doc "Resets all stubs to their defaults. Call in setup."
  def reset do
    :ets.delete_all_objects(@table)
    seed_defaults()
  end

  @doc "Stores a stub response under `key`."
  def put(key, value) do
    :ets.insert(@table, {key, value})
  end

  @doc "Retrieves a stub response. Falls back to the default if not set."
  def get(key) do
    case :ets.lookup(@table, key) do
      [{^key, value}] -> value
      [] -> defaults()[key] || {:error, :no_stub}
    end
  end

  # ------------------------------------------------------------------ defaults

  defp seed_defaults do
    Enum.each(defaults(), fn {k, v} -> :ets.insert(@table, {k, v}) end)
  end

  defp defaults do
    %{
      health: {:ok, %{"status" => "UP"}},
      register: {:ok, %{"id" => "user-1", "username" => "alice"}},
      login:
        {:ok, %{"access_token" => "test_access_token", "refresh_token" => "test_refresh_token"}},
      logout: {:ok, %{}},
      logout_all: {:ok, %{}},
      refresh:
        {:ok, %{"access_token" => "new_access_token", "refresh_token" => "new_refresh_token"}},
      get_current_user:
        {:ok,
         %{
           "id" => "user-1",
           "username" => "alice",
           "email" => "alice@example.com",
           "display_name" => "Alice"
         }},
      update_profile:
        {:ok,
         %{
           "id" => "user-1",
           "username" => "alice",
           "email" => "alice@example.com",
           "display_name" => "Alice Smith"
         }},
      change_password: {:ok, %{}},
      deactivate_account: {:ok, %{}},
      list_users:
        {:ok,
         %{
           "users" => [%{"id" => "user-1", "username" => "alice", "status" => "active"}],
           "total" => 1
         }},
      disable_user: {:ok, %{}},
      enable_user: {:ok, %{}},
      unlock_user: {:ok, %{}},
      force_password_reset: {:ok, %{"token" => "reset-token-abc123"}},
      list_expenses: {:ok, %{"expenses" => [], "total" => 0}},
      get_expense:
        {:ok,
         %{
           "id" => "exp-1",
           "description" => "Lunch",
           "amount" => "10.50",
           "currency" => "USD",
           "category" => "food",
           "date" => "2025-01-15",
           "type" => "expense"
         }},
      create_expense: {:ok, %{"id" => "exp-1"}},
      update_expense: {:ok, %{"id" => "exp-1"}},
      delete_expense: {:ok, %{}},
      get_expense_summary:
        {:ok,
         %{
           "total" => "0.00",
           "by_currency" => [
             %{"currency" => "USD", "total" => "0.00"},
             %{"currency" => "IDR", "total" => "0"}
           ]
         }},
      list_attachments: {:ok, %{"attachments" => []}},
      upload_attachment:
        {:ok,
         %{
           "id" => "att-1",
           "filename" => "receipt.jpg",
           "content_type" => "image/jpeg"
         }},
      delete_attachment: {:ok, %{}},
      get_pl_report:
        {:ok,
         %{
           "income_total" => "0.00",
           "expense_total" => "0.00",
           "net" => "0.00",
           "income_by_category" => [],
           "expense_by_category" => []
         }},
      jwks: {:ok, %{"keys" => [%{"kid" => "key-1", "kty" => "RSA"}]}}
    }
  end
end
