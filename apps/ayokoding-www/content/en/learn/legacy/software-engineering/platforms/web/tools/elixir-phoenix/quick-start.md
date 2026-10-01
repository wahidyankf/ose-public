---
title: "Quick Start"
date: 2025-01-29T00:00:00+07:00
draft: false
weight: 10000000
description: "Rapid tour of Phoenix Framework fundamentals - routing, controllers, templates, LiveView, Ecto, channels, and real-time features in one comprehensive tutorial"
tags: ["phoenix", "elixir", "web-framework", "liveview", "ecto", "real-time", "beginner"]
---

**Ready to learn Phoenix Framework quickly?** This quick start tutorial provides a fast-paced tour through Phoenix's core concepts. By the end, you'll understand the fundamentals and be ready to build real web applications.

This tutorial provides 5-30% coverage - touching all essential concepts without deep dives. For 0-5% coverage (installation only), see [Initial Setup](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/initial-setup). For deep dives, continue to [Beginner Tutorial](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner) (0-60% coverage).

## Prerequisites

Before starting this tutorial, you need:

- Phoenix Framework installed (see [Initial Setup](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/initial-setup))
- Elixir 1.14+ and Erlang/OTP 24+
- PostgreSQL database running
- Basic Elixir knowledge (see [Elixir Quick Start](/en/learn/software-engineering/programming-languages/elixir/quick-start))
- Understanding of HTML and HTTP basics
- Text editor with Elixir support
- 90-120 minutes of focused learning

## Learning Objectives

By the end of this tutorial, you will understand:

1. **Request Lifecycle** - How Phoenix processes HTTP requests
2. **Routing** - Mapping URLs to controller actions
3. **Controllers** - Handling requests and returning responses
4. **Views and Templates** - Rendering HTML with HEEx
5. **Layouts** - Shared page structure
6. **Ecto Basics** - Database interaction with schemas and queries
7. **Changesets** - Data validation and casting
8. **Contexts** - Organizing business logic
9. **LiveView Fundamentals** - Real-time interactivity without JavaScript
10. **Channels** - WebSocket communication
11. **Authentication** - User login with phx.gen.auth
12. **Deployment** - Releasing to production

## Learning Path

```mermaid
graph TB
    accTitle: Learning Path
    accDescr: Graph with 16 nodes and 15 connections. Nodes: Quick Start, Prerequisites Check, Request Lifecycle, Routing, Controllers, View, Templates, Layouts, Ecto Basics, Changesets, Contexts, LiveView, and 4 more. Connections: Quick Start to Prerequisites Check, Prerequisites Check to Request Lifecycle, Request Lifecycle to Routing, Routing to Controllers, Controllers to View, Controllers to Templates, View to Layouts, Layouts to Ecto Basics, Ecto Basics to Changesets, Changesets to Contexts, Contexts to LiveView, LiveView to Channels, and 3 more.
    Start[Quick Start] --> Setup[Prerequisites Check]
    Setup --> Lifecycle[Request Lifecycle]
    Lifecycle --> Route[Routing]
    Route --> Control[Controllers]
    Control --> View[Views & Templates]
    View --> Layout[Layouts]
    Layout --> Ecto[Ecto Basics]
    Ecto --> Change[Changesets]
    Change --> Context[Contexts]
    Context --> Live[LiveView]
    Live --> Chan[Channels]
    Chan --> Auth[Authentication]
    Auth --> Deploy[Deployment]
    Deploy --> Next[Next Steps]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:3px
    class Start pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:3px
    class Next pal-029E73
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class Route pal-DE8F05
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    class Live pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Phoenix Request Lifecycle

Understanding how Phoenix processes requests is fundamental.

### The Full Journey

```mermaid
graph TD
    accTitle: The Full Journey
    accDescr: Graph with 8 nodes and 8 connections. Nodes: Browser, Endpoint, Router, Pipeline/Plugs, Controller, View, Template, HTTP Response. Connections: Browser to Endpoint, Endpoint to Router, Router to Pipeline/Plugs, Pipeline/Plugs to Controller, Controller to View, View to Template, Template to HTTP Response, HTTP Response to Browser.
    Browser[Browser] --> Endpoint[Endpoint]
    Endpoint --> Router[Router]
    Router --> Pipeline[Pipeline/Plugs]
    Pipeline --> Controller[Controller]
    Controller --> View[View]
    View --> Template[Template]
    Template --> Response[HTTP Response]
    Response --> Browser

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class Endpoint pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class Controller pal-DE8F05
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    class Template pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key components**:

