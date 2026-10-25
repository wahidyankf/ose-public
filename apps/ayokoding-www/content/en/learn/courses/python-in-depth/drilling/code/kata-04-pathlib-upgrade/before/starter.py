# => Kata 4 starter: string surgery with platform assumptions.
def join(base, name):  # => concatenation with a hardcoded separator
    return base + "/" + name  # => breaks on Windows, doubles on trailing slash


def stem(path):  # => suffix chop by splitting on dots
    return path.split("/")[-1].split(".")[0]  # => three splits, three assumptions


print(join("/data", "a.txt"))  # => /data/a.txt: works here, today
print(stem("/data/archive.tar.gz"))  # => archive: wrong, double suffix lost
