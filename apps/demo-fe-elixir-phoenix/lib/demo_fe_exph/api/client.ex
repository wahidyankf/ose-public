defmodule DemoFeExph.Api.Client do
  @moduledoc "HTTP client wrapper for demo-be API calls using Req."

  @doc "Returns the configured backend base URL."
  def backend_url do
    Application.get_env(:demo_fe_exph, :backend_url, "http://localhost:8201")
  end

  @doc "Builds Authorization header map for a bearer token."
  def auth_headers(token) do
    %{"Authorization" => "Bearer #{token}"}
  end

  @doc "Performs a GET request to the given path, optionally with auth headers."
  def get(path, token \\ nil) do
    headers = if token, do: auth_headers(token), else: %{}

    case Req.get("#{backend_url()}#{path}", headers: headers) do
      {:ok, %{status: status, body: body}} when status in 200..299 -> {:ok, body}
      {:ok, %{status: status, body: body}} -> {:error, {status, body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Performs a POST request to the given path with a JSON body."
  def post(path, body, token \\ nil) do
    headers = if token, do: auth_headers(token), else: %{}

    case Req.post("#{backend_url()}#{path}", json: body, headers: headers) do
      {:ok, %{status: status, body: resp_body}} when status in 200..299 -> {:ok, resp_body}
      {:ok, %{status: status, body: resp_body}} -> {:error, {status, resp_body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Performs a PATCH request to the given path with a JSON body."
  def patch(path, body, token \\ nil) do
    headers = if token, do: auth_headers(token), else: %{}

    case Req.patch("#{backend_url()}#{path}", json: body, headers: headers) do
      {:ok, %{status: status, body: resp_body}} when status in 200..299 -> {:ok, resp_body}
      {:ok, %{status: status, body: resp_body}} -> {:error, {status, resp_body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Performs a PUT request to the given path with a JSON body."
  def put(path, body, token \\ nil) do
    headers = if token, do: auth_headers(token), else: %{}

    case Req.put("#{backend_url()}#{path}", json: body, headers: headers) do
      {:ok, %{status: status, body: resp_body}} when status in 200..299 -> {:ok, resp_body}
      {:ok, %{status: status, body: resp_body}} -> {:error, {status, resp_body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Performs a DELETE request to the given path."
  def delete(path, token \\ nil) do
    headers = if token, do: auth_headers(token), else: %{}

    case Req.delete("#{backend_url()}#{path}", headers: headers) do
      {:ok, %{status: status, body: resp_body}} when status in 200..299 -> {:ok, resp_body}
      {:ok, %{status: status, body: resp_body}} -> {:error, {status, resp_body}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Performs a GET request to /health."
  def get_health do
    get("/health")
  end
end
