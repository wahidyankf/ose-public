"""The current user's install area on a real POSIX filesystem: private staging beside the final names, then renames.

Every file is written and flushed under a hidden name next to the name it will take, so the only moment an object
changes is one atomic rename. A directory FERRET creates is made ``0700`` whatever the umask, and a directory that
already exists keeps its mode and its files.
"""

import errno
import hashlib
import os
import secrets
import stat
import sys
import zipfile
from pathlib import Path

from typekit import Err, Ok, attempt

import ferret
from ferret.adapters.posix_storage import kind_of, tolerate, unavailable
from ferret.application.ports import InstalledFacts, SourceArtifact, StagedInstall, StagePlan
from ferret.domain.errors import FerretError, FerretResult
from ferret.domain.install import (
    ARTIFACT_FILE,
    ARTIFACT_MODE,
    DIRECTORY_MODE,
    LAUNCHER_FILE,
    LAUNCHER_MODE,
    MANIFEST_FILE,
    MANIFEST_MODE,
    InstallPaths,
    is_stage_name,
    is_version,
    stage_name,
)

MAX_ARTIFACT_BYTES = 64 * 1024 * 1024
MAX_MANIFEST_BYTES = 4096
MAX_LAUNCHER_BYTES = 4096
_CREATE = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC
_READ = os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC
_GONE = (FileNotFoundError, NotADirectoryError)
_KEPT = frozenset({errno.ENOTEMPTY, errno.EEXIST})


def running_artifact() -> Path | None:
    """The zipapp this process runs from, or ``None`` when FERRET runs from a source tree."""
    for parent in Path(ferret.__file__).parents:
        if parent.is_file() and zipfile.is_zipfile(parent):
            return parent
    return None


def _sha256_of(path: Path) -> str:
    """The SHA-256 of a regular file read without following a symlink, or ``""`` for one that cannot be an artifact."""
    digest = hashlib.sha256()
    size = 0
    try:
        descriptor = os.open(path, _READ)
    except OSError:
        return ""
    try:
        while chunk := os.read(descriptor, 1 << 16):
            size += len(chunk)
            if size > MAX_ARTIFACT_BYTES:
                return ""
            digest.update(chunk)
    except OSError:
        return ""
    finally:
        os.close(descriptor)
    return digest.hexdigest()


def _write_new(path: Path, content: bytes, mode: int) -> None:
    """Create ``path`` exclusively with exactly ``mode`` and flush ``content`` to disk before returning."""
    descriptor = os.open(path, _CREATE, mode)
    try:
        os.fchmod(descriptor, mode)
        view = memoryview(content)
        while view:
            view = view[os.write(descriptor, view) :]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _sync_directory(directory: Path) -> None:
    descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _names(directory: Path) -> list[str]:
    match attempt(lambda: os.listdir(directory), FileNotFoundError, NotADirectoryError):
        case Ok(names):
            return names
        case Err():
            return []


def _unlink_quietly(*paths: Path) -> None:
    for path in paths:
        try:
            os.unlink(path)
        except OSError:
            continue


