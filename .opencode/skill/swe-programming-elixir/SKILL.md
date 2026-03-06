---
name: swe-programming-elixir
description: Elixir, Phoenix Framework, and Phoenix LiveView coding standards from authoritative docs/explanation/ documentation
---

# Elixir Stack Coding Standards

## Purpose

Progressive disclosure of Elixir stack coding standards for agents writing Elixir code.

**Coverage**: Elixir language → Phoenix Framework → Phoenix LiveView (full technology stack)

**Usage**: Auto-loaded for agents when writing any Elixir/Phoenix code. Provides quick reference to idioms, best practices, and antipatterns across the full stack.

---

## Elixir Language Standards

**Authoritative Source**: [docs/explanation/software-engineering/programming-languages/elixir/README.md](../../../docs/explanation/software-engineering/programming-languages/elixir/README.md)

### Naming Conventions

**Modules**: PascalCase

- `UserAccount`, `PaymentProcessor`

**Functions and Variables**: snake_case

- Functions: `calculate_total/1`, `find_user_by_id/1`
- Variables: `user_name`, `total_amount`

**Atoms**: lowercase with underscores

- `:ok`, `:error`, `:not_found`

**Private Functions**: Prefix with `def` (not `defp` for documentation)

- Use `@doc false` for private but need to document

### Modern Elixir Features (1.14+)

**Pattern Matching**: Use extensively

```elixir
case result do
  {:ok, value} -> process_value(value)
  {:error, reason} -> handle_error(reason)
  _ -> :unknown
end
```

**Pipe Operator**: Chain transformations

```elixir
data
|> parse()
|> validate()
|> process()
|> format()
```

**With Statement**: Handle multiple operations

```elixir
with {:ok, user} <- find_user(id),
     {:ok, account} <- find_account(user.account_id),
     {:ok, balance} <- get_balance(account) do
  {:ok, balance}
end
```

**Protocols**: Use for polymorphism

```elixir
defprotocol Validator do
  def validate(data)
end
```

### Error Handling

**Tagged Tuples**: Use for results

```elixir
{:ok, result} | {:error, reason}
```

**Exceptions**: Only for exceptional cases

```elixir
raise ArgumentError, "invalid input"
```

**With Else**: Handle error cases

```elixir
with {:ok, result} <- do_something() do
  result
else
  {:error, :not_found} -> default_value()
  error -> handle_error(error)
end
```

### Concurrency

**GenServer**: Use for stateful processes

```elixir
defmodule Counter do
  use GenServer

  def init(initial_value) do
    {:ok, initial_value}
  end

  def handle_call(:get, _from, state) do
    {:reply, state, state}
  end
end
```

**Task**: Use for async operations

```elixir
task = Task.async(fn -> expensive_operation() end)
result = Task.await(task)
```

**Supervision**: Always supervise processes

```elixir
children = [
  {Counter, 0},
  {Worker, []}
]

Supervisor.start_link(children, strategy: :one_for_one)
```

### Testing Standards

**ExUnit**: Built-in testing framework

```elixir
defmodule UserTest do
  use ExUnit.Case

  test "creates user with valid data" do
    assert {:ok, user} = User.create(%{name: "John"})
    assert user.name == "John"
  end
end
```

**Doctests**: Test examples in documentation

```elixir
@doc """
Doubles a number.

## Examples

    iex> double(5)
    10
"""
def double(n), do: n * 2
```

### Security Practices

**Input Validation**: Validate all external input

- Use Ecto changesets for data validation
- Check types and formats

**SQL Injection**: Use Ecto queries

```elixir
from(u in User, where: u.id == ^user_id)
```

**Secrets Management**: Use runtime configuration

```elixir
# config/runtime.exs
config :my_app, api_key: System.get_env("API_KEY")
```

### Elixir Comprehensive Documentation

- **[Elixir README](../../../docs/explanation/software-engineering/programming-languages/elixir/README.md)**
- [Functional Programming](../../../governance/development/pattern/functional-programming.md)

---

## Phoenix Framework Standards

**Authoritative Source**: [docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/README.md](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/README.md)

