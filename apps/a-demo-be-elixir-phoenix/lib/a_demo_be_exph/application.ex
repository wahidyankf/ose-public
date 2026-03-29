defmodule ADemoBeExph.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    base_children = [
      AADemoBeExphWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:a_demo_be_exph, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: ADemoBeExph.PubSub},
      AADemoBeExphWeb.Endpoint
    ]

    children =
      if Mix.env() != :test do
        [ADemoBeExph.Repo | base_children]
      else
        base_children
      end

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ADemoBeExph.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    AADemoBeExphWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
