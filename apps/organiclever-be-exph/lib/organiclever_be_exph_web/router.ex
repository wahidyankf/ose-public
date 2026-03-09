defmodule OrganicleverBeExphWeb.Router do
  use OrganicleverBeExphWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", OrganicleverBeExphWeb do
    pipe_through :api
  end
end
