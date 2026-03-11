defmodule DemoBeExphWeb.Integration.AttachmentsSteps do
  use Cabbage.Feature, async: false, file: "expenses/attachments.feature"

  use DemoBeExphWeb.ConnCase

  alias DemoBeExph.Integration.Helpers

  @moduletag :integration

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with email "(?<email>[^"]+)" and password "(?<password>[^"]+)"$/,
           %{username: username, email: email, password: password},
           state do
    user = Helpers.register_user!(username, email, password)
    {:ok, Map.put(state, username, user)}
  end

  defgiven ~r/^"alice" has logged in and stored the access token$/,
           _vars,
           %{"alice" => user} = state do
    {access_token, _} = Helpers.login_user!(user)
    {:ok, Map.put(state, :access_token, access_token)}
  end

  defgiven ~r/^alice has created an entry with body \{ (?<body>.+) \}$/,
           %{body: body_content},
           %{access_token: access_token} = state do
    body = Jason.encode!(Jason.decode!("{" <> body_content <> "}"))

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/expenses", body)

    assert conn.status == 201
    expense_body = Jason.decode!(conn.resp_body)
    {:ok, Map.put(state, :expense_id, expense_body["id"])}
  end

  defgiven ~r/^bob has created an entry with body \{ (?<body>.+) \}$/,
           %{body: body_content},
           %{"bob" => bob_user} = state do
    {bob_token, _} = Helpers.login_user!(bob_user)
    body = Jason.encode!(Jason.decode!("{" <> body_content <> "}"))

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(bob_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/expenses", body)

    assert conn.status == 201
    expense_body = Jason.decode!(conn.resp_body)
    {:ok, Map.put(state, :bob_expense_id, expense_body["id"])}
  end

  defgiven ~r/^alice has uploaded file "(?<filename>[^"]+)" with content type "(?<content_type>[^"]+)" to the entry$/,
           %{filename: filename, content_type: content_type},
           %{access_token: access_token, expense_id: expense_id} = state do
    conn = upload_file(build_conn(), access_token, expense_id, filename, content_type)
    assert conn.status == 201
    att_body = Jason.decode!(conn.resp_body)
    attachments = Map.get(state, :uploaded_attachment_ids, [])
    {:ok, Map.put(state, :uploaded_attachment_ids, attachments ++ [att_body["id"]])}
  end

  defwhen ~r/^alice uploads file "(?<filename>[^"]+)" with content type "(?<content_type>[^"]+)" to POST \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
          %{filename: filename, content_type: content_type},
          %{access_token: access_token, expense_id: expense_id} = state do
    conn = upload_file(build_conn(), access_token, expense_id, filename, content_type)
    att_body = if conn.status == 201, do: Jason.decode!(conn.resp_body), else: %{}
    {:ok, Map.merge(state, %{conn: conn, last_attachment_id: att_body["id"]})}
  end

  defwhen ~r/^alice uploads file "(?<filename>[^"]+)" with content type "(?<content_type>[^"]+)" to POST \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments$/,
          %{filename: filename, content_type: content_type},
          %{access_token: access_token, bob_expense_id: bob_expense_id} = state do
    conn = upload_file(build_conn(), access_token, bob_expense_id, filename, content_type)
    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments$/,
          _vars,
          %{access_token: access_token, bob_expense_id: bob_expense_id} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/expenses/#{bob_expense_id}/attachments")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends DELETE \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments\/\{attachmentId\}$/,
          _vars,
          %{
            access_token: access_token,
            bob_expense_id: bob_expense_id,
            uploaded_attachment_ids: [att_id | _]
          } = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> delete("/api/v1/expenses/#{bob_expense_id}/attachments/#{att_id}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends DELETE \/api\/v1\/expenses\/\{expenseId\}\/attachments\/\{randomAttachmentId\}$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    random_id = :rand.uniform(999_999_999)

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> delete("/api/v1/expenses/#{expense_id}/attachments/#{random_id}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice uploads an oversized file to POST \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    # Create a file larger than max_size_bytes (5MB)
    large_data = :crypto.strong_rand_bytes(6 * 1024 * 1024)
    tmp_path = System.tmp_dir!() <> "/oversized_test_#{System.unique_integer()}.jpg"
    File.write!(tmp_path, large_data)

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> post("/api/v1/expenses/#{expense_id}/attachments", %{
        "file" => %Plug.Upload{
          path: tmp_path,
          filename: "oversized.jpg",
          content_type: "image/jpeg"
        }
      })

    File.rm(tmp_path)
    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/expenses/#{expense_id}/attachments")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends DELETE \/api\/v1\/expenses\/\{expenseId\}\/attachments\/\{attachmentId\}$/,
          _vars,
          %{
            access_token: access_token,
            expense_id: expense_id,
            uploaded_attachment_ids: [att_id | _]
          } = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> delete("/api/v1/expenses/#{expense_id}/attachments/#{att_id}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{conn: conn} = state do
    assert conn.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a non-null "(?<field>[^"]+)" field$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, field)
    assert body[field] != nil
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body[field] == value
    {:ok, state}
  end

  defthen ~r/^the response body should contain (?<count>\d+) items in the "(?<field>[^"]+)" array$/,
          %{count: count, field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert length(body[field]) == String.to_integer(count)
    {:ok, state}
  end

  defthen ~r/^the response body should contain an attachment with "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    attachments = body["attachments"]
    assert Enum.any?(attachments, fn a -> a[field] == value end)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a validation error for "(?<field>[^"]+)"$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, "errors")
    errors = body["errors"]
    assert Map.has_key?(errors, field)
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about file size$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Ss]ize|[Ll]arge|[Mm]aximum/i
    {:ok, state}
  end

  # Helper to upload a file in multipart form
  defp upload_file(conn, access_token, expense_id, filename, content_type) do
    # Create a small temp file with test content
    ext = filename |> Path.extname()
    tmp_path = System.tmp_dir!() <> "/test_upload_#{System.unique_integer()}#{ext}"
    File.write!(tmp_path, "test content for #{filename}")

    result =
      conn
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> post("/api/v1/expenses/#{expense_id}/attachments", %{
        "file" => %Plug.Upload{
          path: tmp_path,
          filename: filename,
          content_type: content_type
        }
      })

    File.rm(tmp_path)
    result
  end
end
