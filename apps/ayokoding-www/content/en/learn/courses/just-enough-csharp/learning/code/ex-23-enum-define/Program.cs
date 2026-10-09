var state = Status.Ready; // => Ready is the enum member being classified
var message = state switch // => selects an arm from the current Status
{
    Status.Ready => "start", // => Ready maps to start
    Status.Loading => "wait", // => Loading maps to wait
    Status.Failed => "retry", // => Failed maps to retry
    _ => "retry", // => unknown numeric status maps to retry
};
Console.WriteLine(message); // => Output: start

enum Status // => defines named status values
{
    Loading, // => underlying value 0
    Ready, // => selected named value
    Failed, // => underlying value 2
}