1. **Endpoint** - HTTP entry point
2. **Router** - URL pattern matching
3. **Pipeline** - Plug middleware chain
4. **Controller** - Request handling logic
5. **View** - Rendering preparation
6. **Template** - HTML generation

## Routing Fundamentals

Routes map HTTP verbs and paths to controller actions.

### Basic Routes

Create new Phoenix project:

```bash
mix phx.new blog
cd blog
mix ecto.create
```

Open `lib/blog_web/router.ex`:

```elixir
defmodule BlogWeb.Router do
  use BlogWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {BlogWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", BlogWeb do
    pipe_through :browser

    get "/", PageController, :home
  end
end
```

### Route Patterns

```elixir
scope "/", BlogWeb do
  pipe_through :browser

  # Static route
  get "/", PageController, :home

  # Route with parameter
  get "/posts/:id", PostController, :show

  # Multiple HTTP verbs
  get "/posts/new", PostController, :new
  post "/posts", PostController, :create
  get "/posts/:id/edit", PostController, :edit
  put "/posts/:id", PostController, :update
  delete "/posts/:id", PostController, :delete
end
```

### Resource Routes

Phoenix provides `resources` macro for RESTful routes:

```elixir
scope "/", BlogWeb do
  pipe_through :browser

  get "/", PageController, :home
  resources "/posts", PostController
end
```

This generates:

| HTTP Verb | Path            | Controller Action | Purpose            |
| --------- | --------------- | ----------------- | ------------------ |
| GET       | /posts          | :index            | List all posts     |
| GET       | /posts/:id      | :show             | Show single post   |
| GET       | /posts/new      | :new              | Show creation form |
| POST      | /posts          | :create           | Create new post    |
| GET       | /posts/:id/edit | :edit             | Show edit form     |
| PUT/PATCH | /posts/:id      | :update           | Update post        |
| DELETE    | /posts/:id      | :delete           | Delete post        |

### List Routes

```bash
mix phx.routes
```

Output:

```
  GET  /                          BlogWeb.PageController :home
  GET  /posts                     BlogWeb.PostController :index
  GET  /posts/:id                 BlogWeb.PostController :show
  GET  /posts/new                 BlogWeb.PostController :new
  POST /posts                     BlogWeb.PostController :create
  GET  /posts/:id/edit            BlogWeb.PostController :edit
  PATCH/PUT /posts/:id            BlogWeb.PostController :update
  DELETE /posts/:id               BlogWeb.PostController :delete
```

## Controllers - Request Handling

Controllers receive requests and return responses.

### Generate Controller

```bash
mix phx.gen.html Blog Post posts title:string body:text published:boolean
```

This generates:

- Migration file
- Schema (Ecto model)
- Context module
- Controller
- Views and templates
- Tests

Update router as instructed:

```elixir
scope "/", BlogWeb do
  pipe_through :browser

  get "/", PageController, :home
  resources "/posts", PostController
end
```

Run migration:

```bash
mix ecto.migrate
```

### Controller Actions

Generated controller at `lib/blog_web/controllers/post_controller.ex`:

```elixir
defmodule BlogWeb.PostController do
  use BlogWeb, :controller

  alias Blog.Blog
  alias Blog.Blog.Post

  def index(conn, _params) do
    posts = Blog.list_posts()
    render(conn, :index, posts: posts)
  end

  def show(conn, %{"id" => id}) do
    post = Blog.get_post!(id)
    render(conn, :show, post: post)
  end

  def new(conn, _params) do
    changeset = Blog.change_post(%Post{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"post" => post_params}) do
    case Blog.create_post(post_params) do
      {:ok, post} ->
        conn
        |> put_flash(:info, "Post created successfully.")
        |> redirect(to: ~p"/posts/#{post}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def edit(conn, %{"id" => id}) do
    post = Blog.get_post!(id)
    changeset = Blog.change_post(post)
    render(conn, :edit, post: post, changeset: changeset)
  end

  def update(conn, %{"id" => id, "post" => post_params}) do
    post = Blog.get_post!(id)

    case Blog.update_post(post, post_params) do
      {:ok, post} ->
        conn
        |> put_flash(:info, "Post updated successfully.")
        |> redirect(to: ~p"/posts/#{post}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, post: post, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    post = Blog.get_post!(id)
    {:ok, _post} = Blog.delete_post(post)

    conn
    |> put_flash(:info, "Post deleted successfully.")
    |> redirect(to: ~p"/posts")
  end
end
```

