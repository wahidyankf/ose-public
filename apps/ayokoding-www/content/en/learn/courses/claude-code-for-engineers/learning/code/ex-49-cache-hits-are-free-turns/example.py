# => Fixture shim of prompt-cache savings on stable context.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Hit rates are fixed data; no cache exists here.
# => Real behaviour may differ; confirm with claude --help.
PREFIX = 10000  # => stable context tokens reused every turn
FRESH = 500  # => new tokens each turn actually reads


def cost(turns, hit):  # => bill turns with a cache hit rate applied
    saved = int(PREFIX * hit)  # => cached tokens skip the full read
    return turns * (PREFIX + FRESH - saved)  # => the billed total


def main():  # => bill five turns cached and uncached
    print("uncached:", cost(5, 0.0))  # => Output: uncached: 52500
    print("cached:", cost(5, 0.9))  # => Output: cached: 7500
    print("saved:", cost(5, 0.0) - cost(5, 0.9))  # => Output: saved: 45000


main()  # => run once; stable prefixes earn the cache
