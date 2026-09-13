# learning/capstone/code/subnet.py
"""Capstone Step 1: a CIDR subnet calculator -- network/broadcast/host-range/host-count.

Ties together co-01 (encapsulation-adjacent addressing groundwork) and co-04 (CIDR and subnetting)
into one small, reusable module -- the same bit-arithmetic shape Example 8's `subnet.py` introduced,
now re-verified against THREE fresh, hand-computed CIDR blocks the beginner tier never used.
"""  # => co-04: this file's own restated purpose, doubling as its module __doc__
# => co-04: no runtime output beyond setting __doc__ -- the three paragraphs above just orient the reader

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

import ipaddress  # => co-04: stdlib IPv4Network -- used ONLY to turn one block's hand-computed offsets into expected addresses, never by the calculator itself
from dataclasses import dataclass  # => co-04: a typed record beats a bare tuple for this multi-field CIDR report


@dataclass(frozen=True)  # => co-04: frozen -- a computed subnet report is a VALUE, never mutated after construction
class SubnetReport:  # => co-04: everything co-04 says is arithmetically derivable from a CIDR block, in one record
    cidr: str  # => co-04: the original input, e.g. "203.0.113.0/28" -- kept for readable reporting
    network_address: str  # => co-04: the ALL-HOST-BITS-ZERO address -- identifies the subnet itself, not a host
    broadcast_address: str  # => co-04: the ALL-HOST-BITS-ONE address -- reaches every host on the subnet at once
    first_host: str  # => co-04: network_address + 1 -- the first USABLE host address
    last_host: str  # => co-04: broadcast_address - 1 -- the last USABLE host address
    host_count: int  # => co-04: usable hosts = 2**host_bits - 2 (network and broadcast are never assignable)


def ip_to_int(address: str) -> int:  # => co-04: dotted-decimal -> one 32-bit integer -- makes bitwise math possible
    """Pack a dotted-decimal IPv4 address into a single 32-bit integer."""  # => co-04: documents ip_to_int's contract -- no runtime output, just sets its __doc__
    octets = [int(part) for part in address.split(".")]  # => co-04: 4 decimal octets, each 0-255
    value = 0  # => co-04: accumulator -- built up one octet at a time, most-significant first
    for octet in octets:  # => co-04: process octets in address order (leftmost = most significant)
        value = (value << 8) | octet  # => co-04: shift the accumulator left 8 bits, then OR in the next octet
    return value  # => co-04: returns this computed value to the caller


def int_to_ip(value: int) -> str:  # => co-04: the EXACT inverse of ip_to_int -- one 32-bit integer -> dotted-decimal
    """Unpack a 32-bit integer back into dotted-decimal IPv4 notation."""  # => co-04: documents int_to_ip's contract -- no runtime output, just sets its __doc__
    octets = [(value >> shift) & 0xFF for shift in (24, 16, 8, 0)]  # => co-04: extract each byte, most-significant first
    return ".".join(str(octet) for octet in octets)  # => co-04: rejoin with "." -- the dotted-decimal separator


def compute_subnet(cidr: str) -> SubnetReport:  # => co-04: the calculator itself -- "203.0.113.0/28" -> a full SubnetReport
    """Compute network/broadcast/host-range/host-count for a CIDR block."""  # => co-04: documents compute_subnet's contract -- no runtime output, just sets its __doc__
    address_part, prefix_part = cidr.split("/")  # => co-04: split "203.0.113.0/28" into its address and prefix-length parts
    prefix_len = int(prefix_part)  # => co-04: the /N -- how many leading bits are the NETWORK portion
    host_bits = 32 - prefix_len  # => co-04: everything else is the HOST portion -- how many addresses this subnet spans
    address_int = ip_to_int(address_part)  # => co-04: the input address, as one 32-bit integer
    mask_int = ((1 << prefix_len) - 1) << host_bits if prefix_len > 0 else 0  # => co-04: N leading 1-bits, host_bits trailing 0-bits
    network_int = address_int & mask_int  # => co-04: AND with the mask clears every HOST bit -- this IS the network address
    broadcast_int = network_int | (~mask_int & 0xFFFFFFFF)  # => co-04: OR with the inverted mask sets every HOST bit to 1
    host_count = max((1 << host_bits) - 2, 0)  # => co-04: total addresses minus network and broadcast (never negative for /31, /32)
    return SubnetReport(  # => co-04: assembles every derived field into one immutable report
        cidr=cidr,  # => co-04: echoes the original input for the printed report
        network_address=int_to_ip(network_int),  # => co-04: converts the computed network integer back to dotted-decimal
        broadcast_address=int_to_ip(broadcast_int),  # => co-04: converts the computed broadcast integer back to dotted-decimal
        first_host=int_to_ip(network_int + 1),  # => co-04: one past the network address -- the first assignable host
        last_host=int_to_ip(broadcast_int - 1),  # => co-04: one before the broadcast address -- the last assignable host
        host_count=host_count,  # => co-04: the usable-host count derived above
    )  # => co-04: closes the multi-line construct opened above


