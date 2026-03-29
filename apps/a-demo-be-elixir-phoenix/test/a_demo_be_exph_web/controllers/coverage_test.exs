defmodule AADemoBeExphWeb.CoverageTest do
  @moduledoc """
  Integration tests covering controller error paths not exercised by Cabbage scenarios.
  """
  use AADemoBeExphWeb.ConnCase

  alias ADemoBeExph.Integration.Helpers

  @moduletag :unit

  # --- Shared setup helpers ---

  defp create_user_and_login(username \\ "coveruser") do
    email = "#{username}@cover.test"
    user = Helpers.register_user!(username, email, "Str0ng#Pass1")
    {access_token, _} = Helpers.login_user!(user)
    {user, access_token}
  end

  defp create_expense(access_token) do
    body =
      Jason.encode!(%{
        amount: "10.50",
        currency: "USD",
        category: "food",
        description: "Test",
        date: "2025-01-15",
        type: "expense"
      })

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/expenses", body)

    Jason.decode!(conn.resp_body)["id"]
  end

  defp upload_attachment(access_token, expense_id) do
    tmp_path = System.tmp_dir!() <> "/cover_test_#{System.unique_integer()}.jpg"
    File.write!(tmp_path, "test content")

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> post("/api/v1/expenses/#{expense_id}/attachments", %{
        "file" => %Plug.Upload{
          path: tmp_path,
          filename: "receipt.jpg",
          content_type: "image/jpeg"
        }
      })

    File.rm(tmp_path)
    Jason.decode!(conn.resp_body)["id"]
  end

  # --- Attachment controller: show action (entirely uncovered by Cabbage) ---

  describe "GET /api/v1/expenses/:expense_id/attachments/:att_id" do
    test "returns 200 with attachment when found" do
      {_user, token} = create_user_and_login("attshow1")
      expense_id = create_expense(token)
      att_id = upload_attachment(token, expense_id)

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> get("/api/v1/expenses/#{expense_id}/attachments/#{att_id}")

      assert conn.status == 200
      body = Jason.decode!(conn.resp_body)
      assert body["id"] == att_id
      assert body["filename"] == "receipt.jpg"
    end

    test "returns 404 when expense not found" do
      {_user, token} = create_user_and_login("attshow2")

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> get("/api/v1/expenses/999999/attachments/1")

      assert conn.status == 404
    end

    test "returns 404 when attachment not found" do
      {_user, token} = create_user_and_login("attshow3")
      expense_id = create_expense(token)

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> get("/api/v1/expenses/#{expense_id}/attachments/999999")

      assert conn.status == 404
    end
  end

  # --- Attachment controller: index not found ---

  describe "GET /api/v1/expenses/:expense_id/attachments (not found)" do
    test "returns 403 when expense not found" do
      {_user, token} = create_user_and_login("attidx1")

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> get("/api/v1/expenses/999999/attachments")

      assert conn.status == 403
    end
  end

  # --- Attachment controller: delete not found paths ---

  describe "DELETE /api/v1/expenses/:expense_id/attachments/:att_id (not found)" do
    test "returns 403 when expense not found" do
      {_user, token} = create_user_and_login("attdel1")

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> delete("/api/v1/expenses/999999/attachments/1")

      assert conn.status == 403
    end

    test "returns 404 when attachment not found" do
      {_user, token} = create_user_and_login("attdel2")
      expense_id = create_expense(token)

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> delete("/api/v1/expenses/#{expense_id}/attachments/999999")

      assert conn.status == 404
    end
  end

  # --- Admin controller: non-admin forbidden ---

  describe "admin endpoints with non-admin user" do
    test "list_users returns 403 for regular user" do
      {_user, token} = create_user_and_login("adminfb1")

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(token))
        |> get("/api/v1/admin/users")

      assert conn.status == 403
    end

    test "disable_user returns 404 when user not found" do
      {admin, admin_token} = create_user_and_login("adminuf1")
      Helpers.make_admin!(admin)

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(admin_token))
        |> put_req_header("content-type", "application/json")
        |> post("/api/v1/admin/users/999999/disable", Jason.encode!(%{reason: "test"}))

      assert conn.status == 404
    end

    test "enable_user returns 404 when user not found" do
      {admin, admin_token} = create_user_and_login("adminef1")
      Helpers.make_admin!(admin)

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(admin_token))
        |> post("/api/v1/admin/users/999999/enable", %{})

      assert conn.status == 404
    end

    test "unlock_user returns 404 when user not found" do
      {admin, admin_token} = create_user_and_login("adminulk1")
      Helpers.make_admin!(admin)

      conn =
        build_conn()
        |> put_req_header("authorization", Helpers.bearer_header(admin_token))
        |> post("/api/v1/admin/users/999999/unlock", %{})

      assert conn.status == 404
    end
  end

  # --- Auth controller: empty field validation ---

  describe "auth empty field validation" do
    test "login returns 400 when username is empty" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post("/api/v1/auth/login", Jason.encode!(%{username: "", password: "Str0ng#Pass1"}))

      assert conn.status == 400
      body = Jason.decode!(conn.resp_body)
      assert body["errors"]["username"] != nil
    end

    test "login returns 400 when password is empty" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post("/api/v1/auth/login", Jason.encode!(%{username: "someuser", password: ""}))

      assert conn.status == 400
      body = Jason.decode!(conn.resp_body)
      assert body["errors"]["password"] != nil
    end

    test "refresh returns 400 when refreshToken is empty" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post("/api/v1/auth/refresh", Jason.encode!(%{refreshToken: ""}))

      assert conn.status == 400
      body = Jason.decode!(conn.resp_body)
      assert body["errors"]["refreshToken"] != nil
    end

    test "logout succeeds with invalid token (graceful error)" do
      conn =
        build_conn()
        |> put_req_header("authorization", "Bearer invalidtoken")
        |> post("/api/v1/auth/logout", %{})

      assert conn.status == 200
    end

    test "logout-all succeeds with invalid token (graceful error)" do
      conn =
        build_conn()
        |> put_req_header("authorization", "Bearer invalidtoken")
        |> post("/api/v1/auth/logout-all", %{})

      assert conn.status == 200
    end
  end

  # --- User controller: update_me changeset error (covers format_errors) ---

  describe "user controller update_me error" do
    test "format_errors is exercised via auth register with bad changeset" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post(
          "/api/v1/auth/register",
          Jason.encode!(%{username: "ab", email: "bad", password: "weak"})
        )

      assert conn.status == 400
      body = Jason.decode!(conn.resp_body)
      assert Map.has_key?(body, "errors")
    end
  end
end
