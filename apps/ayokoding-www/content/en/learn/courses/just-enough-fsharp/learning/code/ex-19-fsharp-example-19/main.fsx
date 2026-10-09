// => The union describes both accepted shapes.
type Shape = Circle of float | Rectangle of float * float
// => Each branch extracts the case payload.
let area shape =
    // => Compare the union case before extracting its payload.
    match shape with
    // => Use radius 2.0 when the Circle case is selected.
    | Circle radius -> System.Math.PI * radius * radius
    // => Multiply the rectangle dimensions when that case is selected.
    | Rectangle(width, height) -> width * height
// => A 3 by 4 rectangle has area 12.
printfn "%.0f" (area (Rectangle(3.0, 4.0)))
