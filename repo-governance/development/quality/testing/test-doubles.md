---
description: >-
  Selects the test double for each collaborator: in-memory fakes over mocks for owned ports, stubs for external
  services, spies only where the interaction is the behaviour, and real domain objects always.
when_to_use: >-
  Use when a test needs to replace a collaborator, or when reviewing a test that mocks, stubs, or spies on something.
---

# Test Doubles

A test double stands in for a collaborator so a test runs fast and gives the same answer every time. Each kind of double
freezes a different part of the collaborator in place, and the wrong kind produces a test that passes against the double
while the system itself is broken.

This standard implements [Reproducibility](../../../principles/software-engineering/reproducibility.md),
[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md), and
[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md).

## The Kinds

| Double | What it is                                                       | A test using it asserts on             |
| ------ | ---------------------------------------------------------------- | -------------------------------------- |
| fake   | a working, simplified implementation, such as an in-memory store | the state the code under test leaves   |
| stub   | an object returning fixed, deterministic answers                 | the result the code under test returns |
| spy    | an object recording the calls it receives                        | the interaction itself                 |
| mock   | an object programmed in advance with the calls it expects        | the calls the code happens to make     |

## Prefer an In-Memory Fake to a Mock

Where the collaborator is something the application owns and persists through, such as a repository, use an in-memory
implementation instead of a mock. [Hexagonal Architecture](../../pattern/hexagonal-architecture.md) already requires
such an adapter for every output port used in unit tests, and runs the port's contract suite against it; that suite is
what makes the fake trustworthy.

A mock of the same collaborator encodes how the code currently calls it. Rename a method, merge two saves into one, or
read before writing, and the test fails although the behaviour is unchanged. A fake checks the outcome, so the test
survives a refactoring that keeps behaviour and fails on one that breaks it. It also needs no mocking library.

## Stub External Services

A service outside the repository's control, such as a payment gateway or a notification service, is replaced with a stub
that returns a deterministic response. The test then exercises the code's handling of that response without the network,
the service's availability, or its side effects. Where Hexagonal Architecture applies, that double is the port's
in-memory adapter, a fake returning deterministic responses and held to its contract suite.

The real service is still exercised, at the level `Composition Roots and Test Adapters` assigns to adapters reached
over the network.

## Spy Only When the Interaction Is the Behaviour

Use a spy only where the call is itself what the code is required to do, such as publishing an event after a
calculation. Everywhere else, assert on the result or the resulting state. A mock is not used where a fake, stub, or spy
serves.

Asserting on calls that are not the requirement ties the test to how the code works rather than to what it does, which
is the brittleness the preference for fakes exists to avoid.

## Never Replace Domain Objects

Entities, value objects, and aggregates are never mocked, stubbed, or faked. Tests use the real ones.

Domain objects are the logic under test. A test that replaces one checks the answers configured on the double instead of
the rule, and it keeps passing when the rule is wrong. They depend on no infrastructure, so a double isolates nothing.

## Enforcement

Review checks each new double against the kinds above. An adopter wanting a mechanical check refuses doubles of domain
types in its own lint or test gate.
