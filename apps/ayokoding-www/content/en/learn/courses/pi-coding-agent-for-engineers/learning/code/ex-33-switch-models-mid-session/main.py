# Example 33: Switch Models Mid Session
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Release 1.3.0 drops stale thinking on model switch.
# => The new model never sees the old model's reasoning.
before = "anthropic/claude-default"  # => the starting provider and model
after = "ollama/llama-local"  # => the newly selected model
thinking_kept = False  # => cache survived the switch
print("before:", before)  # => Output names the start
print("after:", after)  # => Output names the target
print("thinking-kept:", thinking_kept)  # => Output states cache fate
