# => Redact-then-log: secret values never reach output.
# => Markers name the keys; values are replaced wholesale.
lines = ["model: anthropic/claude", "api_key: sk-live-42", "workspace: notes", "token: bearer-xyz"]  # => four fixture lines, two carrying secrets
# => lines has 4 entries (type: list)
markers = ["api_key", "token"]  # => the two secret markers this policy knows
# => markers has 2 entries (type: list)
safe = []  # => safe collects redacted lines ready to log
for line in lines:  # => scan every line before logging
    clean = line  # => clean starts as the raw line
    for marker in markers:  # => test each secret marker
        if line.startswith(marker + ":"):  # => a line starting with a marker carries a secret
            # => two lines match
            clean = marker + ": [REDACTED]"  # => replace the whole value, keep the key name
            # => clean hides sk-live-42 and bearer-xyz
    safe.append(clean)  # => keep the redacted line for the log
for line in safe:  # => emit only redacted lines
    print("log: " + line)  # => Output: four log lines, two redacted
leaked = any("sk-live" in l or "bearer" in l for l in safe)  # => scan the safe lines for raw secret text
# => leaked is False
print("secrets leaked: " + str(leaked))  # => Output: secrets leaked: False