if __name__ == "__main__":  # => co-04: entry point -- this block runs only when the file executes directly, not on import
    slash_20 = ipaddress.IPv4Network("172.16.0.0/20")  # => co-04: indexing a network by offset N yields its Nth address -- independent of the bit math under test
    hand_computed = {  # => co-04: THREE hand-computed CIDR blocks this script's output must match exactly -- one small, one medium, one large
        "203.0.113.0/28": SubnetReport(  # => co-04: /28 -- a small 16-address block (TEST-NET-3, RFC 5737), 14 usable hosts
            "203.0.113.0/28",  # => co-04: cidr
            "203.0.113.0",  # => co-04: network_address
            "203.0.113.15",  # => co-04: broadcast_address
            "203.0.113.1",  # => co-04: first_host
            "203.0.113.14",  # => co-04: last_host
            14,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
        "172.16.0.0/20": SubnetReport(  # => co-04: /20 -- a medium 4096-address block, 4094 usable hosts
            "172.16.0.0/20",  # => co-04: cidr
            str(slash_20[0]),  # => co-04: network_address -- offset 0, every host bit zero
            str(slash_20[4095]),  # => co-04: broadcast_address -- offset 2**12 - 1 = 4095, every host bit one
            str(slash_20[1]),  # => co-04: first_host -- offset 1
            str(slash_20[4094]),  # => co-04: last_host -- offset 4095 - 1 = 4094
            4094,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
        "198.51.100.128/25": SubnetReport(  # => co-04: /25 -- a half-of-a-/24 block starting at a NON-zero octet, 126 usable hosts
            "198.51.100.128/25",  # => co-04: cidr
            "198.51.100.128",  # => co-04: network_address
            "198.51.100.255",  # => co-04: broadcast_address
            "198.51.100.129",  # => co-04: first_host
            "198.51.100.254",  # => co-04: last_host
            126,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
    }  # => co-04: closes the multi-line construct opened above
    for cidr, expected in hand_computed.items():  # => co-04: one full report per CIDR block, checked against the hand-computed expectation
        info = compute_subnet(cidr)  # => co-04: runs the calculator under test
        print(f"{info.cidr}:")  # => co-04: labels the following per-field printout
        print(f"  network   = {info.network_address}")  # => co-04: the subnet's own identifying address
        print(f"  broadcast = {info.broadcast_address}")  # => co-04: the all-hosts address for this subnet
        print(f"  hosts     = {info.first_host} - {info.last_host} ({info.host_count} usable)")  # => co-04: the assignable range
        assert info == expected, f"{cidr} must match its hand-computed SubnetReport exactly"  # => co-04: the exact-match check
    print("\nAll three CIDR blocks match their hand-computed expectations: True")  # => co-04: reached only if every assert above passed
    # => co-04: this file is self-verifying: if it exits 0, every assert above passed and the demonstrated claim held
    # => co-04: this capstone step deliberately reuses Example 8's exact bit-arithmetic shape, re-verified against THREE fresh prefixes it never checked -- proof the technique generalizes, not just a rehash
