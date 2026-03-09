defmodule OrganicleverBeExph.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      OrganicleverBeExphWeb.Telemetry,
      OrganicleverBeExph.Repo,
      {DNSCluster, query: Application.get_env(:organiclever_be_exph, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: OrganicleverBeExph.PubSub},
      # Start a worker by calling: OrganicleverBeExph.Worker.start_link(arg)
      # {OrganicleverBeExph.Worker, arg},
      # Start to serve requests, typically the last entry
      OrganicleverBeExphWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: OrganicleverBeExph.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    OrganicleverBeExphWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
