defmodule AADemoBeExphWeb.Integration.AttachmentsSteps do
  use Cabbage.Feature, async: false, file: "expenses/attachments.feature"

  use ADemoBeExph.DataCaseIntegration

  alias ADemoBeExph.Integration.Helpers
  alias ADemoBeExph.Integration.ServiceLayer

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
    params = Jason.decode!("{" <> body_content <> "}")
    response = ServiceLayer.create_expense(access_token, params)
    assert response.status == 201
    {:ok, Map.put(state, :expense_id, response.body["id"])}
  end

  defgiven ~r/^bob has created an entry with body \{ (?<body>.+) \}$/,
           %{body: body_content},
           %{"bob" => bob_user} = state do
    {bob_token, _} = Helpers.login_user!(bob_user)
    params = Jason.decode!("{" <> body_content <> "}")
    response = ServiceLayer.create_expense(bob_token, params)
    assert response.status == 201
    {:ok, Map.put(state, :bob_expense_id, response.body["id"])}
  end

  defgiven ~r/^alice has uploaded file "(?<filename>[^"]+)" with content type "(?<content_type>[^"]+)" to the entry$/,
           %{filename: filename, content_type: content_type},
           %{access_token: access_token, expense_id: expense_id} = state do
    response = upload_file(access_token, expense_id, filename, content_type)
    assert response.status == 201
    attachments = Map.get(state, :uploaded_attachment_ids, [])
    {:ok, Map.put(state, :uploaded_attachment_ids, attachments ++ [response.body["id"]])}
  end

  defwhen ~r/^alice uploads file "(?<filename>[^"]+)" with content type "(?<content_type>[^"]+)" to POST \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
          %{filename: filename, content_type: content_type},
          %{access_token: access_token, expense_id: expense_id} = state do
    response = upload_file(access_token, expense_id, filename, content_type)

    last_attachment_id =
      if response.status == 201, do: response.body["id"], else: nil

    {:ok, Map.merge(state, %{response: response, last_attachment_id: last_attachment_id})}
  end

  defwhen ~r/^alice uploads file "(?<filename>[^"]+)" with content type "(?<content_type>[^"]+)" to POST \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments$/,
          %{filename: filename, content_type: content_type},
          %{access_token: access_token, bob_expense_id: bob_expense_id} = state do
    response = upload_file(access_token, bob_expense_id, filename, content_type)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments$/,
          _vars,
          %{access_token: access_token, bob_expense_id: bob_expense_id} = state do
    response = ServiceLayer.list_attachments(access_token, bob_expense_id)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends DELETE \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments\/\{attachmentId\}$/,
          _vars,
          %{
            access_token: access_token,
            bob_expense_id: bob_expense_id,
            uploaded_attachment_ids: [att_id | _]
          } = state do
    response = ServiceLayer.delete_attachment(access_token, bob_expense_id, att_id)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends DELETE \/api\/v1\/expenses\/\{expenseId\}\/attachments\/\{randomAttachmentId\}$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    random_id = Ecto.UUID.generate()
    response = ServiceLayer.delete_attachment(access_token, expense_id, random_id)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice uploads an oversized file to POST \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    large_data = :crypto.strong_rand_bytes(6 * 1024 * 1024)
    tmp_path = System.tmp_dir!() <> "/oversized_test_#{System.unique_integer()}.jpg"
    File.write!(tmp_path, large_data)

    response =
      ServiceLayer.upload_attachment(
        access_token,
        expense_id,
        "oversized.jpg",
        "image/jpeg",
        tmp_path
      )

    File.rm(tmp_path)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    response = ServiceLayer.list_attachments(access_token, expense_id)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends DELETE \/api\/v1\/expenses\/\{expenseId\}\/attachments\/\{attachmentId\}$/,
          _vars,
          %{
            access_token: access_token,
            expense_id: expense_id,
            uploaded_attachment_ids: [att_id | _]
          } = state do
    response = ServiceLayer.delete_attachment(access_token, expense_id, att_id)
    {:ok, Map.put(state, :response, response)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{response: response} = state do
    assert response.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a non-null "(?<field>[^"]+)" field$/,
          %{field: field},
          %{response: response} = state do
    assert Map.has_key?(response.body, field)
    assert response.body[field] != nil
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{response: response} = state do
    assert response.body[field] == value
    {:ok, state}
  end

  defthen ~r/^the response body should contain (?<count>\d+) items in the "(?<field>[^"]+)" array$/,
          %{count: count, field: field},
          %{response: response} = state do
    assert length(response.body[field]) == String.to_integer(count)
    {:ok, state}
  end

  defthen ~r/^the response body should contain an attachment with "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{response: response} = state do
    attachments = response.body["attachments"]
    assert Enum.any?(attachments, fn a -> a[field] == value end)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a validation error for "(?<field>[^"]+)"$/,
          %{field: field},
          %{response: response} = state do
    assert Map.has_key?(response.body, "errors")
    errors = response.body["errors"]
    assert Map.has_key?(errors, field)
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about file size$/,
          _vars,
          %{response: response} = state do
    assert response.body["message"] =~ ~r/[Ss]ize|[Ll]arge|[Mm]aximum/i
    {:ok, state}
  end

  # Helper to create a temp file and upload it via the service layer
  defp upload_file(access_token, expense_id, filename, content_type) do
    ext = filename |> Path.extname()
    tmp_path = System.tmp_dir!() <> "/test_upload_#{System.unique_integer()}#{ext}"
    File.write!(tmp_path, "test content for #{filename}")

    response =
      ServiceLayer.upload_attachment(
        access_token,
        expense_id,
        filename,
        content_type,
        tmp_path
      )

    File.rm(tmp_path)
    response
  end
end
