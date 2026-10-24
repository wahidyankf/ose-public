# => Kata starter: resolve the key below across layers.
# => Run the reference solution to see the target resolution.
LAYERS = ["managed", "cli", "local", "project", "user"]  # => highest first
VALUES = {"user": "allow", "project": "ask", "cli": "deny"}  # => three competing values


def resolve(layers, values):  # => TODO: return the winning layer and value
    return None, None  # => TODO: replace with the real walk
