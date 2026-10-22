# => Example 50: persistence shares structure; only the spine is copied.
base = Enum.to_list(1..100)
# => Prepending shares the whole tail; the base list is never copied.
extended = [0 | base]
# => The head differs while the tail is the identical structure, provably.
IO.puts("head_base=#{hd(base)} head_ext=#{hd(extended)} len=#{length(extended)}")
# => Maps share unchanged subtrees; only the edited path is rebuilt.
config = %{db: %{host: "db", pool: 5}, web: %{port: 4000}}
# => put_in rebuilds the db branch and reuses the web branch untouched.
bigger = put_in(config, [:db, :pool], 10)
# => Equality on the untouched branch proves the sharing is value-safe.
IO.puts("pool=#{bigger.db.pool} web_same=#{bigger.web == config.web}")
# => The original config still holds the old pool: nothing mutated anywhere.
IO.puts("orig_pool=#{config.db.pool}")