### Conn Struct

`conn` is the connection struct containing request/response data:

```elixir
def show(conn, %{"id" => id}) do
  # conn fields:
  # conn.assigns     - Data for templates
  # conn.params      - Request parameters
  # conn.req_headers - Request headers
  # conn.method      - HTTP method (GET, POST, etc.)
  # conn.path_info   - Path segments

  IO.inspect(conn.method)    # => "GET"
  IO.inspect(conn.path_info) # => ["posts", "1"]

  post = Blog.get_post!(id)
  render(conn, :show, post: post)
end
```

### Controller Helpers

**Flash messages**:

```elixir
conn
|> put_flash(:info, "Success!")
|> put_flash(:error, "Failed!")
```

**Redirects**:

```elixir
redirect(conn, to: ~p"/posts")
redirect(conn, to: ~p"/posts/#{post}")
redirect(conn, external: "https://example.com")
```

**JSON responses**:

```elixir
def show(conn, %{"id" => id}) do
  post = Blog.get_post!(id)
  json(conn, %{id: post.id, title: post.title})
end
```

**Status codes**:

```elixir
conn
|> put_status(:not_found)
|> render(:error, message: "Not found")
```

## Views and Templates

Views prepare data for templates, templates generate HTML.

### View Module

Generated at `lib/blog_web/controllers/post_html.ex`:

```elixir
defmodule BlogWeb.PostHTML do
  use BlogWeb, :html

  embed_templates "post_html/*"
end
```

This embeds all templates from `lib/blog_web/controllers/post_html/` directory.

### HEEx Templates

HEEx (HTML + EEx) provides embedded Elixir in HTML.

**Index template** (`lib/blog_web/controllers/post_html/index.html.heex`):

```heex
<.header>
  Listing Posts
  <:actions>
    <.link href={~p"/posts/new"}>
      <.button>New Post</.button>
    </.link>
  </:actions>
</.header>

<.table id="posts" rows={@posts} row_click={&JS.navigate(~p"/posts/#{&1}")}>
  <:col :let={post} label="Title"><%= post.title %></:col>
  <:col :let={post} label="Body"><%= post.body %></:col>
  <:col :let={post} label="Published"><%= post.published %></:col>
  <:action :let={post}>
    <.link navigate={~p"/posts/#{post}"}>Show</.link>
  </:action>
  <:action :let={post}>
    <.link navigate={~p"/posts/#{post}/edit"}>Edit</.link>
  </:action>
</.table>
```

**Key HEEx features**:

- `<%= expression %>` - Embed Elixir expression
- `@assigns` - Access controller assigns (e.g., `@posts`)
- `~p"/path"` - Verified route helper
- `<.component>` - Component invocation

### Show Template

```heex
<.header>
  Post <%= @post.id %>
  <:subtitle>This is a post record from your database.</:subtitle>
  <:actions>
    <.link href={~p"/posts/#{@post}/edit"}>
      <.button>Edit post</.button>
    </.link>
  </:actions>
</.header>

<.list>
  <:item title="Title"><%= @post.title %></:item>
  <:item title="Body"><%= @post.body %></:item>
  <:item title="Published"><%= @post.published %></:item>
</.list>

<.back navigate={~p"/posts"}>Back to posts</.back>
```

### Form Template

```heex
<.simple_form :let={f} for={@changeset} action={@action}>
  <.error :if={@changeset.action}>
    Oops, something went wrong! Please check the errors below.
  </.error>
  <.input field={f[:title]} type="text" label="Title" />
  <.input field={f[:body]} type="textarea" label="Body" />
  <.input field={f[:published]} type="checkbox" label="Published" />
  <:actions>
    <.button>Save Post</.button>
  </:actions>
</.simple_form>
```

## Layouts - Shared Structure

