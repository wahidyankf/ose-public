defmodule DemoBeExphWeb.AttachmentController do
  use DemoBeExphWeb, :controller

  alias DemoBeExph.Attachment.Attachment
  alias Guardian.Plug, as: GuardianPlug

  @supported_content_types ~w(image/jpeg image/png application/pdf)
  @max_size_bytes Attachment.max_size_bytes()

  defp expense_ctx,
    do:
      Application.get_env(
        :demo_be_exph,
        :expense_module,
        DemoBeExph.Expense.ExpenseContext
      )

  defp attachment_ctx,
    do:
      Application.get_env(
        :demo_be_exph,
        :attachment_module,
        DemoBeExph.Attachment.AttachmentContext
      )

  def index(conn, %{"expense_id" => expense_id}) do
    user = GuardianPlug.current_resource(conn)
    expense_id_int = String.to_integer(expense_id)

    case expense_ctx().get_expense(user.id, expense_id_int) do
      nil ->
        conn |> put_status(:forbidden) |> json(%{message: "Expense not found or access denied"})

      _expense ->
        attachments = attachment_ctx().list_attachments(expense_id_int)
        json(conn, %{attachments: Enum.map(attachments, &attachment_json/1)})
    end
  end

  def create(conn, %{"expense_id" => expense_id} = params) do
    user = GuardianPlug.current_resource(conn)
    expense_id_int = String.to_integer(expense_id)

    case expense_ctx().get_expense(user.id, expense_id_int) do
      nil ->
        conn |> put_status(:forbidden) |> json(%{message: "Expense not found or access denied"})

      _expense ->
        upload_file(conn, expense_id_int, params)
    end
  end

  def show(conn, %{"expense_id" => expense_id, "att_id" => att_id}) do
    user = GuardianPlug.current_resource(conn)
    expense_id_int = String.to_integer(expense_id)

    case expense_ctx().get_expense(user.id, expense_id_int) do
      nil ->
        conn |> put_status(:not_found) |> json(%{message: "Expense not found"})

      _expense ->
        case attachment_ctx().get_attachment(expense_id_int, String.to_integer(att_id)) do
          nil -> conn |> put_status(:not_found) |> json(%{message: "Attachment not found"})
          attachment -> json(conn, attachment_json(attachment))
        end
    end
  end

  def delete(conn, %{"expense_id" => expense_id, "att_id" => att_id}) do
    user = GuardianPlug.current_resource(conn)
    expense_id_int = String.to_integer(expense_id)

    case expense_ctx().get_expense(user.id, expense_id_int) do
      nil ->
        conn |> put_status(:forbidden) |> json(%{message: "Expense not found or access denied"})

      _expense ->
        case attachment_ctx().delete_attachment(expense_id_int, String.to_integer(att_id)) do
          {:ok, _} ->
            conn |> put_status(:no_content) |> json(%{})

          {:error, :not_found} ->
            conn |> put_status(:not_found) |> json(%{message: "Attachment not found"})
        end
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
    %{
      id: attachment.id,
      expense_id: attachment.expense_id,
      filename: attachment.filename,
      content_type: attachment.content_type,
      size: attachment.size,
      url: "/api/v1/expenses/#{attachment.expense_id}/attachments/#{attachment.id}",
      inserted_at: attachment.inserted_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
