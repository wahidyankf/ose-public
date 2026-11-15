---
description: Consumer-correctness examples for error messages, naming, and defaults.
when_to_use: Use when reviewing an error message, a public name, or a default value.
---

# How It Applies

## Error Messages

Prefer `config file 'app.yml' is missing the required key 'database.url'; set it to the
connection string` over `invalid config (E42)`. The first names the cause and the fix; the
second sends the consumer searching.

## Naming

Prefer one exact name carried across the flag, the config key, the docs, and the error text.
When a rename is unavoidable, fail loudly on the old name with a pointer to the new one rather
than accepting both silently.

## Defaults

Prefer rejecting an invalid value with a reason over quietly substituting a default. A default
is consumer-correct only when it is documented, visible, and safe — never a guess about what an
invalid input meant.