Layouts wrap templates with common HTML structure.

### Root Layout

Located at `lib/blog_web/components/layouts/root.html.heex`:

```heex
<!DOCTYPE html>
<html lang="en" class="[scrollbar-gutter:stable]">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content={get_csrf_token()} />
    <.live_title suffix=" · Phoenix Framework">
      <%= assigns[:page_title] || "Blog" %>
    </.live_title>
    <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
    <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
    </script>
  </head>
  <body class="bg-white antialiased">
    <%= @inner_content %>
  </body>
</html>
```

`@inner_content` is where page content renders.

### App Layout

Located at `lib/blog_web/components/layouts/app.html.heex`:

```heex
<header class="px-4 sm:px-6 lg:px-8">
  <div class="flex items-center justify-between border-b border-zinc-100 py-3">
    <div class="flex items-center gap-4">
      <a href="/">
        <img src={~p"/images/logo.svg"} width="36" />
      </a>
      <p class="rounded-full bg-brand/5 px-2 text-[0.8125rem] font-medium leading-6">
        v<%= Application.spec(:phoenix, :vsn) %>
      </p>
    </div>
    <div class="flex items-center gap-4">
      <a href="/posts" class="text-[0.8125rem] font-semibold leading-6">
        Posts
      </a>
    </div>
  </div>
</header>
<main class="px-4 py-20 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-2xl">
    <.flash_group flash={@flash} />
    <%= @inner_content %>
  </div>
</main>
```

### Set Page Title

In controller:

```elixir
def show(conn, %{"id" => id}) do
  post = Blog.get_post!(id)

  conn
  |> assign(:page_title, post.title)
  |> render(:show, post: post)
end
```

Template now has `page_title` available.

## Ecto Basics - Database Interaction

Ecto is Phoenix's database wrapper (similar to ActiveRecord in Rails).

### Schema Definition

Generated at `lib/blog/blog/post.ex`:

```elixir
defmodule Blog.Blog.Post do
  use Ecto.Schema
  import Ecto.Changeset

  schema "posts" do
    field :title, :string
    field :body, :string
    field :published, :boolean, default: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(post, attrs) do
    post
    |> cast(attrs, [:title, :body, :published])
    |> validate_required([:title, :body])
  end
end
```

**Schema fields**:

- `:string` - VARCHAR
- `:integer` - INTEGER
- `:boolean` - BOOLEAN
- `:date` - DATE
- `:utc_datetime` - TIMESTAMP
- `:text` - TEXT

### Basic Queries

```elixir
alias Blog.Repo
alias Blog.Blog.Post

Repo.all(Post)

Repo.get(Post, 1)
Repo.get!(Post, 1)  # Raises if not found

Repo.get_by(Post, title: "Hello")
Repo.get_by!(Post, title: "Hello")

%Post{title: "New Post", body: "Content"}
|> Repo.insert()

post = Repo.get!(Post, 1)
changeset = Ecto.Changeset.change(post, title: "Updated Title")
Repo.update(changeset)

post = Repo.get!(Post, 1)
Repo.delete(post)
```

### Query with Ecto.Query

```elixir
import Ecto.Query

query = from p in Post,
  where: p.published == true,
  select: p

Repo.all(query)

query = from p in Post,
  order_by: [desc: p.inserted_at],
  limit: 10

Repo.all(query)

Post
|> where([p], p.published == true)
|> order_by([p], desc: p.inserted_at)
|> limit(10)
|> Repo.all()

Post
|> where([p], p.published == true)
|> Repo.aggregate(:count)
```

### Associations

Define relationships:

```elixir
defmodule Blog.Blog.Post do
  use Ecto.Schema
  import Ecto.Changeset

  schema "posts" do
    field :title, :string
    field :body, :string
    field :published, :boolean, default: false

    belongs_to :author, Blog.Accounts.User
    has_many :comments, Blog.Blog.Comment

    timestamps(type: :utc_datetime)
  end
end

defmodule Blog.Blog.Comment do
  use Ecto.Schema

  schema "comments" do
    field :body, :string

    belongs_to :post, Blog.Blog.Post

    timestamps(type: :utc_datetime)
  end
end
```

**Preload associations**:

