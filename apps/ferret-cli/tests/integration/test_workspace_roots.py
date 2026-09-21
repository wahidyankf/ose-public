"""Workspace roots on a real filesystem: the nearest ancestor with a ``.git`` entry, found through symlinks."""

from pathlib import Path

from ferret.adapters.posix_workspace import PosixWorkspaceRoots


def root_of(directory: Path | str) -> str:
    return PosixWorkspaceRoots().root_of(str(directory))


def real(path: Path) -> str:
    return str(path.resolve())


def test_a_repository_directory_is_its_own_root(tmp_path: Path) -> None:
    repository = tmp_path / "repo"
    (repository / ".git").mkdir(parents=True)

    assert root_of(repository) == real(repository)


def test_a_nested_directory_belongs_to_the_repository_that_contains_it(tmp_path: Path) -> None:
    repository = tmp_path / "repo"
    (repository / ".git").mkdir(parents=True)
    nested = repository / "packages" / "one" / "src"
    nested.mkdir(parents=True)

    assert root_of(nested) == real(repository)


def test_a_worktree_marks_its_root_with_a_git_file(tmp_path: Path) -> None:
    worktree = tmp_path / "worktrees" / "feature"
    (worktree / "src").mkdir(parents=True)
    (worktree / ".git").write_text("gitdir: /elsewhere/.git/worktrees/feature\n")

    assert root_of(worktree / "src") == real(worktree)


def test_the_nearest_repository_wins_over_an_outer_one(tmp_path: Path) -> None:
    outer = tmp_path / "outer"
    inner = outer / "vendor" / "inner"
    (outer / ".git").mkdir(parents=True)
    (inner / ".git").mkdir(parents=True)

    assert root_of(inner / "lib") == real(inner)
    assert root_of(outer / "vendor") == real(outer)


def test_a_dangling_git_link_still_marks_a_root(tmp_path: Path) -> None:
    repository = tmp_path / "repo"
    repository.mkdir()
    (repository / ".git").symlink_to(tmp_path / "missing")

    assert root_of(repository) == real(repository)


def test_a_symlinked_directory_is_resolved_to_where_it_really_lives(tmp_path: Path) -> None:
    repository = tmp_path / "repo"
    (repository / ".git").mkdir(parents=True)
    (repository / "src").mkdir()
    (tmp_path / "shortcut").symlink_to(repository / "src")

    assert root_of(tmp_path / "shortcut") == real(repository)


def test_a_directory_that_does_not_exist_still_belongs_to_the_repository_above_it(tmp_path: Path) -> None:
    repository = tmp_path / "repo"
    (repository / ".git").mkdir(parents=True)

    assert root_of(repository / "deleted" / "later") == real(repository)


def test_a_directory_outside_any_repository_is_its_own_root(tmp_path: Path) -> None:
    plain = tmp_path / "plain" / "deeper"
    plain.mkdir(parents=True)

    assert root_of(plain) == real(plain)


def test_a_path_that_does_not_exist_anywhere_is_returned_as_given(tmp_path: Path) -> None:
    missing = tmp_path / "nowhere" / "at" / "all"

    assert root_of(missing) == real(tmp_path) + "/nowhere/at/all"
