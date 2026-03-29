defmodule AADemoBeExphWeb.ReportController do
  use AADemoBeExphWeb, :controller

  alias GeneratedSchemas.CategoryBreakdown
  alias GeneratedSchemas.PLReport
  alias Guardian.Plug, as: GuardianPlug

  defp expense_ctx,
    do:
      Application.get_env(
        :a_demo_be_exph,
        :expense_module,
        ADemoBeExph.Expense.ExpenseContext
      )

  def pl(conn, params) do
    user = GuardianPlug.current_resource(conn)

    from_str = Map.get(params, "startDate", Map.get(params, "from", ""))
    to_str = Map.get(params, "endDate", Map.get(params, "to", ""))
    currency = Map.get(params, "currency", "")

    with {:ok, from_date} <- parse_date(from_str),
         {:ok, to_date} <- parse_date(to_str) do
      report = expense_ctx().pl_report(user.id, from_date, to_date, currency)

      income_breakdown =
        report.income_breakdown
        |> Enum.map(fn {k, v} ->
          %{category: k, type: "income", total: format_amount(v, currency)}
        end)

      expense_breakdown =
        report.expense_breakdown
        |> Enum.map(fn {k, v} ->
          %{category: k, type: "expense", total: format_amount(v, currency)}
        end)

      _ = %PLReport{
        start_date: Date.to_iso8601(from_date),
        end_date: Date.to_iso8601(to_date),
        currency: currency,
        total_income: format_amount(report.income_total, currency),
        total_expense: format_amount(report.expense_total, currency),
        net: format_amount(report.net, currency),
        income_breakdown:
          Enum.map(income_breakdown, fn b ->
            %CategoryBreakdown{category: b.category, type: b.type, total: b.total}
          end),
        expense_breakdown:
          Enum.map(expense_breakdown, fn b ->
            %CategoryBreakdown{category: b.category, type: b.type, total: b.total}
          end)
      }

      json(conn, %{
        totalIncome: format_amount(report.income_total, currency),
        totalExpense: format_amount(report.expense_total, currency),
        net: format_amount(report.net, currency),
        incomeBreakdown: income_breakdown,
        expenseBreakdown: expense_breakdown,
        currency: currency
      })
    else
      {:error, :invalid_date} ->
        conn
        |> put_status(:bad_request)
        |> json(%{message: "Invalid date format. Use YYYY-MM-DD."})
    end
  end

  # Currency decimal precision: IDR uses 0 decimals, all others use 2.
  @zero_decimal_currencies ~w(IDR)

  defp format_amount(%Decimal{} = d, currency) when is_binary(currency) do
    scale = if currency in @zero_decimal_currencies, do: 0, else: 2
    d |> Decimal.round(scale) |> Decimal.to_string(:normal)
  end

  defp parse_date(""), do: {:error, :invalid_date}

  defp parse_date(str) do
    case Date.from_iso8601(str) do
      {:ok, date} -> {:ok, date}
      {:error, _} -> {:error, :invalid_date}
    end
  end
end
