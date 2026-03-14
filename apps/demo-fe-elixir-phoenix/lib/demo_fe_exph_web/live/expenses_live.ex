defmodule DemoFeExphWeb.ExpensesLive do
  @moduledoc "LiveView for expense list and CRUD management, including attachments."

  use DemoFeExphWeb, :live_view

  @default_page 1
  @default_size 20

  @impl true
  def mount(_params, session, socket) do
    token = session["access_token"]
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.list_expenses(token, @default_page, @default_size) do
      {:ok, body} ->
        {:ok,
         assign(socket,
           token: token,
           expenses: body["expenses"] || [],
           total: body["total"] || 0,
           page: @default_page,
           size: @default_size,
           error: nil,
           selected: nil,
           editing: false,
           attachments: [],
           attachment_error: nil,
           confirm_delete_attachment: nil,
           reset_token: nil
         )}

      {:error, {401, _body}} ->
        {:ok, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:ok,
         assign(socket,
           token: token,
           expenses: [],
           total: 0,
           page: @default_page,
           size: @default_size,
           error: "Failed to load expenses.",
           selected: nil,
           editing: false,
           attachments: [],
           attachment_error: nil,
           confirm_delete_attachment: nil,
           reset_token: nil
         )}
    end
  end

  @impl true
  def handle_event("create_expense", params, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.create_expense(socket.assigns.token, params) do
      {:ok, _body} ->
        reload_expenses(socket)

      {:error, {_status, body}} ->
        message = body["message"] || format_errors(body["errors"]) || "Validation failed."
        {:noreply, assign(socket, error: message)}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to create expense.")}
    end
  end

  def handle_event("delete_expense", %{"id" => id}, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.delete_expense(socket.assigns.token, id) do
      {:ok, _body} ->
        reload_expenses(socket)

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to delete expense.")}
    end
  end

  def handle_event("confirm_delete_expense", %{"id" => id}, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.delete_expense(socket.assigns.token, id) do
      {:ok, _body} ->
        reload_expenses(socket)

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to delete expense.")}
    end
  end

  def handle_event("select_expense", %{"id" => id}, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()
    attachments_api = DemoFeExph.Api.attachments_module()

    case expenses_api.get_expense(socket.assigns.token, id) do
      {:ok, expense} ->
        attachments =
          case attachments_api.list_attachments(socket.assigns.token, id) do
            {:ok, body} -> body["attachments"] || []
            {:error, _} -> []
          end

        {:noreply,
         assign(socket,
           selected: expense,
           error: nil,
           editing: false,
           attachments: attachments,
           attachment_error: nil
         )}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, {403, _body}} ->
        {:noreply, assign(socket, error: "Access denied.", selected: nil)}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to load expense.")}
    end
  end

  def handle_event("edit_expense", %{"id" => id}, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.get_expense(socket.assigns.token, id) do
      {:ok, expense} ->
        {:noreply, assign(socket, selected: expense, editing: true, error: nil)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to load expense.")}
    end
  end

  def handle_event("update_expense", params, socket) do
    expenses_api = DemoFeExph.Api.expenses_module()
    id = get_in(params, ["id"]) || socket.assigns.selected["id"]

    case expenses_api.update_expense(socket.assigns.token, id, params) do
      {:ok, expense} ->
        {:noreply, assign(socket, selected: expense, editing: false, error: nil)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to update expense.")}
    end
  end

  def handle_event("delete_attachment", %{"id" => attachment_id}, socket) do
    attachments_api = DemoFeExph.Api.attachments_module()
    expense_id = socket.assigns.selected["id"]

    case attachments_api.delete_attachment(socket.assigns.token, expense_id, attachment_id) do
      {:ok, _body} ->
        reload_attachments(socket)

      {:error, {404, _body}} ->
        {:noreply, assign(socket, attachment_error: "Attachment not found.")}

      {:error, _reason} ->
        {:noreply, assign(socket, attachment_error: "Failed to delete attachment.")}
    end
  end

  def handle_event("confirm_delete_attachment", %{"id" => attachment_id}, socket) do
    attachments_api = DemoFeExph.Api.attachments_module()
    expense_id = socket.assigns.selected["id"]

    case attachments_api.delete_attachment(socket.assigns.token, expense_id, attachment_id) do
      {:ok, _body} ->
        reload_attachments(socket)

      {:error, {404, _body}} ->
        {:noreply, assign(socket, attachment_error: "Attachment not found.")}

      {:error, _reason} ->
        {:noreply, assign(socket, attachment_error: "Failed to delete attachment.")}
    end
  end

  defp reload_expenses(socket) do
    expenses_api = DemoFeExph.Api.expenses_module()

    case expenses_api.list_expenses(
           socket.assigns.token,
           socket.assigns.page,
           socket.assigns.size
         ) do
      {:ok, body} ->
        {:noreply,
         assign(socket,
           expenses: body["expenses"] || [],
           total: body["total"] || 0,
           error: nil,
           selected: nil
         )}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to reload expenses.")}
    end
  end

  defp reload_attachments(socket) do
    attachments_api = DemoFeExph.Api.attachments_module()
    expense_id = socket.assigns.selected["id"]

    case attachments_api.list_attachments(socket.assigns.token, expense_id) do
      {:ok, body} ->
        {:noreply, assign(socket, attachments: body["attachments"] || [], attachment_error: nil)}

      {:error, _reason} ->
        {:noreply, assign(socket, attachment_error: "Failed to reload attachments.")}
    end
  end

  defp format_errors(nil), do: nil

  defp format_errors(errors) when is_map(errors),
    do: Enum.map_join(errors, ", ", fn {k, v} -> "#{k}: #{v}" end)

  defp format_errors(errors), do: inspect(errors)

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Expenses</h1>
      <%= if @error do %>
        <p style="color: red;" role="alert">{@error}</p>
      <% end %>
      <form phx-submit="create_expense">
        <input type="number" name="amount" placeholder="Amount" step="0.01" />
        <input type="text" name="currency" placeholder="Currency" />
        <input type="text" name="category" placeholder="Category" />
        <input type="text" name="description" placeholder="Description" />
        <input type="date" name="date" placeholder="Date" />
        <select name="type">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input type="number" name="quantity" placeholder="Quantity (optional)" step="0.01" />
        <input type="text" name="unit" placeholder="Unit (optional)" />
        <button type="submit">Add Entry</button>
      </form>
      <p>Total: {@total}</p>
      <nav>
        <span>Page {@page}</span>
      </nav>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <%= for expense <- @expenses do %>
            <tr>
              <td>{expense["date"]}</td>
              <td>{expense["description"]}</td>
              <td>{expense["category"]}</td>
              <td>{expense["amount"]}</td>
              <td>{expense["currency"]}</td>
              <td>
                <button phx-click="select_expense" phx-value-id={expense["id"]}>View</button>
                <button phx-click="edit_expense" phx-value-id={expense["id"]}>Edit</button>
                <button phx-click="delete_expense" phx-value-id={expense["id"]}>Delete</button>
              </td>
            </tr>
          <% end %>
        </tbody>
      </table>
      <%= if @selected && !@editing do %>
        <div id="expense-detail">
          <h2>Entry Detail</h2>
          <p>Description: {@selected["description"]}</p>
          <p>Amount: {@selected["amount"]}</p>
          <p>Currency: {@selected["currency"]}</p>
          <p>Category: {@selected["category"]}</p>
          <p>Date: {@selected["date"]}</p>
          <p>Type: {@selected["type"]}</p>
          <%= if @selected["quantity"] do %>
            <p>Quantity: {@selected["quantity"]}</p>
          <% end %>
          <%= if @selected["unit"] do %>
            <p>Unit: {@selected["unit"]}</p>
          <% end %>
          <h3>Attachments</h3>
          <%= if @attachment_error do %>
            <p style="color: red;" role="alert">{@attachment_error}</p>
          <% end %>
          <div id="attachment-upload">
            <button id="upload-attachment-button">Upload Attachment</button>
            <input type="file" id="attachment-file-input" />
          </div>
          <ul id="attachment-list">
            <%= for attachment <- @attachments do %>
              <li id={"attachment-#{attachment["id"]}"}>
                {attachment["filename"]} — {attachment["content_type"]}
                <button phx-click="delete_attachment" phx-value-id={attachment["id"]}>Delete</button>
              </li>
            <% end %>
          </ul>
        </div>
      <% end %>
      <%= if @selected && @editing do %>
        <div id="expense-edit">
          <h2>Edit Expense</h2>
          <form phx-submit="update_expense">
            <input type="hidden" name="id" value={@selected["id"]} />
            <input type="number" name="amount" value={@selected["amount"]} step="0.01" />
            <input type="text" name="description" value={@selected["description"]} />
            <button type="submit">Save</button>
          </form>
        </div>
      <% end %>
    </div>
    """
  end
end
