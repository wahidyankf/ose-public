# Example 9: Print Mode One Shot
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Pi ships four modes: interactive, print/JSON, RPC, SDK.
run_mode = "print"  # => the mode under test
# => The prompt is the exact text Pi would receive.
prompt = "explain this regex"  # => frozen user request
# => The reply is what the mode returns for that prompt.
reply = "one-paragraph answer"  # => frozen mode output
# => Structured modes add a machine-readable envelope.
envelope = "stdout only"  # => wrapper keys around the reply
# => Print mode, prompt, reply, and envelope in order.
print("mode:", run_mode)  # => Output names the mode
print("prompt:", prompt)  # => Output echoes the prompt
print("reply:", reply)  # => Output shows the reply
print("envelope:", envelope)  # => Output names the envelope
