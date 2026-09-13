# learning/code/ex-08-subnet-calculator-script/subnet.py
"""Example 8: Subnet Calculator -- Network, Broadcast, Host Range, Host Count."""  # => co-04: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

import ipaddress  # => co-04: stdlib IPv4Network -- used ONLY to turn this file's hand-computed offsets into expected addresses, never by the calculator itself
from dataclasses import dataclass  # => co-04: a typed record beats a bare tuple for this multi-field CIDR report


@dataclass(frozen=True)  # => co-04: frozen -- a computed subnet report is a VALUE, never mutated after construction
class SubnetInfo:  # => co-04: everything co-04 says is arithmetically derivable from a CIDR block, in one record
    cidr: str  # => co-04: the original input, e.g. "192.168.1.0/24" -- kept for readable reporting
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


def compute_subnet(cidr: str) -> SubnetInfo:  # => co-04: the calculator itself -- "192.168.1.0/24" -> a full SubnetInfo
    """Compute network/broadcast/host-range/host-count for a CIDR block."""  # => co-04: documents compute_subnet's contract -- no runtime output, just sets its __doc__
    address_part, prefix_part = cidr.split("/")  # => co-04: split "192.168.1.0/24" into its address and prefix-length parts
    prefix_len = int(prefix_part)  # => co-04: the /N -- how many leading bits are the NETWORK portion
    host_bits = 32 - prefix_len  # => co-04: everything else is the HOST portion -- how many addresses this subnet spans
    address_int = ip_to_int(address_part)  # => co-04: the input address, as one 32-bit integer
    mask_int = ((1 << prefix_len) - 1) << host_bits if prefix_len > 0 else 0  # => co-04: N leading 1-bits, host_bits trailing 0-bits
    network_int = address_int & mask_int  # => co-04: AND with the mask clears every HOST bit -- this IS the network address
    broadcast_int = network_int | (~mask_int & 0xFFFFFFFF)  # => co-04: OR with the inverted mask sets every HOST bit to 1
    host_count = max((1 << host_bits) - 2, 0)  # => co-04: total addresses minus network and broadcast (never negative for /31, /32)
    return SubnetInfo(  # => co-04: assembles every derived field into one immutable report
        cidr=cidr,  # => co-04: echoes the original input for the printed report
        network_address=int_to_ip(network_int),  # => co-04: converts the computed network integer back to dotted-decimal
        broadcast_address=int_to_ip(broadcast_int),  # => co-04: converts the computed broadcast integer back to dotted-decimal
        first_host=int_to_ip(network_int + 1),  # => co-04: one past the network address -- the first assignable host
        last_host=int_to_ip(broadcast_int - 1),  # => co-04: one before the broadcast address -- the last assignable host
        host_count=host_count,  # => co-04: the usable-host count derived above
    )  # => co-04: closes the multi-line construct opened above


if __name__ == "__main__":  # => co-04: entry point -- this block runs only when the file executes directly, not on import
    slash_24 = ipaddress.IPv4Network("192.168.1.0/24")  # => co-04: indexing a network by offset N yields its Nth address -- independent of the bit math under test
    slash_26 = ipaddress.IPv4Network("10.0.0.0/26")  # => co-04: the same offset lookup for the smaller block
    hand_computed = {  # => co-04: two CIDR blocks, each expectation built from hand-computed offsets, that this script's output must match exactly
        "192.168.1.0/24": SubnetInfo(  # => co-04: /24 -- the classic "class C"-sized subnet, 254 usable hosts
            "192.168.1.0/24",  # => co-04: cidr
            str(slash_24[0]),  # => co-04: network_address -- offset 0, every host bit zero
            str(slash_24[255]),  # => co-04: broadcast_address -- offset 2**8 - 1 = 255, every host bit one
            str(slash_24[1]),  # => co-04: first_host -- offset 1
            str(slash_24[254]),  # => co-04: last_host -- offset 255 - 1 = 254
            254,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
        "10.0.0.0/26": SubnetInfo(  # => co-04: /26 -- a smaller subnet nested inside a /24, 62 usable hosts
            "10.0.0.0/26",  # => co-04: cidr
            str(slash_26[0]),  # => co-04: network_address -- offset 0, every host bit zero
            str(slash_26[63]),  # => co-04: broadcast_address -- offset 2**6 - 1 = 63, every host bit one
            str(slash_26[1]),  # => co-04: first_host -- offset 1
            str(slash_26[62]),  # => co-04: last_host -- offset 63 - 1 = 62
            62,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
    }  # => co-04: closes the multi-line construct opened above
    for cidr, expected in hand_computed.items():  # => co-04: one full report per CIDR block, checked against the hand-computed expectation
        info = compute_subnet(cidr)  # => co-04: runs the calculator under test
        print(f"{info.cidr}:")  # => co-04: labels the following per-field printout
        print(f"  network   = {info.network_address}")  # => co-04: the subnet's own identifying address
        print(f"  broadcast = {info.broadcast_address}")  # => co-04: the all-hosts address for this subnet
        print(f"  hosts     = {info.first_host} - {info.last_host} ({info.host_count} usable)")  # => co-04: the assignable range
        assert info == expected, f"{cidr} must match its hand-computed SubnetInfo exactly"  # => co-04: the exact-match check
    print("Both CIDR blocks match their hand-computed expectations: True")  # => co-04: reached only if both asserts passed
    # => co-04: this file is self-verifying: if it exits 0, every assert above passed and the demonstrated claim held
