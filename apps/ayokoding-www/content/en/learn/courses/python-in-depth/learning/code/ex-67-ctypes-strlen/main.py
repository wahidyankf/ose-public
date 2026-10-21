# => Example 67: C strlen called with no compiler involved.
import ctypes  # => WHY ctypes: foreign calls without extensions

libc = ctypes.CDLL(None)  # => WHY None: libc already lives in the process
libc.strlen.argtypes = [ctypes.c_char_p]  # => WHY declare: pointers need types
libc.strlen.restype = ctypes.c_size_t  # => WHY restype: the count comes back whole
print(libc.strlen(b"ada"))  # => Output: 3, C counts the bytes
print(libc.strlen(b""))  # => Output: 0, empty is zero, not an error
print(libc.strlen(b"hello") == len(b"hello"))  # => Output: True, C agrees with Python
