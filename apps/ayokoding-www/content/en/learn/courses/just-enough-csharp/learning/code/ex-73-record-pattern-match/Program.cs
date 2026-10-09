var result = new Result(true, "saved"); // => record has Ok true and Message saved
Console.WriteLine( // => writes the selected switch result
    result switch // => inspects the Result record
    {
        { Ok: true } => "ok", // => true Ok chooses ok
        _ => "retry", // => other states choose retry
    }
); // => Output: ok

record Result(bool Ok, string Message); // => defines the Ok and Message properties
