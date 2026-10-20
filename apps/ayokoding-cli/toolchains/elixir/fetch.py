#!/usr/bin/env python3
"""Seed the Hex package cache from mix.lock.

Usage: fetch.py <lockfile>. Each ``{:hex, ...}`` entry contributes its
name and version to a seed project under /tmp, whose ``mix deps.get``
populates HEX_HOME (fixed by the recipe) with the registry entry and the
tarball over the network. Every fetched tarball is then verified against
the lock's own checksum, and the build fails naming the package on any
hash difference, missing tarball, failed resolution, or malformed lock;
the unit never starts.
"""

import hashlib
import os
import re
import subprocess
import sys

ENTRY = re.compile(
    r'\{:hex, :([A-Za-z0-9_]+), "([^"]+)", "[0-9a-f]+",'
    r' \[[^\]]*\], \[[^\]]*\], "[^"]+", "([0-9a-f]+)"\}'
)


def fail(message):
    print("fetch: " + message, file=sys.stderr)
    sys.exit(1)


def main(argv):
    if len(argv) != 2:
        print("usage: fetch.py <lockfile>", file=sys.stderr)
        sys.exit(2)
    try:
        with open(argv[1], encoding="utf-8") as handle:
            lock = handle.read()
    except OSError as exc:
        fail("cannot read lockfile %s: %s" % (argv[1], exc))
    deps = ENTRY.findall(lock)
    if not deps:
        fail("lockfile %s names no hex packages" % argv[1])
    seed = "/tmp/hexseed"
    os.makedirs(seed, exist_ok=True)
    specs = ", ".join('{%s, "%s"}' % (":" + name, version) for name, version, _ in deps)
    project = (
        "defmodule Hexseed.MixProject do\n"
        "  use Mix.Project\n\n"
        "  def project do\n"
        '    [app: :hexseed, version: "0.1.0", deps: [%s]]\n'
        "  end\nend\n" % specs
    )
    with open(os.path.join(seed, "mix.exs"), "w", encoding="utf-8") as handle:
        handle.write(project)
    proc = subprocess.run(["mix", "deps.get"], cwd=seed, capture_output=True, text=True)
    if proc.returncode != 0:
        tail = (proc.stderr + proc.stdout)[-2000:]
        fail("mix deps.get failed: " + tail)
    hex_home = os.environ.get("HEX_HOME", os.path.expanduser("~/.hex"))
    for name, version, inner in deps:
        tarball = os.path.join(
            hex_home, "packages", "hexpm", "%s-%s.tar" % (name, version)
        )
        try:
            with open(tarball, "rb") as handle:
                actual = hashlib.sha256(handle.read()).hexdigest()
        except OSError as exc:
            fail("cached tarball missing for %s %s: %s" % (name, version, exc))
        if actual.lower() != inner.lower():
            fail("hash mismatch for package %s %s" % (name, version))
        print("fetched %s %s" % (name, version))


if __name__ == "__main__":
    main(sys.argv)
