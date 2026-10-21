# => Example 11: from links the wrapper to its cause.
class ConfigError(Exception):  # => domain error: what the caller catches
    pass  # => no extra behavior: the type name carries the meaning


def load_port(raw):  # => parse a port field, wrapping failures
    try:  # => the risky parse sits alone in try
        return int(raw)  # => may raise ValueError on bad text
    except ValueError as cause:  # => WHY name it: the cause must be linked
        raise ConfigError(f"bad port: {raw!r}") from cause  # => chain kept


try:  # => the caller sees the domain error, not the parse detail
    load_port("many")  # => raises ConfigError chained to ValueError
except ConfigError as err:  # => handled at the domain level
    print("wrapped:", err)  # => Output: wrapped: bad port: 'many'
    print("cause:", type(err.__cause__).__name__)  # => Output: cause: ValueError