**Foundation**: Builds on Elixir language standards above.

### Context Patterns

- Use contexts to group related functionality
- Keep contexts focused and bounded
- Contexts expose public API, hide implementation
- Use schemas within contexts for data structures

### Controllers and Views

- Keep controllers thin, delegate to contexts
- Use action fallback for error handling
- Render JSON with Jason for APIs
- Use Phoenix.HTML helpers for templates

### Routing

- Use resources for RESTful routes
- Scope routes by authentication requirements
- Use plugs for request pipeline customization
- Apply rate limiting at router level

### Channels and PubSub

- Use channels for real-time bidirectional communication
- Leverage Phoenix.PubSub for process communication
- Implement presence tracking for user activity
- Handle channel errors gracefully

### Data Access with Ecto

- Use Ecto schemas for data modeling
- Apply changesets for data validation
- Write composable Ecto queries
- Use Repo for database operations
- Apply database transactions for consistency

### REST API Design

- Use JSON:API or GraphQL conventions
- Implement proper HTTP status codes
- Apply authentication with Guardian or Pow
- Version APIs with URL prefixes or headers
- Document APIs with ExDoc

### Phoenix Comprehensive Documentation

**Core Patterns**:

- [Idioms](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__idioms.md)
- [Best Practices](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__best-practices.md)
- [Anti-Patterns](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__anti-patterns.md)

**Architecture & Configuration**:

- [Configuration](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__configuration.md)
- [Contexts](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__contexts.md)
- [Channels](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__channels.md)

**Data & Web**:

- [Data Access](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__data-access.md)
- [REST APIs](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__rest-apis.md)

**Quality & Operations**:

- [Security](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__security.md)
- [Testing](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__testing.md)
- [Performance](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__performance.md)
- [Observability](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__observability.md)
- [Deployment](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__deployment.md)
- [Version Migration](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__version-migration.md)

---

## Phoenix LiveView Standards

**Authoritative Source**: [docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph\_\_liveview.md](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__liveview.md)

**Foundation**: Builds on Phoenix Framework standards above.

### LiveView Lifecycle

- `mount/3` — Initialize socket state on first load
- `handle_params/3` — Handle URL parameter changes
- `handle_event/3` — Process client events
- `handle_info/2` — Handle process messages
- `render/1` — Generate HTML template

### State Management

- Use `assign/3` to update socket state
- Keep state minimal and normalized
- Use temporary assigns for one-time data
- Apply `Phoenix.Component.update/2` for derived state

### Event Handling

- Use `phx-click`, `phx-submit`, `phx-change` for user events
- Implement debouncing with `phx-debounce`
- Apply throttling with `phx-throttle`
- Use `phx-hook` for JavaScript interop

### Components

- Use function components for stateless UI
- Apply LiveComponent for stateful isolated components
- Keep components focused and reusable
- Pass assigns explicitly, avoid global state

### Real-time Updates

- Use `Phoenix.PubSub` for broadcasting updates
- Subscribe in `mount/3`, unsubscribe automatically
- Apply `push_event/3` for client-side JavaScript
- Use streams for efficient list updates

### Form Handling

- Use `Phoenix.Component.form/1` for forms
- Apply Ecto changesets for validation
- Implement inline validation with `phx-change`
- Handle file uploads with `allow_upload/3`

### Performance

- Use `temporary_assigns` for large datasets
- Apply pagination for long lists
- Implement lazy loading for images
- Use `Phoenix.LiveView.JS` for client-side DOM manipulation

### LiveView Testing

- Use `Phoenix.LiveViewTest` for integration tests
- Test lifecycle callbacks explicitly
- Verify events trigger expected state changes
- Test component rendering and interactions

### LiveView Comprehensive Documentation

- [Phoenix LiveView](../../../docs/explanation/software-engineering/platform-web/tools/elixir-phoenix/ex-soen-plwe-to-elph__liveview.md) — Complete LiveView patterns, lifecycle, components, testing

---

## Related Skills

- docs-applying-content-quality
- repo-practicing-trunk-based-development
