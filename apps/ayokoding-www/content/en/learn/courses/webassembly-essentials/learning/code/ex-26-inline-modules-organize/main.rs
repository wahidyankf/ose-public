// Example 26: Inline Modules Organize.
//
// A module is a namespace with a fence: items inside see each other, and
// only pub items show outside. Inline `mod name { ... }` keeps a small
// crate in one file while the fence already teaches the visibility rules
// the multi-file split in Example 27 will reuse unchanged.
// => private by default: the fence hides helpers unless marked pub
// => use brings names in: paths stay short without losing their origin

// geometry owns shapes and measures behind one namespace fence.
// => everything unmarked stays inside: only area and describe escape
// => submodules nest: units describe themselves one level down
mod geometry {
    // => inline mod keeps one file: the fence without the file split yet
    // => Rectangle is public: callers name the type across the fence
    #[derive(Debug)]
    pub struct Rectangle {
        // => two f64 sides: fractional measures, not whole pixel counts
        // => fields stay private: construction and reads go through fns
        width: f64,
        height: f64,
    }

    // => the constructor is public: the face needs a front door
    impl Rectangle {
        // => one impl block holds every Rectangle method together
        // => pub fn escapes the fence: the only way to build one outside
        pub fn new(width: f64, height: f64) -> Option<Rectangle> {
            // => the guard keeps geometry honest: sides must be positive
            if width <= 0.0 || height <= 0.0 {
                return None;
            }
            Some(Rectangle { width, height })
            // => shorthand init: each field name matches its parameter name
        }

        // => area reads private fields freely: inside sees everything
        pub fn area(&self) -> f64 {
            self.width * self.height
            // => borrowing self: measuring never consumes the shape
        }
    }

    // => units is a nested fence: labels for measures live one level down
    pub mod units {
        // => the nested fence has its own address: geometry::units::describe
        // => describe pairs a number with its unit label for printing
        pub fn describe(value: f64, unit: &str) -> String {
            format!("{value} {unit}")
            // => inline args capture: no positional list to keep in sync
        }
    }

    // => perimeter stays private: the module uses it, callers never see it
    fn perimeter(shape: &Rectangle) -> f64 {
        // => free function in the module: no self, just a shape on loan
        2.0 * (shape.width + shape.height)
        // => borrows the private fields: the helper reads what outsiders cannot
    }

    // => describe is the public face: area plus units in one sentence
    pub fn describe(shape: &Rectangle) -> String {
        // => &Rectangle in, String out: the fence converts shape to sentence
        // => private perimeter is callable here: inside the same fence
        let edge = perimeter(shape);
        // => edge is a local: the perimeter value waits for the format below
        // => the nested units module qualifies its own helper explicitly
        format!(
            "{} (edge {})",
            units::describe(shape.area(), "sq units"),
            edge
        )
    }
}

fn main() {
    // => two constructions: valid sides print, invalid sides refuse
    // => construction through the public gate: invalid sides return None
    match geometry::Rectangle::new(3.0, 4.0) {
        // => the fence path names the module: geometry::Rectangle, always
        Some(shape) => println!("{}", geometry::describe(&shape)),
        // => unreachable for positive sides: the guard only fires below 0
        None => println!("refused: sides must be positive"),
    }
    // => invalid sides demonstrate the refusal with exit still 0
    match geometry::Rectangle::new(-1.0, 4.0) {
        // => unreachable: negative width trips the constructor guard
        Some(shape) => println!("{}", geometry::describe(&shape)),
        // => the honest refusal: no invalid shape ever exists to print
        None => println!("refused: sides must be positive"),
    }
}
