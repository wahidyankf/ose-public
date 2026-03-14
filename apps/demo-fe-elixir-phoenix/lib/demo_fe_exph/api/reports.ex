defmodule DemoFeExph.Api.Reports do
  @moduledoc "Reporting API calls: profit and loss report."

  alias DemoFeExph.Api.Client

  @doc "Fetches the P&L report for the given date range and currency."
  def get_pl_report(token, start_date, end_date, currency \\ "USD") do
    query =
      URI.encode_query(%{
        start_date: start_date,
        end_date: end_date,
        currency: currency
      })

    Client.get("/api/v1/reports/pl?#{query}", token)
  end
end
