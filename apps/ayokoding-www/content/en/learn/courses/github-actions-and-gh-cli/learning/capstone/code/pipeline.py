# => Capstone validator: test, build, and publish must agree before release.
# => Checked against the vendor workflow docs on 2026-10-20.
# => Reads the three workflow files plus the release-notes fixture.
# => No network and no live repository; agreement is checked as text.
# => WHY one report: the pipeline ships only when every stage agrees.
# => Golden file expected/main/main.stdout.txt records the agreement.
import json  # => parse the release-notes fixture
from pathlib import Path  # => locate the stage files beside this script


HERE = Path(__file__).resolve().parent  # => capstone code directory
STAGES = ["test.yaml", "build.yaml", "publish.yaml"]  # => stages in order


def read(name):  # => read a stage file into one searchable string
    return (HERE / name).read_text(encoding="utf-8")  # => raw file text


def stage_ok(name, text):  # => one verdict per pipeline stage
    needs = {  # => fragment each stage must contain
        "test.yaml": ["matrix:", "cache: pip"],
        "build.yaml": ["upload-artifact", "name: dist"],
        "publish.yaml": ["id-token: write", "environment: production"],
    }  # => end of the per-stage expectations
    missing = [f for f in needs[name] if f not in text]  # => gaps
    return (not missing, missing)  # => verdict plus evidence


def release_ok():  # => the release fixture must match the tag pipeline
    rel = json.loads((HERE / "release.json").read_text(encoding="utf-8"))  # => fix
    tag_ok = rel["tag"].startswith("v")  # => version tag shape
    assets_ok = all(a["size"] > 0 for a in rel["assets"])  # => real bytes
    return (tag_ok and assets_ok, rel["tag"], len(rel["assets"]))  # => verdict


def main():  # => print one line per stage plus the release verdict
    good = 0  # => stages passing so far
    for name in STAGES:  # => stages in pipeline order
        ok, missing = stage_ok(name, read(name))  # => check the stage
        good += 1 if ok else 0  # => count the passes
        extra = "" if ok else " missing " + ",".join(missing)  # => evidence
        print(("PASS" if ok else "FAIL") + ": " + name + extra)  # => row
    ok, tag, assets = release_ok()  # => check the release fixture
    good += 1 if ok else 0  # => count the release check too
    print(("PASS" if ok else "FAIL") + ": release " + tag)  # => release row
    print("assets:", assets)  # => files the release would attach
    print("stages:", str(good) + "/4")  # => overall pipeline verdict
    print("ship:", good == 4)  # => True only when everything agrees


main()  # => run once; ship True means the pipeline may run live
