defmodule DemoFeExph.Api.Tokens do
  @moduledoc "Token utilities: JWKS fetching and JWT claims decoding."

  alias DemoFeExph.Api.Client

  @doc "Fetches the JSON Web Key Set from the backend."
  def get_jwks do
    Client.get("/.well-known/jwks.json")
  end

  @doc """
  Decodes the claims from a JWT token without verification.

  Returns `{:ok, claims}` where claims is a map of the JWT payload,
  or `{:error, reason}` if the token is malformed.
  """
  def decode_token_claims(token) do
    with [_header, payload, _signature] <- String.split(token, "."),
         {:ok, decoded} <- Base.url_decode64(payload, padding: false),
         {:ok, claims} <- Jason.decode(decoded) do
      {:ok, claims}
    else
      _ -> {:error, :invalid_token}
    end
  end
end
