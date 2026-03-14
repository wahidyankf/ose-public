defmodule DemoFeExphWeb.SummaryLive do
  @moduledoc "LiveView for expense summary and P&L report."

  use DemoFeExphWeb, :live_view

  @default_currency "USD"

  @impl true
  def mount(_params, session, socket) do
    token = session["access_token"]
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.get_expense_summary(token, @default_currency) do
      {:ok, summary} ->
        {:ok,
         assign(socket,
           token: token,
           summary: summary,
           pl_report: nil,
           currency: @default_currency,
           error: nil
         )}

      {:error, {401, _body}} ->
        {:ok, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:ok,
         assign(socket,
           token: token,
           summary: nil,
           pl_report: nil,
           currency: @default_currency,
           error: "Failed to load expense summary."
         )}
    end
  end

  @impl true
  def handle_event(
        "load_pl_report",
        %{"start_date" => start_date, "end_date" => end_date},
        socket
      ) do
    reports_api = DemoFeExph.Api.reports_module()

    case reports_api.get_pl_report(
           socket.assigns.token,
           start_date,
           end_date,
           socket.assigns.currency
         ) do
      {:ok, report} ->
        {:noreply, assign(socket, pl_report: report, error: nil)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to load P&L report.")}
    end
  end

  def handle_event("change_currency", %{"currency" => currency}, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.get_expense_summary(socket.assigns.token, currency) do
      {:ok, summary} ->
        {:noreply, assign(socket, summary: summary, currency: currency, error: nil)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to reload summary.")}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Expense Summary</h1>
      <%= if @error do %>
        <p style="color: red;">{@error}</p>
      <% end %>
      <form phx-submit="change_currency">
        <select name="currency">
          <option value="USD" selected={@currency == "USD"}>USD</option>
          <option value="EUR" selected={@currency == "EUR"}>EUR</option>
          <option value="IDR" selected={@currency == "IDR"}>IDR</option>
        </select>
        <button type="submit">Apply</button>
      </form>
      <%= if @summary do %>
        <p>Total: {@summary["total"]} {@currency}</p>
        <%= for item <- (@summary["by_currency"] || []) do %>
          <p>Currency: {item["currency"]} Total: {item["total"]}</p>
        <% end %>
      <% end %>
      <h2>P&amp;L Report</h2>
      <form phx-submit="load_pl_report">
        <input type="date" name="start_date" />
        <input type="date" name="end_date" />
        <button type="submit">Load Report</button>
      </form>
      <%= if @pl_report do %>
        <div id="pl-report">
          <p>Income total: {@pl_report["income_total"]}</p>
          <p>Expense total: {@pl_report["expense_total"]}</p>
          <p>Net: {@pl_report["net"]}</p>
          <%= for item <- (@pl_report["income_by_category"] || []) do %>
            <p>Income category: {item["category"]} amount: {item["total"]}</p>
          <% end %>
          <%= for item <- (@pl_report["expense_by_category"] || []) do %>
            <p>Expense category: {item["category"]} amount: {item["total"]}</p>
          <% end %>
        </div>
      <% end %>
    </div>
    """
  end
end
