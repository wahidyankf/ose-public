using OseId.Host;

// The entry point delegates immediately: every ordering decision that matters lives in
// OseIdProcess, where a test can reach it without starting a process.
return await OseIdProcess.RunAsync(args, Console.Error).ConfigureAwait(false);
