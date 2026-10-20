# Kata starter: write the registry, then compare with after/kata.py.
# => Names mapped to the capability each plugin provides.
plugins = []  # => TODO: write the registry rows
# => Match on the capability the task needs, not the brand name.
want = ""  # => TODO: name the needed capability
# => Empty means no provider, which is itself an honest answer.
found = ""  # => empty means no provider yet
# => Scan the registry in order and keep the first provider.
# => Order is a feature: curated registries list trusted providers first.
for name, provides in plugins:  # => scan the registry
    # => Capabilities describe work; names describe vendors.
    if provides == want:  # => this plugin can do the job
        found = name  # => record the provider
        break  # => first match wins
# => Print the provider so the trace shows who did the work.
print("provider:", found or "none")  # => Output names the plugin
