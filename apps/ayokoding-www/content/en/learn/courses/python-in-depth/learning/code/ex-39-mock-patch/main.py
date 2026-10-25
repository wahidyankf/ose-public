# => Example 39: the seam stubbed, the logic real.
from unittest.mock import patch  # => WHY mock: boundaries stubbed, logic tested


def fetch(url):  # => the boundary: slow I/O in production
    raise NotImplementedError("network")  # => never called under test


def titles(urls):  # => the caller: pure logic over fetched rows
    return [fetch(url)["title"] for url in urls]  # => real branches, unreal data


with patch(__name__ + ".fetch") as stub:  # => WHY here: patch where looked up
    stub.side_effect = [{"title": "a"}, {"title": "b"}]  # => fixed answers in order
    got = titles(["u1", "u2"])  # => caller runs for real against the stub
print(got)  # => Output: ['a', 'b'], logic proven without I/O
print(stub.call_count)  # => Output: 2, one fetch per url