```elixir
post = Repo.get!(Post, 1) |> Repo.preload(:comments)
post.comments  # => [%Comment{}, ...]

post = Repo.get!(Post, 1) |> Repo.preload([:comments, :author])

Post
|> where([p], p.published == true)
|> preload(:comments)
|> Repo.all()
```

## Changesets - Validation and Casting

Changesets validate and cast external data before database operations.

### Basic Changeset

```elixir
def changeset(post, attrs) do
  post
  |> cast(attrs, [:title, :body, :published])
  |> validate_required([:title, :body])
end
```

**`cast/3`** - Whitelist allowed fields

**`validate_required/2`** - Ensure fields present

### Validation Functions

```elixir
def changeset(post, attrs) do
  post
  |> cast(attrs, [:title, :body, :published, :view_count])
  |> validate_required([:title, :body])
  |> validate_length(:title, min: 3, max: 100)
  |> validate_length(:body, min: 10)
  |> validate_number(:view_count, greater_than_or_equal_to: 0)
  |> validate_format(:title, ~r/^[a-zA-Z0-9 ]+$/)
  |> unique_constraint(:title)
end
```

**Common validations**:

- `validate_length` - String length
- `validate_number` - Numeric constraints
- `validate_format` - Regex pattern
- `validate_inclusion` - Value in list
- `validate_exclusion` - Value not in list
- `unique_constraint` - Database uniqueness

### Custom Validation

```elixir
def changeset(post, attrs) do
  post
  |> cast(attrs, [:title, :body, :published])
  |> validate_required([:title, :body])
  |> validate_no_profanity()
end

defp validate_no_profanity(changeset) do
  title = get_field(changeset, :title)

  if title && String.contains?(String.downcase(title), ["bad", "words"]) do
    add_error(changeset, :title, "contains inappropriate language")
  else
    changeset
  end
end
```

### Apply Changeset

```elixir
attrs = %{title: "Valid Post", body: "Content here", published: true}
changeset = Post.changeset(%Post{}, attrs)

changeset.valid?  # => true
Repo.insert(changeset)  # => {:ok, %Post{}}

attrs = %{title: "AB", body: ""}
changeset = Post.changeset(%Post{}, attrs)

changeset.valid?  # => false
changeset.errors  # => [title: {"should be at least %{count} character(s)", ...}, body: {"can't be blank", ...}]
Repo.insert(changeset)  # => {:error, %Ecto.Changeset{}}
```

## Contexts - Business Logic Organization

Contexts organize related functionality (similar to service objects).

### Generated Context

Located at `lib/blog/blog.ex`:

```elixir
defmodule Blog.Blog do
  import Ecto.Query, warn: false
  alias Blog.Repo

  alias Blog.Blog.Post

  def list_posts do
    Repo.all(Post)
  end

  def get_post!(id), do: Repo.get!(Post, id)

  def create_post(attrs \\ %{}) do
    %Post{}
    |> Post.changeset(attrs)
    |> Repo.insert()
  end

  def update_post(%Post{} = post, attrs) do
    post
    |> Post.changeset(attrs)
    |> Repo.update()
  end

  def delete_post(%Post{} = post) do
    Repo.delete(post)
  end

  def change_post(%Post{} = post, attrs \\ %{}) do
    Post.changeset(post, attrs)
  end
end
```

### Custom Context Functions

Add business logic to context:

```elixir
defmodule Blog.Blog do
  # ... existing functions ...

  def list_published_posts do
    Post
    |> where([p], p.published == true)
    |> order_by([p], desc: p.inserted_at)
    |> Repo.all()
  end

  def publish_post(%Post{} = post) do
    post
    |> Ecto.Changeset.change(published: true)
    |> Repo.update()
  end

  def increment_view_count(%Post{} = post) do
    {1, [updated_post]} =
      Post
      |> where(id: ^post.id)
      |> Repo.update_all(inc: [view_count: 1])
      |> Repo.all()

    {:ok, updated_post}
  end

  def recent_posts(limit \\ 10) do
    Post
    |> order_by([p], desc: p.inserted_at)
    |> limit(^limit)
    |> Repo.all()
  end
end
```

Controllers call context functions, never Repo directly:

