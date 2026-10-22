# => Example 29: mix new scaffolds the layout every tool expects.
project = Path.join(System.tmp_dir!(), "elixir_in_depth_ex29") # => the fixed tmp project path.
# => Remove any stale scaffold so the run starts from a fixed state.
File.rm_rf!(project) # => clean slate: delete any leftover scaffold.
# => mix new writes the scaffold offline; no dependency fetch happens yet.
{_out, 0} = System.cmd("mix", ["new", project]) # => scaffold; assert exit zero.
# => The scaffold promises a manifest, a lib entry, and a test entry.
mix? = File.exists?(Path.join(project, "mix.exs")) # => the manifest must exist.
# => The module file name replaces dashes with underscores by convention.
lib? = File.exists?(Path.join([project, "lib", "elixir_in_depth_ex29.ex"])) # => the lib entry must exist.
test? = File.exists?(Path.join([project, "test", "elixir_in_depth_ex29_test.exs"])) # => the test entry must exist.
# => The manifest names the app atom the generator derived from the path.
has_app = project |> Path.join("mix.exs") |> File.read!() |> String.contains?("app: :elixir_in_depth_ex29") # => app atom check.
# => Remove only the scaffold this script created.
File.rm_rf!(project) # => leave no trace: delete the scaffold we made.
# => Print the scaffold checklist with fixed labels.
IO.puts("mix=#{mix?} lib=#{lib?} test=#{test?} app=#{has_app}") # => the four-way scaffold proof.
