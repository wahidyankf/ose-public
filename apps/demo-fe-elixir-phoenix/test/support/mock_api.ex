defmodule DemoFeExph.Test.MockApi do
  @moduledoc """
  Mock implementations of API modules for LiveView unit tests.

  Each sub-module mirrors the real API module's public interface but reads
  responses from `DemoFeExph.Test.ApiStub` (ETS-backed, globally accessible
  from any BEAM process, including LiveView GenServer processes).

  Configure the app to use these in `config/test.exs` by setting:

      config :demo_fe_exph, :api_modules, %{
        client: DemoFeExph.Test.MockApi.Client,
        auth:   DemoFeExph.Test.MockApi.Auth,
        ...
      }

  The production API modules remain unchanged; only the test configuration
  points to these mocks.
  """

  defmodule Client do
    @moduledoc "Mock for DemoFeExph.Api.Client."
    alias DemoFeExph.Test.ApiStub

    def backend_url, do: "http://localhost:8201"
    def auth_headers(_token), do: %{}

    def get_health, do: ApiStub.get(:health)
    def get(_path, _token \\ nil), do: {:ok, %{}}
    def post(_path, _body, _token \\ nil), do: {:ok, %{}}
    def patch(_path, _body, _token \\ nil), do: {:ok, %{}}
    def put(_path, _body, _token \\ nil), do: {:ok, %{}}
    def delete(_path, _token \\ nil), do: {:ok, %{}}
  end

  defmodule Auth do
    @moduledoc "Mock for DemoFeExph.Api.Auth."
    alias DemoFeExph.Test.ApiStub

    def register(_username, _email, _password), do: ApiStub.get(:register)
    def login(_username, _password), do: ApiStub.get(:login)
    def refresh_token(_token), do: ApiStub.get(:refresh)
    def logout(_refresh_token), do: ApiStub.get(:logout)
    def logout_all(_access_token), do: ApiStub.get(:logout_all)
  end

  defmodule Users do
    @moduledoc "Mock for DemoFeExph.Api.Users."
    alias DemoFeExph.Test.ApiStub

    def get_current_user(_token), do: ApiStub.get(:get_current_user)
    def update_profile(_token, _display_name), do: ApiStub.get(:update_profile)
    def change_password(_token, _old, _new), do: ApiStub.get(:change_password)
    def deactivate_account(_token), do: ApiStub.get(:deactivate_account)
  end

  defmodule Admin do
    @moduledoc "Mock for DemoFeExph.Api.Admin."
    alias DemoFeExph.Test.ApiStub

    def list_users(_token, _page \\ 1, _size \\ 20, _search \\ nil), do: ApiStub.get(:list_users)
    def disable_user(_token, _id, _reason), do: ApiStub.get(:disable_user)
    def enable_user(_token, _id), do: ApiStub.get(:enable_user)
    def unlock_user(_token, _id), do: ApiStub.get(:unlock_user)
    def force_password_reset(_token, _id), do: ApiStub.get(:force_password_reset)
  end

  defmodule Expenses do
    @moduledoc "Mock for DemoFeExph.Api.Expenses."
    alias DemoFeExph.Test.ApiStub

    def list_expenses(_token, _page \\ 1, _size \\ 20), do: ApiStub.get(:list_expenses)
    def get_expense(_token, _id), do: ApiStub.get(:get_expense)
    def create_expense(_token, _attrs), do: ApiStub.get(:create_expense)
    def update_expense(_token, _id, _attrs), do: ApiStub.get(:update_expense)
    def delete_expense(_token, _id), do: ApiStub.get(:delete_expense)
    def get_expense_summary(_token, _currency \\ "USD"), do: ApiStub.get(:get_expense_summary)
  end

  defmodule Attachments do
    @moduledoc "Mock for DemoFeExph.Api.Attachments."
    alias DemoFeExph.Test.ApiStub

    def list_attachments(_token, _expense_id), do: ApiStub.get(:list_attachments)

    def upload_attachment(_token, _expense_id, _file_path, _content_type),
      do: ApiStub.get(:upload_attachment)

    def delete_attachment(_token, _expense_id, _attachment_id),
      do: ApiStub.get(:delete_attachment)
  end

  defmodule Reports do
    @moduledoc "Mock for DemoFeExph.Api.Reports."
    alias DemoFeExph.Test.ApiStub

    def get_pl_report(_token, _start_date, _end_date, _currency \\ "USD"),
      do: ApiStub.get(:get_pl_report)
  end

  defmodule Tokens do
    @moduledoc "Mock for DemoFeExph.Api.Tokens."
    alias DemoFeExph.Test.ApiStub

    def get_jwks, do: ApiStub.get(:jwks)

    def decode_token_claims(token) do
      DemoFeExph.Api.Tokens.decode_token_claims(token)
    end
  end
end
