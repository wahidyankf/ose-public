#!/usr/bin/env python3
"""Fetch one .crate per Cargo.lock entry into a vendor directory.

Usage: fetch.py <lockfile> <target-dir>. Each ``[[package]]`` entry with a
checksum is downloaded from static.crates.io, verified against its SHA-256
checksum, and extracted to ``<target-dir>/<name>-<version>/`` with the
``.cargo-checksum.json`` a directory source needs. Entries without a
checksum (workspace members) are skipped. Any hash difference, missing
entry, failed download, or non-crates.io source fails the build naming the
package, and the unit never starts.
"""

import hashlib
import json
import os
import sys
import tarfile
import urllib.request

CRATES_IO_SOURCE = "registry+https://github.com/rust-lang/crates.io-index"
DOWNLOAD_URL = "https://crates.io/api/v1/crates/{name}/{version}/download"


def fail(message):
    print("fetch: " + message, file=sys.stderr)
    sys.exit(1)


def parse_lock(path):
    packages = []
    current = {}
    try:
        with open(path, encoding="utf-8") as handle:
            lines = handle.read().splitlines()
    except OSError as exc:
        fail("cannot read lockfile %s: %s" % (path, exc))
    for raw in lines:
        line = raw.strip()
        if line == "[[package]]":
            if current.get("checksum"):
                packages.append(current)
            current = {}
            continue
        if "=" in line and current is not None:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value.startswith('"') and value.endswith('"'):
                current[key] = value[1:-1]
    if current.get("checksum"):
        packages.append(current)
    return packages


def download(name, version):
    url = DOWNLOAD_URL.format(name=name, version=version)
    request = urllib.request.Request(url, headers={"User-Agent": "ayokoding-fetch"})
    try:
        with urllib.request.urlopen(request) as response:
            return response.read()
    except Exception as exc:
        fail("fetch failed for package %s %s: %s" % (name, version, exc))


def extract(archive, dest):
    os.makedirs(dest, exist_ok=True)
    try:
        with tarfile.open(fileobj=archive, mode="r:gz") as tar:
            members = tar.getmembers()
            roots = {m.name.split("/")[0] for m in members if "/" in m.name}
            if len(roots) != 1:
                fail("unexpected archive layout under %s" % dest)
            root = roots.pop()
            for member in members:
                if "/" not in member.name:
                    continue
                member.name = member.name[len(root) + 1 :]
                tar.extract(member, dest, filter="data")
    except Exception as exc:
        fail("extract failed under %s: %s" % (dest, exc))


def write_checksum(dest, package_sha):
    files = {}
    for base, _, names in os.walk(dest):
        for entry in names:
            path = os.path.join(base, entry)
            rel = os.path.relpath(path, dest)
            if rel == ".cargo-checksum.json":
                continue
            with open(path, "rb") as handle:
                files[rel] = hashlib.sha256(handle.read()).hexdigest()
    record = {"files": files, "package": package_sha}
    with open(
        os.path.join(dest, ".cargo-checksum.json"), "w", encoding="utf-8"
    ) as handle:
        json.dump(record, handle, indent=2, sort_keys=True)
        handle.write("\n")


def main(argv):
    if len(argv) != 3:
        print("usage: fetch.py <lockfile> <target-dir>", file=sys.stderr)
        sys.exit(2)
    lockfile, target = argv[1], argv[2]
    os.makedirs(target, exist_ok=True)
    for package in parse_lock(lockfile):
        name = package.get("name", "")
        version = package.get("version", "")
        checksum = package.get("checksum", "")
        source = package.get("source", CRATES_IO_SOURCE)
        if source != CRATES_IO_SOURCE:
            fail("unsupported source for package %s %s: %s" % (name, version, source))
        body = download(name, version)
        actual = hashlib.sha256(body).hexdigest()
        if actual.lower() != checksum.lower():
            fail("hash mismatch for package %s %s" % (name, version))
        import io

        dest = os.path.join(target, "%s-%s" % (name, version))
        extract(io.BytesIO(body), dest)
        write_checksum(dest, checksum)
        print("fetched %s %s" % (name, version))


if __name__ == "__main__":
    main(sys.argv)
