defmodule DemoFeExph.Api.Attachments do
  @moduledoc "Expense attachment API calls: list, upload, and delete."

  alias DemoFeExph.Api.Client

  @doc "Lists all attachments for a given expense."
  def list_attachments(token, expense_id) do
    Client.get("/api/v1/expenses/#{expense_id}/attachments", token)
  end

  @doc "Uploads a file attachment to the given expense."
  def upload_attachment(token, expense_id, file_path, content_type) do
    headers = Client.auth_headers(token)
    url = "#{Client.backend_url()}/api/v1/expenses/#{expense_id}/attachments"

    multipart =
      {:multipart,
       [
         {:file, file_path,
          {"form-data", [{"name", "file"}, {"filename", Path.basename(file_path)}]},
          [{"Content-Type", content_type}]}
       ]}

    case Req.post(url, body: multipart, headers: headers) do
      {:ok, %{status: status, body: body}} when status in 200..299 -> {:ok, body}
      {:ok, %{status: status, body: body}} -> {:error, {status, body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Deletes an attachment from the given expense."
  def delete_attachment(token, expense_id, attachment_id) do
    Client.delete("/api/v1/expenses/#{expense_id}/attachments/#{attachment_id}", token)
  end
end