class PosixUserInstall:
    """The install area under one home directory, with the running artifact as the thing to install."""

    def __init__(self, home: Path, *, path_variable: str, artifact: Path | None = None) -> None:
        self._paths = InstallPaths(home)
        self._path_variable = path_variable
        self._artifact = artifact
        self._content: bytes | None = None

    @property
    def paths(self) -> InstallPaths:
        return self._paths

    @property
    def path_variable(self) -> str:
        return self._path_variable

    @property
    def interpreter(self) -> Path:
        # The process reached here on an interpreter that can run FERRET, whether the shebang chose it or the
        # bootstrap guard restarted the archive on it. Pinning that one is what spares the next call the restart.
        return Path(sys.executable)

    def source(self) -> FerretResult[SourceArtifact]:
        path = running_artifact() if self._artifact is None else self._artifact
        if path is None:
            return unavailable()
        try:
            with path.open("rb") as stream:
                content = stream.read(MAX_ARTIFACT_BYTES + 1)
        except OSError:
            return unavailable()
        if len(content) > MAX_ARTIFACT_BYTES:
            return unavailable()
        # Staging copies these very bytes, so the digest reported here is the digest of what gets installed.
        self._content = content
        return Ok(SourceArtifact(path=path, sha256=hashlib.sha256(content).hexdigest()))

    def facts(self, path: Path) -> FerretResult[InstalledFacts]:
        match attempt(lambda: os.lstat(path), OSError):
            case Err(error):
                return Ok(InstalledFacts(kind="missing")) if isinstance(error, _GONE) else unavailable()
            case Ok(info):
                kind = kind_of(info.st_mode)
                owned = info.st_uid == os.geteuid()
                mode = stat.S_IMODE(info.st_mode)
                if kind == "file":
                    digest = "" if info.st_size > MAX_ARTIFACT_BYTES else _sha256_of(path)
                    return Ok(InstalledFacts(kind=kind, mode=mode, owned_by_current_user=owned, sha256=digest))
                if kind == "symlink":
                    try:
                        target = os.readlink(path)
                    except OSError:
                        return unavailable()
                    return Ok(InstalledFacts(kind=kind, mode=mode, owned_by_current_user=owned, target=target))
                return Ok(InstalledFacts(kind=kind, mode=mode, owned_by_current_user=owned))

    def read_manifest(self) -> FerretResult[bytes | None]:
        # A symlinked manifest is a fault, not an absent one: the manifest is the ownership commit point, so
        # anything standing where it belongs that FERRET did not write must stop the command.
        return self._read_small(self._paths.manifest, MAX_MANIFEST_BYTES, tolerate_link=False)

    def read_launcher(self) -> FerretResult[bytes | None]:
        # A link here is the shape installs had before the launcher became a script, so it reads as no script
        # rather than as a fault; the caller recognizes the link separately through ``facts``.
        return self._read_small(self._paths.launcher, MAX_LAUNCHER_BYTES, tolerate_link=True)

    @staticmethod
    def _read_small(path: Path, limit: int, *, tolerate_link: bool) -> FerretResult[bytes | None]:
        """One small file's bytes without following a symlink; an absent file reads as ``None``."""
        opened = attempt(lambda: os.open(path, _READ), OSError)
        if isinstance(opened, Err):
            error = opened.error
            if isinstance(error, _GONE) or (tolerate_link and error.errno in (errno.ELOOP, errno.EMLINK)):
                return Ok(None)
            return unavailable()
        descriptor = opened.value
        try:
            return Ok(os.read(descriptor, limit + 1))
        except OSError:
            return unavailable()
        finally:
            os.close(descriptor)

    def recover(self) -> FerretResult[None]:
        paths = self._paths
        locations = [(paths.bin, LAUNCHER_FILE)]
        if os.path.isdir(paths.share) and not os.path.islink(paths.share):
            locations.append((paths.share, MANIFEST_FILE))
            locations += [
                (paths.share / name, ARTIFACT_FILE)
                for name in sorted(_names(paths.share))
                if is_version(name) and os.path.isdir(paths.share / name) and not os.path.islink(paths.share / name)
            ]
        try:
            for directory, final in locations:
                for name in _names(directory):
                    if is_stage_name(name, final):
                        self._unlink_leftover(directory / name)
        except OSError:
            return unavailable()
        return Ok(None)

    @staticmethod
    def _unlink_leftover(path: Path) -> None:
        """Delete one staged leftover, but only a regular file or a link this user owns."""

        def unlink_if_ours() -> None:
            info = os.lstat(path)
            if (stat.S_ISREG(info.st_mode) or stat.S_ISLNK(info.st_mode)) and info.st_uid == os.geteuid():
                os.unlink(path)

        # A leftover already gone is nothing to delete; any other failure is the caller's.
        attempt(unlink_if_ours, FileNotFoundError)

    def stage(self, plan: StagePlan) -> FerretResult[StagedInstall]:
        content = self._content
        if content is None:
            return unavailable()
        paths = self._paths
        return self._create_directories(paths.share, paths.version_directory(plan.version), paths.bin).flat_map(
            lambda _: self._stage_files(plan, content)
        )

    def _stage_files(self, plan: StagePlan, content: bytes) -> FerretResult[StagedInstall]:
        """Write and verify the three staged files beside their final names, leaving none of them if that fails."""
        paths = self._paths
        nonce = secrets.token_hex(16)
        staged = StagedInstall(
            version=plan.version,
            artifact=paths.version_directory(plan.version) / stage_name(ARTIFACT_FILE, nonce),
            launcher=paths.bin / stage_name(LAUNCHER_FILE, nonce),
            manifest=paths.share / stage_name(MANIFEST_FILE, nonce),
        )
        written = self._write_and_verify(staged, plan, content)
        if isinstance(written, Err):
            _unlink_quietly(staged.artifact, staged.launcher, staged.manifest)
        return written.map(lambda _: staged)

    def _write_and_verify(self, staged: StagedInstall, plan: StagePlan, content: bytes) -> FerretResult[None]:
        try:
            _write_new(staged.artifact, content, ARTIFACT_MODE)
            _write_new(staged.manifest, plan.manifest, MANIFEST_MODE)
            _write_new(staged.launcher, plan.launcher, LAUNCHER_MODE)
            return self._verify(staged, content, plan.launcher)
        except OSError:
            return unavailable()

    def _missing_directories(self, directory: Path) -> FerretResult[list[Path]]:
        """The directories that must be created for ``directory`` to exist, or a refusal if something is in the way."""
        missing: list[Path] = []
        current = directory
        while not os.path.isdir(current):
            if os.path.lexists(current):
                return Err(FerretError("ferret.install.collision"))
            if current == self._paths.home or current == current.parent:
                return unavailable()
            missing.append(current)
            current = current.parent
        return Ok(missing)

    def _create_directories(self, *directories: Path) -> FerretResult[None]:
        """Make every directory ``0700`` whatever the umask, leaving each one that exists as it is.

        Every obstruction is found before the first directory is made, so a refused install creates nothing.
        """
        missing: set[Path] = set()
        for directory in directories:
            found = self._missing_directories(directory)
            if isinstance(found, Err):
                return found
            missing.update(found.value)
        for path in sorted(missing, key=lambda candidate: len(candidate.parts)):
            made = self._make_private(path)
            if isinstance(made, Err):
                return made
        return Ok(None)

    @staticmethod
    def _make_private(path: Path) -> FerretResult[None]:
        """Make one directory ``0700``; one that appeared in the meantime is left as it is."""

        def make() -> None:
            os.mkdir(path, DIRECTORY_MODE)
            os.chmod(path, DIRECTORY_MODE)

        return tolerate(make, FileExistsError)

    def _verify(self, staged: StagedInstall, content: bytes, launcher: bytes) -> FerretResult[None]:
        """Read all three staged files back: every mode and owner, the artifact's digest, the launcher's bytes."""
        modes = ((staged.artifact, ARTIFACT_MODE), (staged.manifest, MANIFEST_MODE), (staged.launcher, LAUNCHER_MODE))
        for path, mode in modes:
            info = os.lstat(path)
            if not stat.S_ISREG(info.st_mode) or stat.S_IMODE(info.st_mode) != mode or info.st_uid != os.geteuid():
                return unavailable()
        if _sha256_of(staged.artifact) != hashlib.sha256(content).hexdigest():
            return unavailable()
        return self._read_small(staged.launcher, MAX_LAUNCHER_BYTES, tolerate_link=False).flat_map(
            lambda read: Ok(None) if read == launcher else unavailable()
        )

    def replace_artifact(self, staged: StagedInstall) -> FerretResult[None]:
        return self._replace(staged.artifact, self._paths.artifact(staged.version))

    def replace_launcher(self, staged: StagedInstall) -> FerretResult[None]:
        return self._replace(staged.launcher, self._paths.launcher)

    def replace_manifest(self, staged: StagedInstall) -> FerretResult[None]:
        return self._replace(staged.manifest, self._paths.manifest)

    @staticmethod
    def _replace(staged: Path, final: Path) -> FerretResult[None]:
        try:
            os.replace(staged, final)
            _sync_directory(final.parent)
        except OSError:
            return unavailable()
        return Ok(None)

    def remove(self, path: Path) -> FerretResult[None]:
        return tolerate(lambda: os.unlink(path), FileNotFoundError)

    def remove_empty_directory(self, path: Path) -> FerretResult[None]:
        removed = attempt(lambda: os.rmdir(path), OSError)
        if isinstance(removed, Err):
            error = removed.error
            # A directory that still holds anything, or is not a plain directory, is someone's and stays.
            if isinstance(error, _GONE) or error.errno in _KEPT:
                return Ok(None)
            return unavailable()
        return Ok(None)
