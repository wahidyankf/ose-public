defmodule AADemoBeExphWeb.JwksController do
  use AADemoBeExphWeb, :controller

  alias GeneratedSchemas.JwkKey
  alias GeneratedSchemas.JwksResponse

  @doc """
  Returns a minimal JWKS representation.
  For HS256 (symmetric HMAC), the public key is the same as the secret.
  This endpoint returns the algorithm metadata for service integrators.
  """
  def index(conn, _params) do
    # HS256 is a symmetric algorithm — there is no public key to expose.
    # Return a minimal JWKS document indicating the algorithm in use.
    # Validate contract shape (n and e are RSA fields not applicable for HS256).
    _ = %JwksResponse{
      keys: [
        %JwkKey{kty: "oct", kid: "default", use: "sig", n: "", e: ""}
      ]
    }

    json(conn, %{
      keys: [
        %{
          kty: "oct",
          use: "sig",
          alg: "HS256",
          kid: "default"
        }
      ]
    })
  end
end
