// => The member computes from record fields.
type Rectangle =
    // => These two named fields hold the rectangle dimensions.
    { Width: int; Height: int }
    // => Area is calculated from the current width and height.
    member this.Area = this.Width * this.Height
// => Construction still uses ordinary record syntax.
let shape = { Width = 3; Height = 4 }
// => The derived property is 12.
printfn "%d" shape.Area
