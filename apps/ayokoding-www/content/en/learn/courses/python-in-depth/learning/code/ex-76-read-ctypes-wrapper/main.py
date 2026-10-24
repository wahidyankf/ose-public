# => Example 76: the boundary reviewed in three questions.
import ctypes  # => WHY ctypes: the foreign side needs declaring

libc = ctypes.CDLL(None)  # => the loaded C library for this review
libc.strlen.argtypes = [ctypes.c_char_p]  # => WHY types first: lying types corrupt
libc.strlen.restype = ctypes.c_size_t  # => the count returns whole


def byte_len(data):  # => WHY narrow: one Pythonic helper per operation
    if not isinstance(data, bytes):  # => WHY guard: the boundary validates input
        raise TypeError("bytes required")  # => host exception, not a crash
    if b"\x00" in data:  # => WHY check: C stops at the first NUL
        raise ValueError("NUL byte truncates")  # => mapped before calling out
    return libc.strlen(data)  # => the single foreign call, fully guarded


print(byte_len(b"ada"))  # => Output: 3, declared and validated
try:  # => the NUL guard demonstrated safely
    byte_len(b"a\x00b")  # => would truncate in C: refused here
except ValueError:  # => mapped to a host exception
    print("NUL refused")  # => Output: NUL refused
