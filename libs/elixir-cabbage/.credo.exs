%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "test/"],
        excluded: []
      },
      strict: true,
      color: true,
      checks: [
        {Credo.Check.Design.AliasUsage, false},
        {Credo.Check.Readability.Specs, false},

        # Pre-existing upstream issues (cabbage-ex/cabbage 0.4.1) — suppressed at fork time.
        # Fix these in a follow-up PR to keep the initial fork diff reviewable.

        # Alias ordering in loader.ex and other files
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature/loader.ex
        {Credo.Check.Readability.AliasOrder, false},

        # More than 3 quotes in test files
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/test/feature_suggestion_test.exs
        {Credo.Check.Readability.StringSigils, false},

        # Nesting depth in feature.ex compile_step and helpers.ex
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature.ex
        {Credo.Check.Refactor.Nesting, false},

        # Parameter pattern matching consistency in helpers.ex, feature.ex
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature/helpers.ex
        {Credo.Check.Consistency.ParameterPatternMatching, false},

        # Predicate function names (is_* pattern used in helper checks)
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature/missing_step_error.ex
        {Credo.Check.Readability.PredicateFunctionNames, false},

        # TODO tags in test files — intentional upstream annotations, not production code
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/test/feature_suggestion_test.exs
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/test/feature_execution_test.exs
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/test/feature_attributes_test.exs
        {Credo.Check.Design.TagTODO, false},

        # Missing @moduledoc / @moduledoc false in library modules
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage.ex
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature/loader.ex
        {Credo.Check.Readability.ModuleDoc, false},

        # Zero-arity function definitions with parentheses in cabbage.ex and feature.ex
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage.ex
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature.ex
        {Credo.Check.Readability.ParenthesesOnZeroArityDefs, false},

        # Enum.map/2 |> Enum.join/2 pattern — upstream style, more readable in context
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature/missing_step_error.ex
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature/cucumber_expression.ex
        {Credo.Check.Refactor.MapJoin, false},

        # Cyclomatic complexity in __before_compile__ macro (generated code, inherently complex)
        # https://github.com/cabbage-ex/cabbage/blob/v0.4.1/lib/cabbage/feature.ex
        {Credo.Check.Refactor.CyclomaticComplexity, false}
      ]
    }
  ]
}
