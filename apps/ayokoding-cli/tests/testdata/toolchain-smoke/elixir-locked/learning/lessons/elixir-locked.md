# Elixir locked dependencies hello

The unit resolves one package from the locked cache and prints a fixed line.

**`learning/code/ex-01-hellothoas/mix.exs`**

```elixir
defmodule Hellothoas.MixProject do
  use Mix.Project

  def project do
    [
      app: :hellothoas,
      version: "0.1.0",
      elixir: "~> 1.20",
      deps: [{:thoas, "1.2.1"}]
    ]
  end
end
```

**Output** (`learning/code/ex-01-hellothoas/expected/main.stdout.txt`):

```text
{"answer":42}
```
