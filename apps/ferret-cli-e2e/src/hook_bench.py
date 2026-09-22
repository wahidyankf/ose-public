"""One isolated machine for adapter tests: a private HOME, the artifact behind a launcher, and a way to call it."""

import hashlib
import hmac
import sqlite3
from collections.abc import Mapping
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ferret_process import run_artifact
from hook_wrapper import CLEAN_PATH, HookRun, launcher, run_plugin, run_wrapper
from vendor_payloads import CANARIES, OPENCODE, WORKSPACE, encode

DATABASE = "ferret.sqlite3"


def derived(key: bytes, kind: str, *parts: str) -> str:
    """The identifier the contract derives: HMAC-SHA256 over the NUL-joined purpose and parts, first 16 bytes in hex."""
    message = b"\0".join(part.encode("utf-8") for part in ("ferret/id/1", kind, *parts))
    return f"{kind}_{hmac.new(key, message, hashlib.sha256).hexdigest()[:32]}"


@dataclass(slots=True)
class Bench:
    """A HOME holding an initialized FERRET store, and the launcher that runs the built artifact against it."""

    artifact: Path
    home: Path
    directory: Path
    ferret: Path

    @classmethod
    def create(cls, artifact: Path, home: Path, directory: Path, *, initialize: bool = True) -> Bench:
        bench = cls(artifact=artifact, home=home, directory=directory, ferret=launcher(directory, artifact))
        if initialize:
            initialized = run_artifact(artifact, ["init", "--json"], home=home)
            assert (initialized.returncode, initialized.stderr) == (0, b""), initialized
        return bench

    @property
    def data_home(self) -> Path:
        return self.home / ".local" / "share" / "ferret"

    @property
    def database(self) -> Path:
        return self.data_home / DATABASE

    def sql(self, statement: str, parameters: tuple[object, ...] = ()) -> list[tuple[Any, ...]]:
        with closing(sqlite3.connect(self.database)) as connection:
            return connection.execute(statement, parameters).fetchall()

    def stored(self) -> int:
        return int(self.sql("SELECT COUNT(*) FROM event")[0][0])

    def key(self) -> bytes:
        return (self.data_home / "identity.key").read_bytes()

    def written(self) -> bytes:
        """Every byte anything wrote under HOME, the write-ahead log and the launcher's directory included."""
        return b"".join(path.read_bytes() for path in sorted(self.directory.rglob("*")) if path.is_file())

    def forward(
        self,
        harness: str,
        event: str,
        document: Mapping[str, Any] | bytes,
        *,
        binary: Path | str | None = "default",
        path: str = CLEAN_PATH,
    ) -> HookRun:
        """Send one payload the way ``harness`` does: through the wrapper, or as a hook call to the OpenCode plugin.

        Every harness reports the same workspace, so one repository keeps one identifier whichever adapter saw it.
        """
        chosen = self.ferret if binary == "default" else binary
        assert chosen is None or isinstance(chosen, Path)
        if harness == OPENCODE:
            assert isinstance(document, Mapping)
            return run_plugin([document], home=self.home, binary=chosen, directory=Path(WORKSPACE), path=path)
        payload = document if isinstance(document, bytes) else encode(dict(document))
        return run_wrapper(harness, event, payload, home=self.home, binary=chosen, path=path)

    def leaks(self) -> list[str]:
        """The canaries found anywhere under this machine; a correct run leaves the list empty."""
        written = self.written()
        return [canary for canary in CANARIES if canary.encode() in written]
