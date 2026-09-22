"""The release identity: the tag a release is cut from must round-trip to the version the artifact reports.

`pyproject.toml` and `ferret.__version__` are already held together by the command-contract suite. The third
literal is the git tag, which lives in `.github/workflows/ferret-cli-release.yml` and nothing here can run. So
this suite asserts the *property* that makes the tag trustworthy — compose a tag from the declared version, and
the workflow's own extraction must give the declared version back — rather than pinning the workflow's text.
A literal assertion here would break on the first legitimate edit and would say nothing about the rule it guards.
"""

import re
from pathlib import Path

import pytest

from ferret import __version__

WORKSPACE_ROOT = Path(__file__).resolve().parents[4]
WORKFLOW = WORKSPACE_ROOT / ".github" / "workflows" / "ferret-cli-release.yml"
VERSION_SOURCE = Path(__file__).resolve().parents[2] / "src" / "ferret" / "__init__.py"

TAG_GLOB = re.compile(r'^\s*-\s*"(?P<glob>[^"]+)\*"\s*$', re.MULTILINE)
TAG_STRIP = re.compile(r'^\s*TAG_VERSION="\$\{TAG#(?P<prefix>[^}]+)\}"\s*$', re.MULTILINE)


def workflow_text() -> str:
    assert WORKFLOW.is_file(), f"the release workflow is missing at {WORKFLOW}"
    return WORKFLOW.read_text(encoding="utf-8")


def test_the_release_workflow_exists_where_the_tag_contract_expects_it() -> None:
    assert workflow_text().startswith("name: ferret-cli-release\n")


def test_a_tag_built_from_the_declared_version_matches_the_trigger_glob() -> None:
    """The tag this project would cut must be one the workflow actually fires on."""
    text = workflow_text()
    globs = [match.group("glob") for match in TAG_GLOB.finditer(text)]

    assert globs, "the workflow declares no tag glob"
    tag = f"{globs[0]}{__version__}"
    assert tag.startswith(globs[0])
    assert any(tag.startswith(glob) for glob in globs)


def test_the_workflow_strips_the_tag_back_to_the_declared_version() -> None:
    """Round trip: compose the tag, apply the workflow's own strip, and the declared version comes back."""
    text = workflow_text()
    globs = [match.group("glob") for match in TAG_GLOB.finditer(text)]
    strips = [match.group("prefix") for match in TAG_STRIP.finditer(text)]

    assert strips, "the workflow never strips a prefix off the tag"
    tag = f"{globs[0]}{__version__}"
    assert tag.removeprefix(strips[0]) == __version__


def test_the_workflow_reads_the_version_from_the_file_that_declares_it() -> None:
    """The workflow's own source of truth must be this package's version literal, not a copy of it."""
    text = workflow_text()
    match = re.search(r"DECLARED=\$\(sed -n .+ (?P<path>\S+\.py)\)", text)

    assert match is not None, "the workflow does not read a declared version out of a Python file"
    assert (WORKSPACE_ROOT / match.group("path")).resolve() == VERSION_SOURCE


def effective_lines() -> list[str]:
    """The workflow without its comments, so prose describing the rule cannot satisfy or break a check of it."""
    return [line for line in workflow_text().splitlines() if not line.lstrip().startswith("#")]


@pytest.mark.parametrize("forbidden", ["git push", "refs/heads/"])
def test_the_release_workflow_writes_no_branch(forbidden: str) -> None:
    """D16 makes the release a tag-and-artifact operation; a branch write would make it a deploy instead."""
    offenders = [line for line in effective_lines() if forbidden in line]

    assert offenders == []


def test_the_release_workflow_fires_on_a_tag_and_never_on_a_branch() -> None:
    lines = effective_lines()

    assert any(line.strip() == "tags:" for line in lines)
    assert not any(line.strip().startswith("branches:") for line in lines)