```elixir
defmodule BlogWeb.PostController do
  use BlogWeb, :controller

  alias Blog.Blog

  def index(conn, _params) do
    posts = Blog.list_published_posts()  # Context function
    render(conn, :index, posts: posts)
  end

  def show(conn, %{"id" => id}) do
    post = Blog.get_post!(id)
    Blog.increment_view_count(post)  # Context function
    render(conn, :show, post: post)
  end
end
```

## LiveView - Real-Time Interactivity

LiveView enables real-time features without writing JavaScript.

### Generate LiveView

```bash
mix phx.gen.live Counter Counter counters value:integer
```

Update router:

```elixir
scope "/", BlogWeb do
  pipe_through :browser

  get "/", PageController, :home
  resources "/posts", PostController
  live "/counters", CounterLive.Index
  live "/counters/:id", CounterLive.Show
end
```

### Basic LiveView

Create simple counter (`lib/blog_web/live/counter_live.ex`):

```elixir
defmodule BlogWeb.CounterLive do
  use BlogWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0)}
  end

  def handle_event("increment", _params, socket) do
    {:noreply, update(socket, :count, &(&1 + 1))}
  end

  def handle_event("decrement", _params, socket) do
    {:noreply, update(socket, :count, &(&1 - 1))}
  end

  def render(assigns) do
    ~H"""
    <div class="text-center">
      <h1 class="text-4xl font-bold">Counter: <%= @count %></h1>
      <div class="mt-4 space-x-4">
        <button phx-click="decrement" class="px-4 py-2 bg-red-500 text-white rounded">
          -
        </button>
        <button phx-click="increment" class="px-4 py-2 bg-green-500 text-white rounded">
          +
        </button>
      </div>
    </div>
    """
  end
end
```

Add route:

```elixir
scope "/", BlogWeb do
  pipe_through :browser

  live "/counter", CounterLive
end
```

Visit `http://localhost:4000/counter` - clicking buttons updates count in real-time!

### LiveView Lifecycle

```elixir
defmodule BlogWeb.TimerLive do
  use BlogWeb, :live_view

  def mount(_params, _session, socket) do
    if connected?(socket) do
      :timer.send_interval(1000, self(), :tick)
    end

    {:ok, assign(socket, seconds: 0)}
  end

  def handle_info(:tick, socket) do
    {:noreply, update(socket, :seconds, &(&1 + 1))}
  end

  def render(assigns) do
    ~H"""
    <h1>Elapsed: <%= @seconds %> seconds</h1>
    """
  end
end
```

Updates automatically every second!

### Forms in LiveView

```elixir
defmodule BlogWeb.SearchLive do
  use BlogWeb, :live_view
  alias Blog.Blog

  def mount(_params, _session, socket) do
    {:ok, assign(socket, query: "", results: [])}
  end

  def handle_event("search", %{"query" => query}, socket) do
    results = search_posts(query)
    {:noreply, assign(socket, query: query, results: results)}
  end

  defp search_posts(query) do
    # Implement search logic
    Blog.search_posts(query)
  end

  def render(assigns) do
    ~H"""
    <form phx-change="search">
      <input
        type="text"
        name="query"
        value={@query}
        placeholder="Search posts..."
        class="border px-4 py-2 rounded"
      />
    </form>

    <div class="mt-4">
      <%= for post <- @results do %>
        <div class="p-4 border-b">
          <h3><%= post.title %></h3>
          <p><%= String.slice(post.body, 0..100) %></p>
        </div>
      <% end %>
    </div>
    """
  end
end
```

Search results update as you type - no page reload!

## Channels - WebSocket Communication

Channels enable bidirectional real-time communication.

### Define Channel

Create `lib/blog_web/channels/room_channel.ex`:

```elixir
defmodule BlogWeb.RoomChannel do
  use BlogWeb, :channel

  def join("room:lobby", _payload, socket) do
    {:ok, socket}
  end

  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_in("new_msg", %{"body" => body}, socket) do
    broadcast!(socket, "new_msg", %{body: body})
    {:noreply, socket}
  end
end
```

Register in `lib/blog_web/channels/user_socket.ex`:

```elixir
defmodule BlogWeb.UserSocket do
  use Phoenix.Socket

  channel "room:*", BlogWeb.RoomChannel

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end
```

### Client JavaScript

In `assets/js/app.js`:

