INotifier notifier = new ConsoleNotifier(); // => interface reference holds ConsoleNotifier
notifier.Send(new Notice("Saved")); // => Output: Saved

record Notice(string Text); // => stores the notification text

interface INotifier // => declares delivery through an interface
{
    void Send(Notice n); // => accepts a Notice value
}

class ConsoleNotifier : INotifier // => concrete class supplies the Send behavior
{
    public void Send(Notice n) => Console.WriteLine(n.Text); // => prints the notice text
}
