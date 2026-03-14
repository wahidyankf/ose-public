defmodule DemoFeExph.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      DemoFeExphWeb.Telemetry,
      {Phoenix.PubSub, name: DemoFeExph.PubSub},
      DemoFeExphWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: DemoFeExph.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    DemoFeExphWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
