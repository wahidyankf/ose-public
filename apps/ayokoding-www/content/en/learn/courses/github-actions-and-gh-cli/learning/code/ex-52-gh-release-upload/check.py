# => Offline simulator for a gh release command over a fixture.
# => Fixture mirrors the gh release view --json shape on 2026-10-20.
# => No gh binary and no network; reads release.json only.
# => WHY fixtures: tag state is frozen, assertions stay stable.
# => Asset names and sizes replay byte-identically every run.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
ASSET = "shop-1.4.0.tar.gz"  # => file this upload run attaches


def load():  # => read the frozen release record
    text = (HERE / "release.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => prove the asset is recorded with a nonzero size
    rel = load()  # => frozen release record after upload
    names = [a["name"] for a in rel["assets"]]  # => attached file names
    print("asset:", ASSET)  # => Output: the uploaded file
    print("attached:", ASSET in names)  # => True when upload landed
    size = [a["size"] for a in rel["assets"] if a["name"] == ASSET]  # => bytes
    print("size:", size[0] if size else 0)  # => nonzero means real bytes


main()  # => run once; zero size means an empty upload slipped through
