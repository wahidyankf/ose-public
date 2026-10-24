# => Fixture shim applying managed settings as a ceiling.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Values are fixed data; no policy is enforced here.
# => Real behaviour may differ; confirm with claude --help.
CEILING = {"sandbox": "on", "network": "deny"}  # => the organization ceiling
BELOW = {"sandbox": "off", "theme": "dark"}  # => lower layers try to differ


def apply(ceiling, below):  # => the ceiling wins every key it names
    merged = dict(below)  # => start from the lower layers
    merged.update(ceiling)  # => ceiling values overwrite all comers
    return merged  # => the effective settings


def main():  # => merge a ceiling over two lower values
    effective = apply(CEILING, BELOW)  # => sandbox on, network deny, theme dark
    print("sandbox:", effective["sandbox"])  # => Output: sandbox: on
    print("network:", effective["network"])  # => Output: network: deny
    print("theme:", effective["theme"])  # => Output: theme: dark


main()  # => run once; ceilings protect the non-negotiable
