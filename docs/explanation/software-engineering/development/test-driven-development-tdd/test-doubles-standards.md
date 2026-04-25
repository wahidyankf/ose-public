---
title: "TDD Test Doubles Standards"
description: OSE Platform standards for mocks, stubs, spies, and fakes
category: explanation
subcategory: development
tags:
  - tdd
  - testing
  - test-doubles
  - mocking
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-09
---

# TDD Test Doubles Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding TDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for using test doubles (mocks, stubs, fakes).

## REQUIRED: Prefer In-Memory Implementations

**REQUIRED**: Use in-memory implementations over mocks when possible.

**Good** (in-memory implementation):

```java
class InMemoryDonationRepository implements DonationRepository {
    private Map<DonationId, Donation> donations = new HashMap<>();

    @Override
    public void save(Donation donation) {
        donations.put(donation.getId(), donation);
    }

    @Override
    public Optional<Donation> findById(DonationId id) {
        return Optional.ofNullable(donations.get(id));
    }
}

@Test
void shouldSaveAndRetrieveDonation() {
    // No mocking framework needed
    DonationRepository repository = new InMemoryDonationRepository();
    Donation donation = buildDonation();

    repository.save(donation);
    Optional<Donation> retrieved = repository.findById(donation.getId());

    assertThat(retrieved).isPresent();
}
```

**Avoid** (excessive mocking):

```java
@Test
void shouldSaveDonation() {
    // Overly complex mocking
    DonationRepository repository = mock(DonationRepository.class);
    when(repository.save(any())).thenReturn(/* complex setup */);

    // Test becomes brittle and coupled to implementation
}
```

## When to Use Test Doubles

### Use Stubs for External Dependencies

**REQUIRED**: Stub external services (payment gateways, notification services).

```typescript
class StubPaymentGateway implements PaymentGateway {
  async process(payment: Payment): Promise<PaymentResult> {
    // Deterministic response for testing
    return PaymentResult.success(payment.id);
  }
}

describe("DonationService", () => {
  it("should process donation payment", async () => {
    const gateway = new StubPaymentGateway();
    const service = new DonationService(gateway);

    const result = await service.processDonation(Money.usd(100));

    expect(result.isSuccess()).toBe(true);
  });
});
```

### Use Spies for Verification

**OPTIONAL**: Use spies when verifying behavior matters.

```java
@Test
void shouldPublishEventAfterCalculation() {
    // Spy to verify event publishing
    EventPublisher publisher = spy(new InMemoryEventPublisher());
    ZakatService service = new ZakatService(publisher);

    service.calculateZakat(Money.usd(100000));

    verify(publisher).publish(any(ZakatCalculated.class));
}
```

## PROHIBITED: Over-Mocking

**PROHIBITED**: Mocking domain objects (aggregates, value objects).

**Bad** (mocking domain):

```java
@Test
void shouldCalculateZakat() {
    // DON'T mock domain objects
    Money wealth = mock(Money.class);
    when(wealth.multiply(0.025)).thenReturn(Money.usd(2500));

    // Test becomes meaningless - testing mock, not real logic
}
```

**Good** (use real domain objects):

```java
@Test
void shouldCalculateZakat() {
    // Use real value objects
    Money wealth = Money.usd(100000);
    Money zakat = ZakatCalculator.calculate(wealth);

    assertThat(zakat).isEqualTo(Money.usd(2500));
}
```

## OSE Platform Examples

### Testing with In-Memory Repository

```typescript
class InMemoryCampaignRepository implements CampaignRepository {
  private campaigns: Map<string, Campaign> = new Map();

  async save(campaign: Campaign): Promise<void> {
    this.campaigns.set(campaign.id.value, campaign);
  }

  async findActive(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter((c) => c.status === "ACTIVE");
  }
}

describe("CampaignService", () => {
  let repository: CampaignRepository;

  beforeEach(() => {
    repository = new InMemoryCampaignRepository();
  });

  it("should list active campaigns", async () => {
    // Arrange
    const campaign1 = Campaign.create(Money.usd(10000));
    campaign1.activate();
    await repository.save(campaign1);

    const campaign2 = Campaign.create(Money.usd(5000));
    // campaign2 stays DRAFT
    await repository.save(campaign2);

    // Act
    const activeCampaigns = await repository.findActive();

    // Assert
    expect(activeCampaigns).toHaveLength(1);
  });
});
```
