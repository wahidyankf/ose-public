defmodule DemoFeExphWeb.CoreComponents do
  @moduledoc "Provides core UI components."
  use Phoenix.Component

  def flash_group(assigns) do
    ~H"""
    <div id="flash-group">
      <.flash kind={:info} flash={@flash} />
      <.flash kind={:error} flash={@flash} />
    </div>
    """
  end

  def flash(assigns) do
    ~H"""
    <div :if={msg = Phoenix.Flash.get(@flash, @kind)} role="alert">
      <p>{msg}</p>
    </div>
    """
  end
end
