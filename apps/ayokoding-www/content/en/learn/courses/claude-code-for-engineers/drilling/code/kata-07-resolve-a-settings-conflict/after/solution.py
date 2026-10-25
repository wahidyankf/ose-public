# => Kata reference: highest present layer wins the key.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Layers are fixed data; no settings are read here.
LAYERS = ["managed", "cli", "local", "project", "user"]  # => highest first
VALUES = {"user": "allow", "project": "ask", "cli": "deny"}  # => three competing values


def resolve(layers, values):  # => walk highest first, first present wins
    for layer in layers:  # => managed down to user, in order
        if layer in values:  # => cli is the first present layer here
            return layer, values[layer]  # => the winning pair
    return None, None  # => unset everywhere means the default


def main():  # => resolve one key across three layers
    layer, value = resolve(LAYERS, VALUES)  # => cli wins with deny
    print("layer:", layer)  # => Output: layer: cli
    print("value:", value)  # => Output: value: deny


main()  # => run once; compare your starter against this walk