```javascript
import { Socket } from "phoenix";

let socket = new Socket("/socket", { params: { token: window.userToken } });
socket.connect();

let channel = socket.channel("room:lobby", {});
let chatInput = document.querySelector("#chat-input");
let messagesContainer = document.querySelector("#messages");

chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    channel.push("new_msg", { body: chatInput.value });
    chatInput.value = "";
  }
});

channel.on("new_msg", (payload) => {
  let messageItem = document.createElement("li");
  messageItem.innerText = payload.body;
  messagesContainer.appendChild(messageItem);
});

channel
  .join()
  .receive("ok", (resp) => {
    console.log("Joined successfully", resp);
  })
  .receive("error", (resp) => {
    console.log("Unable to join", resp);
  });
```

### Presence - Track Users

```elixir
defmodule BlogWeb.Presence do
  use Phoenix.Presence,
    otp_app: :blog,
    pubsub_server: Blog.PubSub
end
```

Track users in channel:

```elixir
defmodule BlogWeb.RoomChannel do
  use BlogWeb, :channel
  alias BlogWeb.Presence

  def join("room:lobby", _payload, socket) do
    send(self(), :after_join)
    {:ok, socket}
  end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{
      online_at: inspect(System.system_time(:second))
    })
    {:noreply, socket}
  end
end
```

## Authentication - User Login

Phoenix provides generator for authentication.

### Generate Auth

```bash
mix phx.gen.auth Accounts User users
```

This generates:

- User schema and migration
- Accounts context
- Controllers for registration, login, logout
- Session management
- Email confirmation
- Password reset
- Tests

Run migration:

```bash
mix ecto.migrate
```

### Generated Routes

```elixir
scope "/", BlogWeb do
  pipe_through :browser

  get "/", PageController, :home

  # ... existing routes ...
end

scope "/", BlogWeb do
  pipe_through [:browser, :redirect_if_user_is_authenticated]

  get "/users/register", UserRegistrationController, :new
  post "/users/register", UserRegistrationController, :create
  get "/users/log_in", UserSessionController, :new
  post "/users/log_in", UserSessionController, :create
end

scope "/", BlogWeb do
  pipe_through [:browser, :require_authenticated_user]

  get "/users/settings", UserSettingsController, :edit
  put "/users/settings", UserSettingsController, :update
end

scope "/", BlogWeb do
  pipe_through [:browser]

  delete "/users/log_out", UserSessionController, :delete
end
```

### Protect Routes

Require authentication:

```elixir
scope "/", BlogWeb do
  pipe_through [:browser, :require_authenticated_user]

  resources "/posts", PostController, except: [:index, :show]
end

scope "/", BlogWeb do
  pipe_through :browser

  get "/", PageController, :home
  resources "/posts", PostController, only: [:index, :show]
end
```

Now only authenticated users can create/edit/delete posts.

### Access Current User

In controllers:

```elixir
def create(conn, %{"post" => post_params}) do
  current_user = conn.assigns.current_user

  post_params = Map.put(post_params, "author_id", current_user.id)

  case Blog.create_post(post_params) do
    {:ok, post} ->
      conn
      |> put_flash(:info, "Post created successfully.")
      |> redirect(to: ~p"/posts/#{post}")

    {:error, %Ecto.Changeset{} = changeset} ->
      render(conn, :new, changeset: changeset)
  end
end
```

In templates:

```heex
<%= if @current_user do %>
  <p>Welcome, <%= @current_user.email %>!</p>
  <.link href={~p"/users/log_out"} method="delete">Log out</.link>
<% else %>
  <.link href={~p"/users/register"}>Register</.link>
  <.link href={~p"/users/log_in"}>Log in</.link>
<% end %>
```

## Deployment Basics

Deploy Phoenix to production.

### Release Configuration

Phoenix uses Elixir releases for deployment.

Update `config/runtime.exs`:

```elixir
if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      """

  config :blog, Blog.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      """

  host = System.get_env("PHX_HOST") || "example.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :blog, BlogWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base
end
```

### Build Release

```bash
export SECRET_KEY_BASE=$(mix phx.gen.secret)
export DATABASE_URL="postgresql://user:pass@localhost/blog_prod"

mix assets.deploy

MIX_ENV=prod mix release
```

### Run Release

