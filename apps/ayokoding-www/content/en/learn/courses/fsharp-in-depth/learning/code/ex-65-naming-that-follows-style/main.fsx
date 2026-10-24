// => Example 65: styled names versus translated accent; same answers.
module Roster = // => PascalCase module: the styled package.
    // => PascalCase record with PascalCase fields: the styled shape.
    type Student = { Name: string; Score: int } // => the domain type, styled.
    // => camelCase function: the styled door into the module.
    let passMark (student: Student) = student.Score >= 60 // => the styled rule.
// => Accent version: identical logic wearing another language's casing.
module Accent = // => the translated accent, quarantined in one module.
    type student = { name: string; score: int } // => lowercase shape: same fields.
    let PassMark s = s.score >= 60 // => PascalCase function: same test.
// => Both spellings agree on both students: style moved, logic did not.
let ada = { Roster.Student.Name = "ada"; Roster.Student.Score = 95 } // => styled construction.
let lin = { Accent.student.name = "lin"; Accent.student.score = 42 } // => accent construction.
printfn "styled=%b accent=%b" (Roster.passMark ada) (Accent.PassMark lin) // => styled=true accent=false.
