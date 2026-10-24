# => Fixture shim resolving settings precedence across five layers.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Layers are fixed data; no settings are read here.
# => Real behaviour may differ; confirm with claude --help.
LAYERS = ["managed", "cli", "local", "project", "user"]  # => highest precedence first
VALUES = {
    "project": "ask",
    "user": "allow",
    "local": "deny",
}  # => the key set in three layers


def resolve(layers, values):  # => the highest present layer wins the key
    for layer in layers:  # => walk from managed down to user
        if layer in values:  # => first present layer decides
            return layer, values[layer]  # => layer name plus its value
    return None, None  # => unset everywhere means the default applies


def main():  # => resolve one key set in three of five layers
    layer, value = resolve(LAYERS, VALUES)  # => local wins over project and user
    print("layer:", layer)  # => Output: layer: local
    print("value:", value)  # => Output: value: deny


main()  # => run once; precedence decides, proximity does not
