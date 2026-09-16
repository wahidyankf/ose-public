using Xunit;

// Every E2E scenario reaches the same reserved loopback port and the same published
// output. Running two feature classes at once would make them contend for a fixed
// reservation, so this adapter is serial by construction rather than by retry.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
