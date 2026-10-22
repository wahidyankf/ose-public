// Example 34: Resolver Picks Compatible Versions.
//
// A registry holds many versions of one crate; the manifest allows a
// range, and the resolver picks the highest version inside it. The picker
// below models that choice over a fixed registry table: parse versions,
// keep the ones the range allows, and report the maximum, or refuse when
// the range matches nothing at all.
// => caret ranges (^1.2.3) allow patch and minor bumps, never a new major
// => the resolver maximizes inside the range: newest allowed always wins

// Version is three numbers: comparisons run left to right, major first.
// => tuple order derives the comparison: major, then minor, then patch
// => parsing fails on any non-number: the registry index is trusted input
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Version {
    // => field order mirrors the comparison: major decides first
    major: u32,
    // => u32 parts: version numbers never go negative
    minor: u32,
    // => minor rides second: same major compares here next
    patch: u32,
    // => patch decides last: only ties reach this field
}

// parse_version splits "1.2.3" into its three numeric parts or refuses.
// => exactly three parts: "1.2" and "1.2.3.4" are both shapeless here
// => each part must parse as u32: letters never reach the comparison
fn parse_version(text: &str) -> Option<Version> {
    // => Option, not Result: shapeless text is ordinary, not an error
    // => split on dots: more or fewer than three parts means malformed
    let parts: Vec<&str> = text.split('.').collect();
    // => Vec borrows the text: parts point into the input, costing nothing
    if parts.len() != 3 {
        // => length first: wrong shape rejects before any parsing
        return None;
        // => bare None: no evidence needed, the shape already spoke
    }
    // => parse each part in order: the first failure rejects the version
    let major = parts[0].parse::<u32>().ok()?;
    // => .ok()? converts: parse failure becomes suite-wide None
    let minor = parts[1].parse::<u32>().ok()?;
    let patch = parts[2].parse::<u32>().ok()?;
    Some(Version {
        major,
        minor,
        patch,
    })
    // => shorthand init: field names match the bindings above
}

// allows_caret answers whether a version sits inside the ^range floor.
// => the floor sets major and minor: versions below the floor are out
// => the ceiling holds the major: 2.0.0 never satisfies ^1.anything
fn allows_caret(floor: Version, candidate: Version) -> bool {
    // => Copy args: versions pass by value, cheaply and honestly
    // => below the floor compares less: rejected before the ceiling check
    if candidate < floor {
        // => derived Ord compares: major first, no manual chain needed
        return false;
    }
    // => caret pins the major: same major, any minor or patch above floor
    candidate.major == floor.major
}

// resolve picks the highest registry version the caret range allows.
// => parse the floor or refuse: a shapeless range resolves nothing
// => the max over the allowed set wins: newest allowed always builds
fn resolve(range_floor: &str, registry: &[&str]) -> Result<String, String> {
    // => owned String leaves: the winner outlives the borrowed registry
    // => the floor must parse: the range is trusted as little as the index
    let floor = parse_version(range_floor)
        .ok_or_else(|| format!("range floor {range_floor:?} is not x.y.z"))?;
    // => parse every registry entry, keep the allowed ones, take the max
    let mut allowed: Vec<Version> = registry
        .iter()
        .filter_map(|text| parse_version(text))
        // => shapeless entries drop silently: the index may hold junk
        .filter(|version| allows_caret(floor, *version))
        .collect();
    // => sort so the maximum sits last: the sort also shows the allowed set
    allowed.sort();
    // => derived Ord sorts: the same order the floor check used
    // => the last allowed version wins: newest inside the range, by order
    allowed
        .last()
        .map(|version| format!("{}.{}.{}", version.major, version.minor, version.patch))
        .ok_or_else(|| format!("no registry version satisfies ^{range_floor}"))
}

fn main() {
    // => one registry, three ranges: wide, narrow, and empty
    // => a fixed registry index: six versions across two major lines
    let registry = ["1.0.0", "1.2.3", "1.9.0", "1.10.0", "2.0.0", "0.9.9"];
    // => three ranges: one wide, one narrow, one matching nothing at all
    for floor in ["1.2.3", "1.9.0", "3.0.0"] {
        // => resolve prints the winner or the honest empty-range refusal
        match resolve(floor, &registry) {
            Ok(winner) => println!("^{floor} resolves to {winner}"),
            Err(reason) => println!("^{floor}: refused: {reason}"),
        }
    }
}
