defmodule AADemoBeExphWeb.ExpenseController do
  use AADemoBeExphWeb, :controller

  alias GeneratedSchemas.Expense, as: ExpenseSchema
  alias GeneratedSchemas.ExpenseListResponse
  alias Guardian.Plug, as: GuardianPlug

  defp expense_ctx,
    do:
      Application.get_env(
        :a_demo_be_exph,
        :expense_module,
        ADemoBeExph.Expense.ExpenseContext
      )

  def index(conn, params) do
    user = GuardianPlug.current_resource(conn)
    raw_page = params |> Map.get("page", "1") |> String.to_integer()
    page = max(raw_page, 1)
    result = expense_ctx().list_expenses(user.id, page: page)
    total_pages = ceil(result.total / result.page_size)

    _ = %ExpenseListResponse{
      content: result.data,
      total_elements: result.total,
      total_pages: total_pages,
      page: result.page,
      size: result.page_size
    }

    json(conn, %{
      content: Enum.map(result.data, &expense_json/1),
      totalElements: result.total,
      page: result.page
    })
  end

  def create(conn, params) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().create_expense(user.id, params) do
      {:ok, expense} ->
        _ = validate_expense_shape(expense)

        conn
        |> put_status(:created)
        |> json(expense_json(expense))

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def show(conn, %{"id" => id}) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().get_expense(user.id, id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{message: "Not found"})

      expense ->
        _ = validate_expense_shape(expense)
        json(conn, expense_json(expense))
    end
  end

  def update(conn, %{"id" => id} = params) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().update_expense(user.id, id, params) do
      {:ok, expense} ->
        _ = validate_expense_shape(expense)
        json(conn, expense_json(expense))

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{message: "Not found"})

      {:error, changeset} ->
        conn |> put_status(:bad_request) |> json(%{errors: format_errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().delete_expense(user.id, id) do
      {:ok, _} ->
        conn |> put_status(:no_content) |> json(%{})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{message: "Not found"})
    end
  end

  def summary(conn, _params) do
    user = GuardianPlug.current_resource(conn)
    totals = expense_ctx().summary(user.id)
    serializable = Enum.into(totals, %{}, fn {k, v} -> {k, format_amount(v, k)} end)
    json(conn, serializable)
  end

  defp validate_expense_shape(expense) do
    %ExpenseSchema{
      id: to_string(expense.id),
      amount: Decimal.to_string(expense.amount),
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      date: Date.to_iso8601(expense.date),
      type: expense.type,
      user_id: to_string(expense.user_id),
      created_at: to_string(expense.created_at),
      updated_at: to_string(expense.updated_at)
    }
  end

  defp expense_json(expense) do
    %{
      id: expense.id,
      userId: expense.user_id,
      amount: format_amount(expense.amount, expense.currency),
      currency: expense.currency,
      category: expense.category,
      type: expense.type,
      description: expense.description,
      date: Date.to_iso8601(expense.date),
      unit: expense.unit,
      quantity: format_quantity(expense.quantity),
      created_at: expense.created_at,
      updated_at: expense.updated_at
    }
  end

  # Currency decimal precision: IDR uses 0 decimals, all others use 2.
  @zero_decimal_currencies ~w(IDR)

  defp format_amount(%Decimal{} = d, currency) when is_binary(currency) do
    scale = if currency in @zero_decimal_currencies, do: 0, else: 2
    d |> Decimal.round(scale) |> Decimal.to_string(:normal)
  end

  defp format_quantity(nil), do: nil

  defp format_quantity(d) do
    if Decimal.equal?(d, Decimal.round(d, 0)) do
      d |> Decimal.round(0) |> Decimal.to_integer()
    else
      Decimal.to_float(d)
    end
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
