# learning/code/ex-05-ipv4-binary-anatomy/ipv4_binary_anatomy.py
"""Example 5: IPv4 Binary Anatomy -- 192.0.2.10, Octet by Octet."""  # => co-03: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic


def octet_to_binary(octet: int) -> str:  # => co-03: one IPv4 octet (0-255) -> its 8-bit binary string, BY HAND
    """Convert a single 0-255 octet to its 8-bit binary string via repeated division by 2."""  # => co-03: documents octet_to_binary's contract -- no runtime output, just sets its __doc__
    if not 0 <= octet <= 255:  # => co-03: an IPv4 octet is EXACTLY one byte -- values outside this are invalid
        raise ValueError(f"{octet} is not a valid IPv4 octet (0-255)")  # => co-03: guards the byte-width invariant
    bits: list[str] = []  # => co-03: collects bits LEAST-significant-first, one per division, same as Example 1's algorithm
    working = octet  # => co-03: a local copy -- the loop mutates this, never the caller's `octet`
    for _ in range(8):  # => co-03: exactly 8 divisions -- one IPv4 octet is always 8 bits wide, even when it's 0
        bits.append(str(working % 2))  # => co-03: the next bit is this step's remainder (0 or 1)
        working //= 2  # => co-03: integer-divide by the base (2) -- the "repeated division" step
    return "".join(reversed(bits))  # => co-03: reverse -- bits came out LSB-first, MSB must print first


def ipv4_to_binary_octets(address: str) -> list[str]:  # => co-03: "192.0.2.10" -> 4 separate 8-bit binary strings
    """Split a dotted-decimal IPv4 address into its 4 octets, each rendered in binary."""  # => co-03: documents ipv4_to_binary_octets's contract -- no runtime output, just sets its __doc__
    parts = address.split(".")  # => co-03: dotted-decimal notation -- exactly 4 parts, separated by "."
    if len(parts) != 4:  # => co-03: IPv4 is always 4 octets -- anything else is malformed input
        raise ValueError(f"{address!r} does not have exactly 4 dotted octets")  # => co-03: guards the 4-octet invariant
    return [octet_to_binary(int(part)) for part in parts]  # => co-03: one binary string per octet, in address order


def binary_octets_to_ipv4(binary_octets: list[str]) -> str:  # => co-03: the EXACT inverse -- 4 binary strings -> dotted-decimal
    """Reassemble 4 binary octet strings back into dotted-decimal notation."""  # => co-03: documents binary_octets_to_ipv4's contract -- no runtime output, just sets its __doc__
    decimal_parts = [str(int(bits, 2)) for bits in binary_octets]  # => co-03: int(bits, 2) parses base-2 back to a decimal int
    return ".".join(decimal_parts)  # => co-03: rejoin with "." -- the dotted-decimal separator


if __name__ == "__main__":  # => co-03: entry point -- this block runs only when the file executes directly, not on import
    address = "192.0.2.10"  # => co-03: the syllabus's fixed test address
    binary_octets = ipv4_to_binary_octets(address)  # => co-03: hand-rolled octet-by-octet binary conversion
    print(f"{address} in binary, octet by octet:")  # => co-03: labels the following per-octet printout
    for decimal_str, bits in zip(address.split("."), binary_octets):  # => co-03: pairs each original decimal octet with its binary form
        print(f"  {decimal_str:>3} -> {bits}")  # => co-03: right-aligned decimal next to its 8-bit binary string
    dotted_binary = ".".join(binary_octets)  # => co-03: all 4 octets joined with "." -- the full 32-bit address, dot-separated
    print(f"full address in binary = {dotted_binary}")  # => co-03: the complete 32-bit pattern, still dot-separated for readability
    reconverted = binary_octets_to_ipv4(binary_octets)  # => co-03: reverse the hand-rolled conversion, octet by octet
    print(f"reconverted back to decimal = {reconverted}")  # => co-03: must land back on the ORIGINAL address
    assert reconverted == address, "binary -> decimal round-trip must recover the original address"  # => co-03: the round-trip claim
    expected_octets = [format(int(part), "08b") for part in address.split(".")]  # => co-03: cross-check against Python's own format()
    assert binary_octets == expected_octets, "hand-rolled binary must match Python's own format(n, '08b')"  # => co-03
    print(f"Round-trips to {address}, matches format(n, '08b'): True")  # => co-03: reached only if both asserts passed
    # => co-03: this file is self-verifying: if it exits 0, every assert above passed and the demonstrated claim held
