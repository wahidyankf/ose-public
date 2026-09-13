#!/bin/sh
# ex-28: +dnssec asks the resolver to return signature data alongside the
# answer -- an RRSIG record proves the ANSWER section was validated.
#
# This sandbox's default resolver (<sandbox-resolver>, an internal recursive
# resolver) answers with "recursion requested but not available" and omits
# the RRSIG for this particular query, even though the OPT PSEUDOSECTION
# shows "do" (DNSSEC OK) was honored. Querying a public DNSSEC-validating
# resolver directly (@8.8.8.8) gets a genuine signed answer -- example.com
# IS DNSSEC-signed, confirmed live below, not a reconstruction.
dig +dnssec example.com A @8.8.8.8
