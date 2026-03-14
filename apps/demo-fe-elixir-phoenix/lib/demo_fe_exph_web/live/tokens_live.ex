defmodule DemoFeExphWeb.TokensLive do
  @moduledoc "LiveView for inspecting JWKS and decoding JWT token claims."

  use DemoFeExphWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    tokens_api = DemoFeExph.Api.tokens_module()

    case tokens_api.get_jwks() do
      {:ok, jwks} ->
        {:ok,
         assign(socket,
           jwks: jwks,
           token_input: "",
           decoded_claims: nil,
           error: nil,
           session_token: session["access_token"],
           user_id: nil,
           issuer: nil
         )}

      {:error, _reason} ->
        {:ok,
         assign(socket,
           jwks: nil,
           token_input: "",
           decoded_claims: nil,
           error: "Failed to load JWKS.",
           session_token: session["access_token"],
           user_id: nil,
           issuer: nil
         )}
    end
  end

  @impl true
  def handle_event("decode_token", %{"token" => token}, socket) do
    tokens_api = DemoFeExph.Api.tokens_module()

    case tokens_api.decode_token_claims(token) do
      {:ok, claims} ->
        {:noreply,
         assign(socket,
           decoded_claims: claims,
           error: nil,
           token_input: token,
           user_id: claims["sub"],
           issuer: claims["iss"]
         )}

      {:error, :invalid_token} ->
        {:noreply, assign(socket, error: "Invalid token format.", decoded_claims: nil)}
    end
  end

  def handle_event("decode_session_token", _params, socket) do
    tokens_api = DemoFeExph.Api.tokens_module()

    case socket.assigns.session_token do
      nil ->
        {:noreply, assign(socket, error: "No session token found.", decoded_claims: nil)}

      token ->
        case tokens_api.decode_token_claims(token) do
          {:ok, claims} ->
            {:noreply,
             assign(socket,
               decoded_claims: claims,
               error: nil,
               user_id: claims["sub"],
               issuer: claims["iss"]
             )}

          {:error, :invalid_token} ->
            {:noreply, assign(socket, error: "Session token is malformed.", decoded_claims: nil)}
        end
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Tokens</h1>
      <%= if @error do %>
        <p style="color: red;">{@error}</p>
      <% end %>
      <h2>JSON Web Key Set</h2>
      <%= if @jwks do %>
        <pre>{Jason.encode!(@jwks, pretty: true)}</pre>
      <% else %>
        <p>JWKS unavailable.</p>
      <% end %>
      <h2>Decode a Token</h2>
      <form phx-submit="decode_token">
        <textarea name="token" rows="4" cols="80">{@token_input}</textarea>
        <button type="submit">Decode</button>
      </form>
      <%= if @session_token do %>
        <button phx-click="decode_session_token">Decode Session Token</button>
      <% end %>
      <%= if @decoded_claims do %>
        <h3>Claims</h3>
        <pre>{Jason.encode!(@decoded_claims, pretty: true)}</pre>
        <%= if @user_id do %>
          <p>User ID: {@user_id}</p>
        <% end %>
        <%= if @issuer do %>
          <p>Issuer: {@issuer}</p>
        <% end %>
      <% end %>
    </div>
    """
  end
end
