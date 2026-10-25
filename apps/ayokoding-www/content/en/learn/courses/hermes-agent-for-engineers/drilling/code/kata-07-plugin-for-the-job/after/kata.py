# Kata 7: Plugin for the Job
# => Extensions add tools Hermes itself never shipped with.
# => The shim models a registry: names mapped to capabilities.
# => A missing capability is a lookup miss, never a silent stub.
plugins = [
    ("db-viewer", "schema-graph"),
    ("review-bot", "diff-summary"),
]  # => the frozen extension registry
want = "schema-graph"  # => the capability this task needs
# => Search the registry for a plugin providing the capability.
# => First provider wins; ties are a config smell worth naming.
found = ""  # => empty means no provider, which is itself an answer
for name, provides in plugins:  # => scan the registry in order
    # => Match on the capability, not the plugin's brand name.
    # => Capabilities describe work; names describe vendors.
    if provides == want:  # => this plugin can do the job
        found = name  # => record the provider and stop looking
        break  # => first match wins by registry order
# => Hermes merges extension settings under the plugin's own key.
# => Namespacing keeps two plugins from fighting over one knob.
merged = {"db-viewer.depth": "3"}  # => namespaced extension setting
# => Print the provider so the trace shows who did the work.
print("provider:", found or "none")  # => Output names the plugin
# => The setting echoes back so mis-merges surface immediately.
print("setting:", merged)  # => Output shows the merged knob
