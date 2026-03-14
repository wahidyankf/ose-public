defmodule DemoFeExph.Api.Expenses do
  @moduledoc "Expense API calls: CRUD operations and summary."

  alias DemoFeExph.Api.Client

  @doc "Lists expenses with optional pagination."
  def list_expenses(token, page \\ 1, size \\ 20) do
    query = URI.encode_query(%{page: page, size: size})
    Client.get("/api/v1/expenses?#{query}", token)
  end

  @doc "Fetches a single expense by ID."
  def get_expense(token, id) do
    Client.get("/api/v1/expenses/#{id}", token)
  end

  @doc "Creates a new expense with the given attributes."
  def create_expense(token, attrs) do
    Client.post("/api/v1/expenses", attrs, token)
  end

  @doc "Updates an existing expense by ID."
  def update_expense(token, id, attrs) do
    Client.put("/api/v1/expenses/#{id}", attrs, token)
  end

  @doc "Deletes an expense by ID."
  def delete_expense(token, id) do
    Client.delete("/api/v1/expenses/#{id}", token)
  end

  @doc "Returns the expense summary for the given currency."
  def get_expense_summary(token, currency \\ "USD") do
    query = URI.encode_query(%{currency: currency})
    Client.get("/api/v1/expenses/summary?#{query}", token)
  end
end
