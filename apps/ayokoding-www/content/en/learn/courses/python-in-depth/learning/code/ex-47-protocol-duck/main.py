# => Example 47: structure qualifies, inheritance not needed.
from typing import Protocol  # => WHY Protocol: methods, not ancestry


class Closeable(Protocol):  # => the contract: one method, narrow
    def close(self) -> None:  # => implement this signature to qualify
        ...  # => WHY ellipsis: the contract declares, never implements


class FileHandle:  # => WHY unrelated: no shared base with Connection
    def close(self) -> None:  # => matches the protocol structurally
        print("file closed")  # => Output path for the file kind


class Connection:  # => a second unrelated implementation
    def close(self) -> None:  # => same signature, different resource
        print("connection closed")  # => Output path for the network kind


def shutdown(target: Closeable) -> None:  # => WHY protocol: both qualify
    target.close()  # => the only operation the contract promises


shutdown(FileHandle())  # => Output: file closed, structural match
shutdown(Connection())  # => Output: connection closed, no base shared
