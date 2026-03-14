%{
  configs: [
    %{
      name: "default",
      strict: true,
      files: %{
        included: ["lib/", "test/"],
        excluded: [~r"/_build/", ~r"/deps/"]
      },
      checks: [
        {Credo.Check.Readability.MaxLineLength, max_length: 120},
        {Credo.Check.Warning.WrongTestFileExtension,
         included: [~r/_test\.exs$/], excluded: [~r/_steps\.exs$/]}
      ]
    }
  ]
}
