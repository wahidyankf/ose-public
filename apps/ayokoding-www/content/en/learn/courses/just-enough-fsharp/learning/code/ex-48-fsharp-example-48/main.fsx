// => The interface describes one behavior.
type ILabel = abstract member Text: string
// => The class supplies that behavior.
type Item(name: string) =
    // => The explicit implementation exposes the stored name as Text.
    interface ILabel with member _.Text = name
// => Upcast to use the interface contract.
let label = Item("book") :> ILabel
// => This prints book.
printfn "%s" label.Text