```bash
_build/prod/rel/blog/bin/blog start
```

### Deploy to Fly.io

Phoenix has first-class Fly.io support:

```bash
curl -L https://fly.io/install.sh | sh

fly launch

fly deploy

fly ssh console
/app/bin/blog eval "Blog.Release.migrate"
```

## Summary

**What you've learned**:

- **Request Lifecycle** - Endpoint → Router → Pipeline → Controller → View → Template
- **Routing** - URL mapping, resource routes, route helpers
- **Controllers** - Request handling, pattern matching params, conn manipulation
- **Views and Templates** - HEEx syntax, embedded Elixir, component usage
- **Layouts** - Root and app layouts, shared structure
- **Ecto** - Schemas, queries, associations, preloading
- **Changesets** - Validation, casting, custom validators
- **Contexts** - Organizing business logic, separation of concerns
- **LiveView** - Real-time updates, event handling, stateful interactions
- **Channels** - WebSocket communication, broadcasting, presence
- **Authentication** - User registration, login, session management
- **Deployment** - Releases, configuration, production deployment

**Key skills gained**:

- Building full CRUD applications
- Real-time features without JavaScript
- Database interaction with Ecto
- User authentication and authorization
- RESTful API design
- Production deployment

**Phoenix patterns mastered**:

- MVC architecture with contexts
- Pattern matching in controllers
- Pipeline composition
- LiveView for interactivity
- Context-driven design

## Next Steps

**Ready for comprehensive Phoenix mastery?**

- [Beginner Tutorial](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner) (0-60% coverage) - Deep dive into Phoenix with extensive practice
- [Intermediate Tutorial](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate) (60-85% coverage) - Advanced features, testing, deployment

**Prefer code-first learning?**

- [By-Example Tutorial](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner) - 75-90 heavily annotated examples covering 95% of Phoenix

**Want to understand design philosophy?**

- [Overview](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/overview) - Why Phoenix exists, when to use it, ecosystem overview

**Need to strengthen Elixir fundamentals?**

- [Elixir Beginner Tutorial](/en/learn/software-engineering/programming-languages/elixir/by-example/beginner) - Deep dive into Elixir language

## Practice Projects

Build these projects to solidify Phoenix concepts:

**1. Blog Platform**

- User registration and authentication
- Create, edit, delete blog posts
- Comments system
- Markdown rendering
- Tags and categories

**2. Real-Time Chat Application**

- User authentication
- Multiple chat rooms
- LiveView or Channels
- User presence tracking
- Message history

**3. Todo List with LiveView**

- Real-time task updates
- Mark tasks complete
- Filter by status
- Drag-and-drop reordering
- User accounts

**4. E-Commerce Store**

- Product catalog
- Shopping cart (session-based)
- User accounts
- Order history
- Admin dashboard

## Further Resources

**Official Documentation**:

- [Phoenix Guides](https://hexdocs.pm/phoenix/overview.html) - Comprehensive official guides
- [Phoenix API Docs](https://hexdocs.pm/phoenix/) - Complete API reference
- [LiveView Docs](https://hexdocs.pm/phoenix_live_view/) - LiveView guide and API
- [Ecto Guides](https://hexdocs.pm/ecto/) - Database wrapper documentation

**Books**:

- [Programming Phoenix](https://pragprog.com/titles/phoenix14/programming-phoenix-1-4/) - Comprehensive Phoenix book by framework authors
- [Phoenix in Action](https://www.manning.com/books/phoenix-in-action) - Practical Phoenix development
- [Real-Time Phoenix](https://pragprog.com/titles/sbsockets/real-time-phoenix/) - Channels, LiveView, and real-time features

**Video Courses**:

- [Phoenix Framework Course](https://pragmaticstudio.com/phoenix) - Pragmatic Studio
- [ElixirCasts](https://elixircasts.io/) - Free Phoenix screencasts

**Community**:

- [Elixir Forum](https://elixirforum.com/) - Active community discussion
- [Phoenix Forum](https://elixirforum.com/c/phoenix-forum/15) - Phoenix-specific help
- [Elixir Slack #phoenix](https://elixir-slackin.herokuapp.com/) - Real-time chat
- [Phoenix GitHub](https://github.com/phoenixframework/phoenix) - Source code and issues
