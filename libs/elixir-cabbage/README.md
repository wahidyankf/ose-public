# elixir-cabbage

OSE fork of [cabbage-ex/cabbage](https://github.com/cabbage-ex/cabbage) (v0.4.1, MIT).

A story BDD tool for Elixir — compiles `.feature` files to ExUnit tests at compile time.

See [FORK_NOTES.md](./FORK_NOTES.md) for rationale and changes from upstream.

## Usage

```elixir
defmodule MyApp.SomeFeatureTest do
  use Cabbage.Feature, file: "some_feature.feature"

  defgiven ~r/^I have a step$/, _vars, _state do
    :ok
  end

  defthen ~r/^it passes$/, _vars, _state do
    assert true
  end
end
```

Configure the features path in `config/test.exs`:

```elixir
config :elixir_cabbage, features: "specs/apps/my-app/"
```

## Development

```bash
mix deps.get
mix test
mix cover.lcov   # coverage with LCOV output
mix credo --strict
mix format --check-formatted
```
