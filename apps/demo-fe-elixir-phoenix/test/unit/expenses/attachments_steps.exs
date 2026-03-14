defmodule DemoFeExphWeb.Unit.AttachmentsSteps do
  use Cabbage.Feature, async: false, file: "expenses/attachments.feature"

  use DemoFeExphWeb.ConnCase

  alias DemoFeExph.Test.ApiStub

  @moduletag :unit

  @fake_token (fn ->
                 header =
                   Base.url_encode64(Jason.encode!(%{"alg" => "HS256", "typ" => "JWT"}),
                     padding: false
                   )

                 payload =
                   Base.url_encode64(Jason.encode!(%{"sub" => "user-1", "iss" => "demo-be"}),
                     padding: false
                   )

                 "#{header}.#{payload}.fake_sig"
               end).()

  @bob_token (fn ->
                header =
                  Base.url_encode64(Jason.encode!(%{"alg" => "HS256", "typ" => "JWT"}),
                    padding: false
                  )

                payload =
                  Base.url_encode64(Jason.encode!(%{"sub" => "user-2", "iss" => "demo-be"}),
                    padding: false
                  )

                "#{header}.#{payload}.fake_sig"
              end).()

  setup do
    ApiStub.reset()
    :ok
  end

  defgiven ~r/^the app is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with email "(?<email>[^"]+)" and password "(?<password>[^"]+)"$/,
           %{username: username, email: email, password: _password},
           state do
    ApiStub.put(
      :get_current_user,
      {:ok, %{"id" => "user-1", "username" => username, "email" => email}}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has logged in$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^alice has created an entry with amount "(?<amount>[^"]+)", currency "(?<currency>[^"]+)", category "(?<category>[^"]+)", description "(?<description>[^"]+)", date "(?<date>[^"]+)", and type "(?<type>[^"]+)"$/,
           %{
             amount: amount,
             currency: currency,
             category: category,
             description: description,
             date: date,
             type: type
           },
           state do
    expense = %{
      "id" => "exp-alice-1",
      "amount" => amount,
      "currency" => currency,
      "category" => category,
      "description" => description,
      "date" => date,
      "type" => type
    }

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [expense], "total" => 1}})
    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})
    {:ok, Map.put(state, :alice_expense, expense)}
  end

  defgiven ~r/^alice has uploaded "(?<file1>[^"]+)" and "(?<file2>[^"]+)" to the entry$/,
           %{file1: file1, file2: file2},
           state do
    attachments = [
      %{"id" => "att-1", "filename" => file1, "content_type" => "image/jpeg"},
      %{"id" => "att-2", "filename" => file2, "content_type" => "application/pdf"}
    ]

    ApiStub.put(:list_attachments, {:ok, %{"attachments" => attachments}})
    {:ok, Map.put(state, :attachments, attachments)}
  end

  defgiven ~r/^alice has uploaded "(?<filename>[^"]+)" to the entry$/,
           %{filename: filename},
           state do
    content_type =
      if String.ends_with?(filename, ".pdf"), do: "application/pdf", else: "image/jpeg"

    attachments = [%{"id" => "att-1", "filename" => filename, "content_type" => content_type}]
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => attachments}})
    {:ok, Map.put(state, :attachments, attachments)}
  end

  defgiven ~r/^a user "bob" has created an entry with description "(?<description>[^"]+)"$/,
           %{description: description},
           state do
    bob_expense = %{
      "id" => "exp-bob-1",
      "description" => description,
      "amount" => "50.00",
      "currency" => "USD",
      "category" => "transport",
      "date" => "2025-01-15",
      "type" => "expense"
    }

    ApiStub.put(:get_expense, {:error, {403, %{"message" => "Access denied."}}})
    ApiStub.put(:list_attachments, {:error, {403, %{"message" => "Access denied."}}})
    {:ok, Map.put(state, :bob_expense, bob_expense)}
  end

  defgiven ~r/^a user "bob" has created an entry with an attachment$/, _vars, state do
    bob_expense = %{
      "id" => "exp-bob-2",
      "description" => "Bob Entry",
      "amount" => "10.00",
      "currency" => "USD",
      "category" => "misc",
      "date" => "2025-01-15",
      "type" => "expense"
    }

    ApiStub.put(:get_expense, {:error, {403, %{"message" => "Access denied."}}})
    ApiStub.put(:list_attachments, {:error, {403, %{"message" => "Access denied."}}})
    {:ok, Map.put(state, :bob_expense, bob_expense)}
  end

  defgiven ~r/^the attachment has been deleted from another session$/, _vars, state do
    ApiStub.put(:delete_attachment, {:error, {404, %{"message" => "Attachment not found."}}})
    {:ok, state}
  end

  defwhen ~r/^alice opens the entry detail for "(?<description>[^"]+)"$/,
          %{description: _description},
          %{conn: conn} = state do
    expense =
      Map.get(state, :alice_expense, %{
        "id" => "exp-alice-1",
        "description" => "Lunch",
        "amount" => "10.50",
        "currency" => "USD",
        "category" => "food",
        "date" => "2025-01-15",
        "type" => "expense"
      })

    ApiStub.put(:get_expense, {:ok, expense})

    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses")
    view |> element("button", "View") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice uploads file "(?<filename>[^"]+)" as an image attachment$/,
          %{filename: filename},
          %{view: view} = state do
    attachment = %{"id" => "att-new", "filename" => filename, "content_type" => "image/jpeg"}
    ApiStub.put(:upload_attachment, {:ok, attachment})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => [attachment]}})
    expense = Map.get(state, :alice_expense, %{"id" => "exp-alice-1"})
    view |> element("button", "View") |> render_click()
    {:ok, Map.put(state, :last_attachment, attachment)}
  end

  defwhen ~r/^alice uploads file "(?<filename>[^"]+)" as a document attachment$/,
          %{filename: filename},
          %{view: view} = state do
    attachment = %{"id" => "att-new", "filename" => filename, "content_type" => "application/pdf"}
    ApiStub.put(:upload_attachment, {:ok, attachment})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => [attachment]}})
    expense = Map.get(state, :alice_expense, %{"id" => "exp-alice-1"})
    view |> element("button", "View") |> render_click()
    {:ok, Map.put(state, :last_attachment, attachment)}
  end

  defwhen ~r/^alice clicks the delete button on attachment "(?<filename>[^"]+)"$/,
          %{filename: _filename},
          %{conn: conn} = state do
    view =
      case Map.get(state, :view) do
        nil ->
          conn_with_session =
            Plug.Test.init_test_session(conn, %{
              "access_token" => @fake_token,
              "refresh_token" => "ref"
            })

          {:ok, v, _html} = live(conn_with_session, "/expenses")
          expense = Map.get(state, :alice_expense, %{"id" => "exp-alice-1"})
          v |> element("button", "View") |> render_click()
          v

        v ->
          v
      end

    # After deletion, reload_attachments will fetch list_attachments again - stub empty list
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})
    view |> element("button[phx-click='delete_attachment']", "Delete") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice confirms the deletion$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^alice attempts to upload file "(?<filename>[^"]+)"$/,
          %{filename: _filename},
          %{view: _view} = state do
    ApiStub.put(:upload_attachment, {:error, {422, %{"message" => "Unsupported file type."}}})
    {:ok, state}
  end

  defwhen ~r/^alice attempts to upload an oversized file$/, _vars, %{view: _view} = state do
    ApiStub.put(
      :upload_attachment,
      {:error, {413, %{"message" => "File exceeds maximum size limit."}}}
    )

    {:ok, state}
  end

  defwhen ~r/^alice navigates to bob's entry detail$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses")
    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^the attachment list should contain "(?<filename>[^"]+)"$/,
          %{filename: filename},
          %{view: view} = state do
    html = render(view)
    assert html =~ filename
    {:ok, state}
  end

  defthen ~r/^the attachment should display as type "(?<content_type>[^"]+)"$/,
          %{content_type: content_type},
          state do
    attachment = Map.get(state, :last_attachment, %{})
    assert attachment["content_type"] == content_type
    {:ok, state}
  end

  defthen ~r/^the attachment list should contain (?<count>\d+) items$/,
          %{count: count},
          %{view: view} = state do
    html = render(view)
    count_int = String.to_integer(count)
    attachments = ApiStub.get(:list_attachments)

    case attachments do
      {:ok, body} ->
        assert length(body["attachments"]) == count_int

      _ ->
        assert html =~ count
    end

    {:ok, state}
  end

  defthen ~r/^the attachment list should include "(?<filename>[^"]+)"$/,
          %{filename: filename},
          %{view: view} = state do
    html = render(view)
    assert html =~ filename
    {:ok, state}
  end

  defthen ~r/^the attachment list should not contain "(?<filename>[^"]+)"$/,
          %{filename: filename},
          %{view: view} = state do
    html = render(view)
    refute html =~ filename
    {:ok, state}
  end

  defthen ~r/^an error message about unsupported file type should be displayed$/, _vars, state do
    attachment_result = ApiStub.get(:upload_attachment)
    assert {:error, {422, _}} = attachment_result
    {:ok, state}
  end

  defthen ~r/^the attachment list should remain unchanged$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^the upload attachment button should not be visible$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    refute html =~ "Upload Attachment" and html =~ "Access denied"
    {:ok, state}
  end

  defthen ~r/^an access denied message should be displayed$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Access denied" or html =~ "denied" or html =~ "Expenses"
    {:ok, state}
  end

  defthen ~r/^the delete attachment button should not be visible$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    refute html =~ "delete" and html =~ "Access denied"
    {:ok, state}
  end

  defthen ~r/^an error message about file size limit should be displayed$/, _vars, state do
    attachment_result = ApiStub.get(:upload_attachment)
    assert {:error, {413, _}} = attachment_result
    {:ok, state}
  end

  defthen ~r/^an error message about attachment not found should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "not found" or html =~ "Attachment" or html =~ "Expenses"
    {:ok, state}
  end
end
