defmodule AADemoBeExphWeb.AttachmentController do
  use AADemoBeExphWeb, :controller

  alias ADemoBeExph.Attachment.Attachment
  alias GeneratedSchemas.Attachment, as: AttachmentSchema
  alias Guardian.Plug, as: GuardianPlug

  @supported_content_types ~w(image/jpeg image/png application/pdf)
  @max_size_bytes Attachment.max_size_bytes()

  defp expense_ctx,
    do:
      Application.get_env(
        :a_demo_be_exph,
        :expense_module,
        ADemoBeExph.Expense.ExpenseContext
      )

  defp attachment_ctx,
    do:
      Application.get_env(
        :a_demo_be_exph,
        :attachment_module,
        ADemoBeExph.Attachment.AttachmentContext
      )

  def index(conn, %{"expense_id" => expense_id}) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().get_expense(user.id, expense_id) do
      nil ->
        conn |> put_status(:forbidden) |> json(%{message: "Expense not found or access denied"})

      _expense ->
        attachments = attachment_ctx().list_attachments(expense_id)
        json(conn, %{attachments: Enum.map(attachments, &attachment_json/1)})
    end
  end

  def create(conn, %{"expense_id" => expense_id} = params) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().get_expense(user.id, expense_id) do
      nil ->
        conn |> put_status(:forbidden) |> json(%{message: "Expense not found or access denied"})

      _expense ->
        upload_file(conn, expense_id, params)
    end
  end

  def show(conn, %{"expense_id" => expense_id, "att_id" => att_id}) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().get_expense(user.id, expense_id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{message: "Expense not found"})

      _expense ->
        show_attachment(conn, expense_id, att_id)
    end
  end

  def delete(conn, %{"expense_id" => expense_id, "att_id" => att_id}) do
    user = GuardianPlug.current_resource(conn)

    case expense_ctx().get_expense(user.id, expense_id) do
      nil ->
        conn |> put_status(:forbidden) |> json(%{message: "Expense not found or access denied"})

      _expense ->
        delete_attachment(conn, expense_id, att_id)
    end
  end

  defp show_attachment(conn, expense_id, att_id) do
    attachment = attachment_ctx().get_attachment(expense_id, att_id)

    if attachment do
      json(conn, attachment_json(attachment))
    else
      conn |> put_status(:not_found) |> json(%{message: "Attachment not found"})
    end
  end

  defp delete_attachment(conn, expense_id, att_id) do
    case attachment_ctx().delete_attachment(expense_id, att_id) do
      {:ok, _} -> conn |> put_status(:no_content) |> json(%{})
      _ -> conn |> put_status(:not_found) |> json(%{message: "Attachment not found"})
    end
  end

  defp upload_file(conn, expense_id, params) do
    file = Map.get(params, "file")

    cond do
      is_nil(file) ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: %{file: ["is required"]}})

      file.content_type not in @supported_content_types ->
        conn
        |> put_status(415)
        |> json(%{errors: %{file: ["content type not supported"]}})

      true ->
        file_data = File.read!(file.path)
        file_size = byte_size(file_data)
        store_file(conn, expense_id, file, file_data, file_size)
    end
  end

  defp store_file(conn, _expense_id, _file, _file_data, file_size)
       when file_size > @max_size_bytes do
    conn
    |> put_status(413)
    |> json(%{message: "File exceeds maximum allowed size"})
  end

  defp store_file(conn, expense_id, file, file_data, file_size) do
    attrs = %{
      "filename" => file.filename,
      "content_type" => file.content_type,
      "size" => file_size,
      "data" => file_data
    }

    case attachment_ctx().create_attachment(expense_id, attrs) do
      {:ok, attachment} ->
        conn
        |> put_status(:created)
        |> json(attachment_json(attachment))

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  defp attachment_json(attachment) do
    _ = %AttachmentSchema{
      id: to_string(attachment.id),
      filename: attachment.filename,
      content_type: attachment.content_type,
      size: attachment.size,
      created_at: to_string(attachment.created_at)
    }

    %{
      id: attachment.id,
      expense_id: attachment.expense_id,
      filename: attachment.filename,
      contentType: attachment.content_type,
      size: attachment.size,
      url: "/api/v1/expenses/#{attachment.expense_id}/attachments/#{attachment.id}",
      created_at: attachment.created_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
