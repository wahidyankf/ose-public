defmodule DemoBeExph.Integration.ServiceLayer do
  @moduledoc """
  Service-layer facade for integration tests.

  Translates HTTP-oriented Gherkin steps into direct context/service calls and
  returns a lightweight `%{status: integer(), body: map()}` response struct that
  step definitions can assert against — identical in shape to what ConnTest used
  to provide, but with zero Plug/Phoenix overhead.

  Status codes mirror what the real controllers return so no Gherkin scenarios
  need to change.
  """

  alias DemoBeExph.Attachment.Attachment
  alias DemoBeExph.Auth.Guardian

  @supported_content_types ~w(image/jpeg image/png application/pdf)
  @max_size_bytes Attachment.max_size_bytes()

  defp accounts, do: Application.get_env(:demo_be_exph, :accounts_module, DemoBeExph.Accounts)

  defp token_ctx,
    do: Application.get_env(:demo_be_exph, :token_module, DemoBeExph.Token.TokenContext)

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

  # ---------------------------------------------------------------------------
  # Health
  # ---------------------------------------------------------------------------

  @doc "GET /health"
  def get_health do
    %{status: 200, body: %{"status" => "UP"}}
  end

  # ---------------------------------------------------------------------------
  # Auth — register
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/auth/register"
  def register(params) do
    case accounts().register_user(params) do
      {:ok, user} ->
        %{
          status: 201,
          body: %{"id" => user.id, "username" => user.username, "email" => user.email}
        }

      {:error, changeset} ->
        if username_taken?(changeset) do
          %{status: 409, body: %{"message" => "Username already exists"}}
        else
          %{status: 400, body: %{"errors" => format_errors(changeset)}}
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Auth — login
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/auth/login"
  def login(params) do
    username = Map.get(params, "username", "")
    password = Map.get(params, "password", "")

    cond do
      username == "" ->
        %{status: 400, body: %{"errors" => %{"username" => ["can't be blank"]}}}

      password == "" ->
        %{status: 400, body: %{"errors" => %{"password" => ["can't be blank"]}}}

      true ->
        do_login(username, password)
    end
  end

  defp do_login(username, password) do
    case accounts().authenticate_user(username, password) do
      {:ok, user} ->
        {:ok, access_token, claims} = Guardian.encode_and_sign(user)
        _jti = Map.get(claims, "jti")
        {:ok, refresh_token} = token_ctx().create_refresh_token(user.id)

        %{
          status: 200,
          body: %{
            "accessToken" => access_token,
            "refreshToken" => refresh_token,
            "tokenType" => "Bearer"
          }
        }

      {:error, :invalid_credentials} ->
        %{status: 401, body: %{"message" => "Invalid credentials"}}

      {:error, :account_locked} ->
        %{
          status: 401,
          body: %{"message" => "Account is locked due to too many failed login attempts"}
        }

      {:error, :account_deactivated} ->
        %{status: 401, body: %{"message" => "Account has been deactivated"}}
    end
  end

  # ---------------------------------------------------------------------------
  # Auth — logout
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/auth/logout"
  def logout(access_token) do
    case Guardian.decode_and_verify(access_token) do
      {:ok, claims} ->
        jti = Map.get(claims, "jti")
        user_id = claims |> Map.get("sub") |> parse_user_id()
        token_ctx().revoke_access_token(jti, user_id)

      {:error, _reason} ->
        nil
    end

    %{status: 200, body: %{"message" => "Logged out successfully"}}
  end

  # ---------------------------------------------------------------------------
  # Auth — logout-all
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/auth/logout-all"
  def logout_all(access_token) do
    case Guardian.decode_and_verify(access_token) do
      {:ok, claims} ->
        jti = Map.get(claims, "jti")
        user_id = claims |> Map.get("sub") |> parse_user_id()
        token_ctx().revoke_access_token(jti, user_id)
        token_ctx().revoke_all_refresh_tokens(user_id)

      {:error, _} ->
        nil
    end

    %{status: 200, body: %{"message" => "All sessions logged out"}}
  end

  # ---------------------------------------------------------------------------
  # Auth — refresh
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/auth/refresh"
  def refresh(raw_token) when raw_token == "" do
    %{status: 400, body: %{"errors" => %{"refreshToken" => ["can't be blank"]}}}
  end

  def refresh(raw_token) do
    case token_ctx().validate_refresh_token(raw_token) do
      {:error, :token_expired} ->
        %{status: 401, body: %{"message" => "Refresh token has expired"}}

      {:error, :invalid_token} ->
        %{status: 401, body: %{"message" => "Invalid refresh token"}}

      {:ok, record} ->
        user = accounts().get_user(record.user_id)

        if is_nil(user) or user.status not in ["ACTIVE"] do
          %{status: 401, body: %{"message" => "Account has been deactivated"}}
        else
          token_ctx().consume_refresh_token(raw_token)
          {:ok, access_token, _claims} = Guardian.encode_and_sign(user)
          {:ok, new_refresh_token} = token_ctx().create_refresh_token(user.id)

          %{
            status: 200,
            body: %{
              "accessToken" => access_token,
              "refreshToken" => new_refresh_token,
              "tokenType" => "Bearer"
            }
          }
        end
    end
  end

  # ---------------------------------------------------------------------------
  # JWKS
  # ---------------------------------------------------------------------------

  @doc "GET /.well-known/jwks.json"
  def get_jwks do
    %{
      status: 200,
      body: %{
        "keys" => [
          %{"kty" => "oct", "use" => "sig", "alg" => "HS256", "kid" => "default"}
        ]
      }
    }
  end

  # ---------------------------------------------------------------------------
  # Users — me
  # ---------------------------------------------------------------------------

  @doc "GET /api/v1/users/me"
  def get_me(access_token) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        %{
          status: 200,
          body: %{
            "id" => user.id,
            "username" => user.username,
            "email" => user.email,
            "displayName" => user.display_name || user.username,
            "role" => user.role,
            "status" => user.status
          }
        }
    end
  end

  @doc "PATCH /api/v1/users/me"
  def update_me(access_token, params) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        attrs = remap_update_params(params)

        case accounts().update_user(user, attrs) do
          {:ok, updated_user} ->
            %{
              status: 200,
              body: %{
                "id" => updated_user.id,
                "username" => updated_user.username,
                "email" => updated_user.email,
                "displayName" => updated_user.display_name || updated_user.username
              }
            }

          {:error, changeset} ->
            %{status: 400, body: %{"errors" => format_errors(changeset)}}
        end
    end
  end

  @doc "POST /api/v1/users/me/password"
  def change_password(access_token, old_password, new_password) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case accounts().change_password(user, old_password, new_password) do
          {:ok, _user} ->
            %{status: 200, body: %{"message" => "Password changed successfully"}}

          {:error, :invalid_credentials} ->
            %{status: 401, body: %{"message" => "Invalid credentials"}}

          {:error, changeset} ->
            %{status: 400, body: %{"errors" => format_errors(changeset)}}
        end
    end
  end

  @doc "POST /api/v1/users/me/deactivate"
  def deactivate_me(access_token) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case accounts().deactivate_user(user) do
          {:ok, _user} ->
            %{status: 200, body: %{"message" => "Account deactivated successfully"}}

          {:error, changeset} ->
            %{status: 400, body: %{"errors" => format_errors(changeset)}}
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Admin
  # ---------------------------------------------------------------------------

  @doc "GET /api/v1/admin/users"
  def admin_list_users(access_token, opts \\ []) do
    case resolve_admin_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, _admin} ->
        result = accounts().list_users(opts)

        %{
          status: 200,
          body: %{
            "content" => Enum.map(result.data, &user_json/1),
            "totalElements" => result.total,
            "page" => result.page
          }
        }
    end
  end

  @doc "POST /api/v1/admin/users/{id}/disable"
  def admin_disable_user(access_token, user_id, _reason \\ "") do
    case resolve_admin_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, _admin} ->
        case accounts().get_user(user_id) do
          nil -> %{status: 404, body: %{"message" => "User not found"}}
          user -> do_disable_user(user)
        end
    end
  end

  defp do_disable_user(user) do
    case accounts().disable_user(user) do
      {:ok, _} ->
        token_ctx().revoke_all_refresh_tokens(user.id)
        %{status: 200, body: %{"message" => "User disabled"}}

      {:error, _} ->
        %{status: 500, body: %{"message" => "Failed to disable user"}}
    end
  end

  @doc "POST /api/v1/admin/users/{id}/enable"
  def admin_enable_user(access_token, user_id) do
    case resolve_admin_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, _admin} ->
        case accounts().get_user(user_id) do
          nil -> %{status: 404, body: %{"message" => "User not found"}}
          user -> do_enable_user(user)
        end
    end
  end

  defp do_enable_user(user) do
    case accounts().enable_user(user) do
      {:ok, _} -> %{status: 200, body: %{"message" => "User enabled"}}
      {:error, _} -> %{status: 500, body: %{"message" => "Failed"}}
    end
  end

  @doc "POST /api/v1/admin/users/{id}/unlock"
  def admin_unlock_user(access_token, user_id) do
    case resolve_admin_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, _admin} ->
        case accounts().get_user(user_id) do
          nil -> %{status: 404, body: %{"message" => "User not found"}}
          user -> do_unlock_user(user)
        end
    end
  end

  defp do_unlock_user(user) do
    case accounts().unlock_user(user) do
      {:ok, _} -> %{status: 200, body: %{"message" => "User unlocked"}}
      {:error, _} -> %{status: 500, body: %{"message" => "Failed"}}
    end
  end

  @doc "POST /api/v1/admin/users/{id}/force-password-reset"
  def admin_force_password_reset(access_token, user_id) do
    case resolve_admin_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, _admin} ->
        case accounts().get_user(user_id) do
          nil ->
            %{status: 404, body: %{"message" => "User not found"}}

          user ->
            reset_token = :crypto.strong_rand_bytes(24) |> Base.url_encode64(padding: false)

            %{
              status: 200,
              body: %{
                "message" => "Password reset token generated",
                "token" => reset_token,
                "user_id" => user.id
              }
            }
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Expenses
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/expenses"
  def create_expense(access_token, params) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().create_expense(user.id, params) do
          {:ok, expense} ->
            %{status: 201, body: expense_json(expense)}

          {:error, changeset} ->
            %{status: 400, body: %{"errors" => format_errors(changeset)}}
        end
    end
  end

  @doc "GET /api/v1/expenses"
  def list_expenses(access_token, opts \\ []) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        result = expense_ctx().list_expenses(user.id, opts)

        %{
          status: 200,
          body: %{
            "content" => Enum.map(result.data, &expense_json/1),
            "totalElements" => result.total,
            "page" => result.page
          }
        }
    end
  end

  @doc "GET /api/v1/expenses/{id}"
  def get_expense(access_token, expense_id) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().get_expense(user.id, expense_id) do
          nil ->
            %{status: 404, body: %{"message" => "Not found"}}

          expense ->
            %{status: 200, body: expense_json(expense)}
        end
    end
  end

  @doc "PUT /api/v1/expenses/{id}"
  def update_expense(access_token, expense_id, params) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().update_expense(user.id, expense_id, params) do
          {:ok, expense} ->
            %{status: 200, body: expense_json(expense)}

          {:error, :not_found} ->
            %{status: 404, body: %{"message" => "Not found"}}

          {:error, changeset} ->
            %{status: 400, body: %{"errors" => format_errors(changeset)}}
        end
    end
  end

  @doc "DELETE /api/v1/expenses/{id}"
  def delete_expense(access_token, expense_id) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().delete_expense(user.id, expense_id) do
          {:ok, _} ->
            %{status: 204, body: %{}}

          {:error, :not_found} ->
            %{status: 404, body: %{"message" => "Not found"}}
        end
    end
  end

  @doc "GET /api/v1/expenses/summary"
  def expense_summary(access_token) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        totals = expense_ctx().summary(user.id)
        serializable = Enum.into(totals, %{}, fn {k, v} -> {k, Decimal.to_string(v)} end)
        %{status: 200, body: serializable}
    end
  end

  # ---------------------------------------------------------------------------
  # Reports
  # ---------------------------------------------------------------------------

  @doc "GET /api/v1/reports/pl?from=&to=&currency="
  def pl_report(access_token, from_str, to_str, currency) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        with {:ok, from_date} <- parse_date(from_str),
             {:ok, to_date} <- parse_date(to_str) do
          report = expense_ctx().pl_report(user.id, from_date, to_date, currency)

          %{
            status: 200,
            body: %{
              "totalIncome" => Decimal.to_string(report.income_total),
              "totalExpense" => Decimal.to_string(report.expense_total),
              "net" => Decimal.to_string(report.net),
              "incomeBreakdown" =>
                Enum.map(report.income_breakdown, fn {k, v} ->
                  %{"category" => k, "type" => "income", "total" => Decimal.to_string(v)}
                end),
              "expenseBreakdown" =>
                Enum.map(report.expense_breakdown, fn {k, v} ->
                  %{"category" => k, "type" => "expense", "total" => Decimal.to_string(v)}
                end),
              "currency" => currency
            }
          }
        else
          {:error, :invalid_date} ->
            %{status: 400, body: %{"message" => "Invalid date format. Use YYYY-MM-DD."}}
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Attachments
  # ---------------------------------------------------------------------------

  @doc "POST /api/v1/expenses/{expense_id}/attachments — upload from file path"
  def upload_attachment(access_token, expense_id, filename, content_type, file_path) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().get_expense(user.id, expense_id) do
          nil ->
            %{status: 403, body: %{"message" => "Expense not found or access denied"}}

          _expense ->
            upload_attachment_file(expense_id, filename, content_type, file_path)
        end
    end
  end

  @doc "POST /api/v1/expenses/{expense_id}/attachments — unauthenticated (no token)"
  def upload_attachment_unauthenticated(expense_id, filename, content_type, file_path) do
    upload_attachment_file(expense_id, filename, content_type, file_path)
  end

  defp upload_attachment_file(expense_id, filename, content_type, file_path) do
    if content_type in @supported_content_types do
      store_validated_attachment(expense_id, filename, content_type, file_path)
    else
      %{status: 415, body: %{"errors" => %{"file" => ["content type not supported"]}}}
    end
  end

  defp store_validated_attachment(expense_id, filename, content_type, file_path) do
    file_data = File.read!(file_path)
    file_size = byte_size(file_data)

    if file_size > @max_size_bytes do
      %{status: 413, body: %{"message" => "File exceeds maximum allowed size"}}
    else
      attrs = %{
        "filename" => filename,
        "content_type" => content_type,
        "size" => file_size,
        "data" => file_data
      }

      case attachment_ctx().create_attachment(expense_id, attrs) do
        {:ok, attachment} ->
          %{status: 201, body: attachment_json(attachment)}

        {:error, changeset} ->
          %{status: 400, body: %{"errors" => format_errors(changeset)}}
      end
    end
  end

  @doc "GET /api/v1/expenses/{expense_id}/attachments"
  def list_attachments(access_token, expense_id) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().get_expense(user.id, expense_id) do
          nil ->
            %{status: 403, body: %{"message" => "Expense not found or access denied"}}

          _expense ->
            attachments = attachment_ctx().list_attachments(expense_id)
            %{status: 200, body: %{"attachments" => Enum.map(attachments, &attachment_json/1)}}
        end
    end
  end

  @doc "DELETE /api/v1/expenses/{expense_id}/attachments/{att_id}"
  def delete_attachment(access_token, expense_id, att_id) do
    case resolve_user_from_token(access_token) do
      {:error, response} ->
        response

      {:ok, user} ->
        case expense_ctx().get_expense(user.id, expense_id) do
          nil ->
            %{status: 403, body: %{"message" => "Expense not found or access denied"}}

          _expense ->
            do_delete_attachment(expense_id, att_id)
        end
    end
  end

  defp do_delete_attachment(expense_id, att_id) do
    case attachment_ctx().delete_attachment(expense_id, att_id) do
      {:ok, _} ->
        %{status: 204, body: %{}}

      {:error, :not_found} ->
        %{status: 404, body: %{"message" => "Attachment not found"}}
    end
  end

  # ---------------------------------------------------------------------------
  # Token revocation check (replaces HTTP /api/v1/users/me probe)
  # ---------------------------------------------------------------------------

  @doc """
  Check whether an access token is revoked or otherwise invalid.
  Returns true if the token cannot be used (revoked, expired, or invalid),
  false if still valid.
  """
  def access_token_invalidated?(access_token) do
    case Guardian.decode_and_verify(access_token) do
      {:error, _} ->
        true

      {:ok, claims} ->
        jti = Map.get(claims, "jti")
        jti != nil and token_ctx().revoked?(jti)
    end
  end

  # ---------------------------------------------------------------------------
  # Private helpers
  # ---------------------------------------------------------------------------

  defp resolve_user_from_token(access_token) do
    with {:ok, claims} <- Guardian.decode_and_verify(access_token),
         false <- token_revoked?(claims),
         user when not is_nil(user) <- accounts().get_user(claims_user_id(claims)),
         true <- user.status == "ACTIVE" do
      {:ok, user}
    else
      true ->
        {:error, %{status: 401, body: %{"message" => "Token has been revoked"}}}

      false ->
        {:error, %{status: 401, body: %{"message" => "Account has been deactivated"}}}

      nil ->
        {:error, %{status: 401, body: %{"message" => "User not found"}}}

      {:error, _reason} ->
        {:error, %{status: 401, body: %{"message" => "Unauthorized"}}}
    end
  end

  defp resolve_admin_from_token(access_token) do
    case resolve_user_from_token(access_token) do
      {:error, _} = err ->
        err

      {:ok, user} ->
        if user.role == "ADMIN" do
          {:ok, user}
        else
          {:error, %{status: 403, body: %{"message" => "Admin access required"}}}
        end
    end
  end

  defp token_revoked?(claims) do
    jti = Map.get(claims, "jti")
    jti != nil and token_ctx().revoked?(jti)
  end

  defp claims_user_id(claims) do
    claims |> Map.get("sub") |> parse_user_id()
  end

  defp parse_user_id(nil), do: nil
  defp parse_user_id(sub) when is_binary(sub), do: String.to_integer(sub)
  defp parse_user_id(sub) when is_integer(sub), do: sub

  defp username_taken?(%Ecto.Changeset{} = changeset) do
    changeset.errors
    |> Keyword.get_values(:username)
    |> Enum.any?(fn {_, opts} -> opts[:constraint] == :unique end)
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
    |> Enum.into(%{}, fn {k, v} -> {Atom.to_string(k), v} end)
  end

  defp remap_update_params(params) do
    params
    |> then(fn p ->
      case Map.pop(p, "displayName") do
        {nil, p} -> p
        {val, p} -> Map.put(p, "display_name", val)
      end
    end)
  end

  defp parse_date(""), do: {:error, :invalid_date}

  defp parse_date(str) do
    case Date.from_iso8601(str) do
      {:ok, date} -> {:ok, date}
      {:error, _} -> {:error, :invalid_date}
    end
  end

  defp expense_json(expense) do
    %{
      "id" => expense.id,
      "amount" => Decimal.to_string(expense.amount),
      "currency" => expense.currency,
      "category" => expense.category,
      "type" => expense.type,
      "description" => expense.description,
      "date" => Date.to_iso8601(expense.date),
      "unit" => expense.unit,
      "quantity" => format_quantity(expense.quantity),
      "inserted_at" => expense.inserted_at,
      "updated_at" => expense.updated_at
    }
  end

  defp format_quantity(nil), do: nil

  defp format_quantity(d) do
    if Decimal.equal?(d, Decimal.round(d, 0)) do
      d |> Decimal.round(0) |> Decimal.to_integer()
    else
      Decimal.to_float(d)
    end
  end

  defp attachment_json(attachment) do
    %{
      "id" => attachment.id,
      "expense_id" => attachment.expense_id,
      "filename" => attachment.filename,
      "contentType" => attachment.content_type,
      "size" => attachment.size,
      "url" => "/api/v1/expenses/#{attachment.expense_id}/attachments/#{attachment.id}",
      "inserted_at" => attachment.inserted_at
    }
  end

  defp user_json(user) do
    %{
      "id" => user.id,
      "username" => user.username,
      "email" => user.email,
      "role" => user.role,
      "status" => user.status,
      "displayName" => user.display_name || user.username
    }
  end
end
