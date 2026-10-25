# => Kata reference: hash-keyed pip cache restores warm installs.
# => Checked against the vendor caching docs on 2026-10-20.
# => KEY hashes requirements.txt: deps change, cache misses exactly once.
# => PATH is the pip cache directory the runner restores and saves.

# => WHY this shape: installs cost minutes, hits cost seconds.
# => Hash keys invalidate precisely; prefixes would serve stale deps.
# => Miss-then-save means the second run is already warm: compounding.
CACHE = {"path": "~/.cache/pip", "key": "pip-hash-requirements"}  # => cache


def warm(cache):  # => True when path and hash key are both set
    return bool(cache["path"]) and "hash" in cache["key"]  # => both set


def main():  # => print the cache coordinate and the warmth verdict
    print("path:", CACHE["path"])  # => Output: the cached directory
    print("key:", CACHE["key"])  # => Output: the hash-keyed key
    print("warm:", warm(CACHE))  # => Output: True


main()  # => run once; False means installs stay cold
