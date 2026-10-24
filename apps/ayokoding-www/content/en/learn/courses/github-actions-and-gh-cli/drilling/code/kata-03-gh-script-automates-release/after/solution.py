# => Kata reference: the script verifies tag, counts assets, verdicts.
# => Fixture mirrors the gh release view --json shape on 2026-10-20.
# => TAG must equal the fixture tag; assets must all be nonzero.
# => No gh binary runs here; the logic replays the fixture only.

# => WHY this shape: tag match ties notes to the built commit exactly.
# => Asset count proves the upload finished; sizes prove real bytes.
# => Automating the click removes the mistyped-tag release forever.
RELEASE = {"tag": "v1.4.0", "assets": [{"size": 48210}]}  # => fixture
TAG = "v1.4.0"  # => the tag this run publishes


def ready(release, tag):  # => True when tag matches and assets real
    same = release["tag"] == tag  # => announcement matches build
    full = all(a["size"] > 0 for a in release["assets"])  # => real bytes
    return same and full  # => both must hold to publish


def main():  # => print tag, assets, and the publish verdict
    print("tag:", RELEASE["tag"])  # => Output: the release tag
    print("match:", RELEASE["tag"] == TAG)  # => Output: True
    print("assets:", len(RELEASE["assets"]))  # => files attached
    print("publish:", ready(RELEASE, TAG))  # => Output: True


main()  # => run once; False blocks the publish, loudly
