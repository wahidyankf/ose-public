---
title: "React Domain-Driven Design"
description: Implementing DDD patterns in React applications
category: explanation
subcategory: platform-web
tags:
  - react
  - ddd
  - domain-driven-design
  - architecture
  - typescript
related:
  - ./best-practices.md
  - ./component-architecture.md
principles:
  - explicit-over-implicit
---

# React Domain-Driven Design

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Domain-Driven Design

**Related Guides**:

- [Component Architecture](component-architecture.md) - Component patterns
- [TypeScript](typescript.md) - Domain modeling
- [Best Practices](best-practices.md) - Architecture standards

## Overview

Domain-Driven Design (DDD) helps organize React applications around business domains. This guide covers feature-based organization, bounded contexts, domain models, and separation of concerns.

**Target Audience**: Developers building complex React applications with multiple business domains, particularly Islamic finance platforms with distinct domains like Zakat, Donations, Murabaha, and Waqf.

**React Version**: React 19.0 with TypeScript 5+

## Feature-Based Organization

### Domain Structure

```
src/
├── features/
│   ├── zakat/
│   │   ├── components/
│   │   │   ├── ZakatCalculator.tsx
│   │   │   ├── ZakatHistory.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useZakatCalculation.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   └── zakatApi.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── calculations.ts
│   │
│   ├── donations/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── murabaha/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── types/
│       └── utils/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
│
└── core/
    ├── api/
    ├── auth/
    └── config/
```

### Domain Models

```typescript
// features/zakat/types/index.ts

// Value Objects
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
  }

  static create(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add different currencies");
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error("Cannot compare different currencies");
    }
    return this.amount > other.amount;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

// Entities
export interface ZakatCalculation {
  id: string;
  userId: string;
  assets: Asset[];
  nisabThreshold: Money;
  totalWealth: Money;
  zakatDue: Money;
  isEligible: boolean;
  calculatedAt: Date;
}

export interface Asset {
  id: string;
  type: AssetType;
  description: string;
  value: Money;
}

export type AssetType = "CASH" | "GOLD" | "SILVER" | "INVESTMENT" | "PROPERTY";
```

### Domain Services

```typescript
// features/zakat/services/zakatCalculationService.ts

import { Money } from "../types";

export class ZakatCalculationService {
  private readonly ZAKAT_RATE = 0.025; // 2.5%

  calculate(assets: Asset[], nisabThreshold: Money): ZakatCalculation {
    // Calculate total wealth
    const totalWealth = assets.reduce((sum, asset) => sum.add(asset.value), Money.create(0, nisabThreshold.currency));

    // Check eligibility
    const isEligible = totalWealth.isGreaterThan(nisabThreshold);

    // Calculate zakat
    const zakatDue = isEligible ? totalWealth.multiply(this.ZAKAT_RATE) : Money.create(0, nisabThreshold.currency);

    return {
      id: crypto.randomUUID(),
      userId: "",
      assets,
      nisabThreshold,
      totalWealth,
      zakatDue,
      isEligible,
      calculatedAt: new Date(),
    };
  }
}
```

### Repository Pattern

```typescript
// features/donations/repositories/donationRepository.ts

export interface DonationRepository {
  findAll(): Promise<Donation[]>;
  findById(id: string): Promise<Donation | null>;
  create(donation: NewDonation): Promise<Donation>;
  update(id: string, updates: Partial<Donation>): Promise<Donation>;
  delete(id: string): Promise<void>;
}

// Implementation
export class ApiDonationRepository implements DonationRepository {
  constructor(private apiClient: ApiClient) {}

  async findAll(): Promise<Donation[]> {
    const response = await this.apiClient.get<Donation[]>("/donations");
    return response.data;
  }

  async findById(id: string): Promise<Donation | null> {
    try {
      const response = await this.apiClient.get<Donation>(`/donations/${id}`);
      return response.data;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async create(donation: NewDonation): Promise<Donation> {
    const response = await this.apiClient.post<Donation>("/donations", donation);
    return response.data;
  }

  async update(id: string, updates: Partial<Donation>): Promise<Donation> {
    const response = await this.apiClient.patch<Donation>(`/donations/${id}`, updates);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.apiClient.delete(`/donations/${id}`);
  }
}
```

### Bounded Context Integration

```typescript
// Zakat context
export const ZakatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const calculationService = new ZakatCalculationService();
  const repository = new ZakatRepository();

  return (
    <ZakatContext.Provider value={{ calculationService, repository }}>
      {children}
    </ZakatContext.Provider>
  );
};

// Donation context
export const DonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repository = new ApiDonationRepository(apiClient);

  return (
    <DonationContext.Provider value={{ repository }}>
      {children}
    </DonationContext.Provider>
  );
};

// App with multiple bounded contexts
export const App: React.FC = () => (
  <ZakatProvider>
    <DonationProvider>
      <MurabahaProvider>
        <Router>
          <Routes />
        </Router>
      </MurabahaProvider>
    </DonationProvider>
  </ZakatProvider>
);
```

## Tactical DDD Patterns

### Entities

Entities have identity and lifecycle. Two entities are equal if they have the same identity.

```typescript
// features/murabaha/types/Contract.ts

export class MurabahaContract {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly assetDescription: string,
    public readonly purchasePrice: Money,
    public readonly markup: Money,
    public readonly installments: Installment[],
    public readonly status: ContractStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    customerId: string;
    assetDescription: string;
    purchasePrice: Money;
    markupPercentage: number;
    installmentCount: number;
  }): MurabahaContract {
    const markup = params.purchasePrice.multiply(params.markupPercentage);
    const totalAmount = params.purchasePrice.add(markup);
    const installmentAmount = totalAmount.divide(params.installmentCount);

    const installments = Array.from({ length: params.installmentCount }, (_, i) => ({
      id: crypto.randomUUID(),
      number: i + 1,
      amount: installmentAmount,
      dueDate: addMonths(new Date(), i + 1),
      status: "PENDING" as InstallmentStatus,
    }));

    return new MurabahaContract(
      crypto.randomUUID(),
      params.customerId,
      params.assetDescription,
      params.purchasePrice,
      markup,
      installments,
      "PENDING_APPROVAL",
      new Date(),
      new Date(),
    );
  }

  approve(): MurabahaContract {
    if (this.status !== "PENDING_APPROVAL") {
      throw new DomainError("Contract must be in PENDING_APPROVAL status to approve");
    }

    return new MurabahaContract(
      this.id,
      this.customerId,
      this.assetDescription,
      this.purchasePrice,
      this.markup,
      this.installments,
      "ACTIVE",
      this.createdAt,
      new Date(),
    );
  }

  makePayment(installmentNumber: number): MurabahaContract {
    const installment = this.installments.find((i) => i.number === installmentNumber);

    if (!installment) {
      throw new DomainError(`Installment ${installmentNumber} not found`);
    }

    if (installment.status === "PAID") {
      throw new DomainError(`Installment ${installmentNumber} already paid`);
    }

    const updatedInstallments = this.installments.map((i) =>
      i.number === installmentNumber ? { ...i, status: "PAID" as InstallmentStatus, paidAt: new Date() } : i,
    );

    const allPaid = updatedInstallments.every((i) => i.status === "PAID");
    const newStatus = allPaid ? "COMPLETED" : this.status;

    return new MurabahaContract(
      this.id,
      this.customerId,
      this.assetDescription,
      this.purchasePrice,
      this.markup,
      updatedInstallments,
      newStatus,
      this.createdAt,
      new Date(),
    );
  }

  getTotalAmount(): Money {
    return this.purchasePrice.add(this.markup);
  }

  getRemainingBalance(): Money {
    const paidInstallments = this.installments.filter((i) => i.status === "PAID");
    const paidAmount = paidInstallments.reduce((sum, i) => sum.add(i.amount), Money.zero(this.purchasePrice.currency));
    return this.getTotalAmount().subtract(paidAmount);
  }

  isOverdue(): boolean {
    const now = new Date();
    return this.installments.some((i) => i.status === "PENDING" && i.dueDate < now);
  }
}

type ContractStatus = "PENDING_APPROVAL" | "ACTIVE" | "COMPLETED" | "DEFAULTED";
type InstallmentStatus = "PENDING" | "PAID" | "OVERDUE";

interface Installment {
  id: string;
  number: number;
  amount: Money;
  dueDate: Date;
  status: InstallmentStatus;
  paidAt?: Date;
}
```

### Value Objects

Value objects are immutable and identified by their attributes. Two value objects with the same attributes are equal.

```typescript
// features/zakat/types/NisabThreshold.ts

export class NisabThreshold {
  private constructor(
    private readonly goldPricePerGram: number,
    private readonly silverPricePerGram: number,
    private readonly currency: string,
    private readonly effectiveDate: Date,
  ) {
    if (goldPricePerGram <= 0 || silverPricePerGram <= 0) {
      throw new Error("Precious metal prices must be positive");
    }
  }

  static create(goldPrice: number, silverPrice: number, currency: string): NisabThreshold {
    return new NisabThreshold(goldPrice, silverPrice, currency, new Date());
  }

  // Nisab is 85g of gold OR 595g of silver (whichever is lower)
  getGoldNisab(): Money {
    const goldNisabGrams = 85;
    return Money.create(this.goldPricePerGram * goldNisabGrams, this.currency);
  }

  getSilverNisab(): Money {
    const silverNisabGrams = 595;
    return Money.create(this.silverPricePerGram * silverNisabGrams, this.currency);
  }

  getNisab(): Money {
    const goldNisab = this.getGoldNisab();
    const silverNisab = this.getSilverNisab();

    // Return lower threshold (more people qualify)
    return goldNisab.isLessThan(silverNisab) ? goldNisab : silverNisab;
  }

  equals(other: NisabThreshold): boolean {
    return (
      this.goldPricePerGram === other.goldPricePerGram &&
      this.silverPricePerGram === other.silverPricePerGram &&
      this.currency === other.currency
    );
  }
}

// Usage in React component
export const NisabDisplay: React.FC<{ threshold: NisabThreshold }> = ({ threshold }) => {
  const nisab = threshold.getNisab();
  const goldNisab = threshold.getGoldNisab();
  const silverNisab = threshold.getSilverNisab();

  return (
    <div className="nisab-display">
      <h3>Current Nisab Threshold</h3>
      <p>
        Minimum Wealth Requirement: <strong>{nisab.toString()}</strong>
      </p>
      <div className="details">
        <p>Gold Nisab (85g): {goldNisab.toString()}</p>
        <p>Silver Nisab (595g): {silverNisab.toString()}</p>
        <p className="note">The lower threshold applies</p>
      </div>
    </div>
  );
};
```

### Aggregates

Aggregates are clusters of entities and value objects with a root entity. They enforce consistency boundaries.

```typescript
// features/waqf/aggregates/WaqfProject.ts

export class WaqfProject {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly fundingGoal: Money,
    public readonly currentFunding: Money,
    private donations: Donation[],
    private milestones: Milestone[],
    public readonly status: ProjectStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: { name: string; description: string; fundingGoal: Money }): WaqfProject {
    if (params.fundingGoal.amount <= 0) {
      throw new DomainError("Funding goal must be positive");
    }

    return new WaqfProject(
      crypto.randomUUID(),
      params.name,
      params.description,
      params.fundingGoal,
      Money.zero(params.fundingGoal.currency),
      [],
      [],
      "DRAFT",
      new Date(),
      new Date(),
    );
  }

  // Aggregate root controls all changes
  addDonation(params: { donorId: string; amount: Money; isRecurring: boolean }): WaqfProject {
    if (this.status !== "ACTIVE") {
      throw new DomainError("Cannot donate to inactive project");
    }

    if (!params.amount.hasSameCurrency(this.fundingGoal)) {
      throw new DomainError("Donation currency must match project currency");
    }

    const donation: Donation = {
      id: crypto.randomUUID(),
      projectId: this.id,
      donorId: params.donorId,
      amount: params.amount,
      isRecurring: params.isRecurring,
      createdAt: new Date(),
    };

    const newCurrentFunding = this.currentFunding.add(params.amount);
    const updatedDonations = [...this.donations, donation];

    // Check if funding goal reached
    const newStatus = newCurrentFunding.isGreaterThanOrEqual(this.fundingGoal) ? "FUNDED" : this.status;

    return new WaqfProject(
      this.id,
      this.name,
      this.description,
      this.fundingGoal,
      newCurrentFunding,
      updatedDonations,
      this.milestones,
      newStatus,
      this.createdAt,
      new Date(),
    );
  }

  addMilestone(params: { title: string; description: string; targetAmount: Money }): WaqfProject {
    if (!params.targetAmount.hasSameCurrency(this.fundingGoal)) {
      throw new DomainError("Milestone target must match project currency");
    }

    if (params.targetAmount.isGreaterThan(this.fundingGoal)) {
      throw new DomainError("Milestone target cannot exceed funding goal");
    }

    const milestone: Milestone = {
      id: crypto.randomUUID(),
      title: params.title,
      description: params.description,
      targetAmount: params.targetAmount,
      achieved: false,
      achievedAt: undefined,
    };

    // Check if milestone already achieved
    if (this.currentFunding.isGreaterThanOrEqual(params.targetAmount)) {
      milestone.achieved = true;
      milestone.achievedAt = new Date();
    }

    return new WaqfProject(
      this.id,
      this.name,
      this.description,
      this.fundingGoal,
      this.currentFunding,
      this.donations,
      [...this.milestones, milestone],
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  publish(): WaqfProject {
    if (this.status !== "DRAFT") {
      throw new DomainError("Can only publish draft projects");
    }

    if (this.milestones.length === 0) {
      throw new DomainError("Project must have at least one milestone");
    }

    return new WaqfProject(
      this.id,
      this.name,
      this.description,
      this.fundingGoal,
      this.currentFunding,
      this.donations,
      this.milestones,
      "ACTIVE",
      this.createdAt,
      new Date(),
    );
  }

  getFundingProgress(): number {
    return (this.currentFunding.amount / this.fundingGoal.amount) * 100;
  }

  getDonations(): ReadonlyArray<Donation> {
    return this.donations;
  }

  getMilestones(): ReadonlyArray<Milestone> {
    return this.milestones;
  }

  getAchievedMilestones(): ReadonlyArray<Milestone> {
    return this.milestones.filter((m) => m.achieved);
  }
}

type ProjectStatus = "DRAFT" | "ACTIVE" | "FUNDED" | "COMPLETED" | "CANCELLED";

interface Donation {
  id: string;
  projectId: string;
  donorId: string;
  amount: Money;
  isRecurring: boolean;
  createdAt: Date;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetAmount: Money;
  achieved: boolean;
  achievedAt?: Date;
}
```

### Domain Events

Domain events capture important business events that occurred in the domain.

```typescript
// features/zakat/events/ZakatEvents.ts

export interface DomainEvent {
  eventId: string;
  occurredAt: Date;
  aggregateId: string;
}

export interface ZakatCalculated extends DomainEvent {
  type: "ZAKAT_CALCULATED";
  userId: string;
  totalWealth: Money;
  nisabThreshold: Money;
  zakatDue: Money;
  isEligible: boolean;
}

export interface ZakatPaid extends DomainEvent {
  type: "ZAKAT_PAID";
  userId: string;
  amount: Money;
  paymentMethod: string;
  transactionId: string;
}

// Event Publisher
export class DomainEventPublisher {
  private handlers: Map<string, Array<(event: DomainEvent) => void>> = new Map();

  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => void): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as (event: DomainEvent) => void);
    this.handlers.set(eventType, handlers);
  }

  publish(event: DomainEvent): void {
    const handlers = this.handlers.get((event as any).type) || [];
    handlers.forEach((handler) => handler(event));
  }
}

// React integration with events
export const ZakatEventHandler: React.FC = () => {
  const eventPublisher = useDomainEvents();

  useEffect(() => {
    // Subscribe to Zakat events
    eventPublisher.subscribe<ZakatCalculated>("ZAKAT_CALCULATED", (event) => {
      console.log("Zakat calculated:", event);

      // Send notification
      if (event.isEligible) {
        toast.success(`Zakat due: ${event.zakatDue.toString()}`);
      }

      // Track analytics
      analytics.track("zakat_calculated", {
        userId: event.userId,
        amount: event.zakatDue.amount,
        eligible: event.isEligible,
      });
    });

    eventPublisher.subscribe<ZakatPaid>("ZAKAT_PAID", (event) => {
      console.log("Zakat paid:", event);

      // Show success message
      toast.success(`Zakat payment of ${event.amount.toString()} successful`);

      // Update user record
      analytics.track("zakat_paid", {
        userId: event.userId,
        amount: event.amount.amount,
      });
    });
  }, [eventPublisher]);

  return null;
};
```

### Application Services

Application services orchestrate domain operations and handle cross-cutting concerns.

```typescript
// features/murabaha/services/MurabahaApplicationService.ts

export class MurabahaApplicationService {
  constructor(
    private contractRepository: MurabahaContractRepository,
    private customerRepository: CustomerRepository,
    private eventPublisher: DomainEventPublisher,
    private emailService: EmailService,
  ) {}

  async applyForFinancing(params: {
    customerId: string;
    assetDescription: string;
    purchasePrice: Money;
    markupPercentage: number;
    installmentCount: number;
  }): Promise<MurabahaContract> {
    // Validate customer
    const customer = await this.customerRepository.findById(params.customerId);
    if (!customer) {
      throw new ApplicationError("Customer not found");
    }

    if (!customer.isEligibleForFinancing()) {
      throw new ApplicationError("Customer not eligible for financing");
    }

    // Create contract (domain logic)
    const contract = MurabahaContract.create(params);

    // Persist
    await this.contractRepository.save(contract);

    // Publish event
    this.eventPublisher.publish({
      eventId: crypto.randomUUID(),
      type: "MURABAHA_APPLICATION_SUBMITTED",
      occurredAt: new Date(),
      aggregateId: contract.id,
      customerId: params.customerId,
      assetDescription: params.assetDescription,
      totalAmount: contract.getTotalAmount(),
    });

    // Send email notification
    await this.emailService.sendApplicationConfirmation(customer.email, contract);

    return contract;
  }

  async approveContract(contractId: string, approvedBy: string): Promise<MurabahaContract> {
    // Load aggregate
    const contract = await this.contractRepository.findById(contractId);
    if (!contract) {
      throw new ApplicationError("Contract not found");
    }

    // Domain logic
    const approvedContract = contract.approve();

    // Persist
    await this.contractRepository.save(approvedContract);

    // Publish event
    this.eventPublisher.publish({
      eventId: crypto.randomUUID(),
      type: "MURABAHA_CONTRACT_APPROVED",
      occurredAt: new Date(),
      aggregateId: approvedContract.id,
      approvedBy,
    });

    // Send notification
    const customer = await this.customerRepository.findById(approvedContract.customerId);
    if (customer) {
      await this.emailService.sendApprovalNotification(customer.email, approvedContract);
    }

    return approvedContract;
  }

  async makePayment(params: { contractId: string; installmentNumber: number; paymentMethod: string }): Promise<void> {
    // Load aggregate
    const contract = await this.contractRepository.findById(params.contractId);
    if (!contract) {
      throw new ApplicationError("Contract not found");
    }

    // Domain logic
    const updatedContract = contract.makePayment(params.installmentNumber);

    // Persist
    await this.contractRepository.save(updatedContract);

    // Publish event
    this.eventPublisher.publish({
      eventId: crypto.randomUUID(),
      type: "INSTALLMENT_PAID",
      occurredAt: new Date(),
      aggregateId: updatedContract.id,
      installmentNumber: params.installmentNumber,
      paymentMethod: params.paymentMethod,
    });

    // Send receipt
    const customer = await this.customerRepository.findById(updatedContract.customerId);
    if (customer) {
      await this.emailService.sendPaymentReceipt(customer.email, updatedContract, params.installmentNumber);
    }
  }
}

// Usage in React hook
export const useMurabahaApplication = () => {
  const applicationService = useMurabahaService();

  const applyForFinancing = useMutation({
    mutationFn: (params: FinancingApplicationParams) => applicationService.applyForFinancing(params),
    onSuccess: (contract) => {
      toast.success("Financing application submitted successfully");
    },
    onError: (error: ApplicationError) => {
      toast.error(error.message);
    },
  });

  return { applyForFinancing };
};
```

## Domain-Specific Errors

Create domain-specific error types for better error handling.

```typescript
// shared/errors/DomainErrors.ts

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class InvariantViolation extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvariantViolation";
  }
}

export class NotFoundError extends DomainError {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
  ) {
    super(`${entityType} with id ${entityId} not found`);
    this.name = "NotFoundError";
  }
}

// Usage in components
export const ZakatCalculatorForm: React.FC = () => {
  const [error, setError] = useState<DomainError | null>(null);

  const handleCalculate = async (wealth: number) => {
    try {
      const money = Money.create(wealth, "USD");
      const calculation = await zakatService.calculate(money);
      setCalculation(calculation);
      setError(null);
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err);
        toast.error(`Validation error: ${err.message}`);
      } else if (err instanceof DomainError) {
        setError(err);
        toast.error(err.message);
      } else {
        console.error("Unexpected error:", err);
        toast.error("An unexpected error occurred");
      }
    }
  };

  return (
    <div>
      {error instanceof ValidationError && (
        <div className="error-message">
          <strong>{error.field}:</strong> {error.message}
        </div>
      )}
      {/* Form fields */}
    </div>
  );
};
```

## React Hooks for Domain Operations

Create custom hooks that encapsulate domain logic.

```typescript
// features/zakat/hooks/useZakatCalculation.ts

export const useZakatCalculation = () => {
  const calculationService = useZakatService();
  const [result, setResult] = useState<ZakatCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const calculate = useCallback(
    async (assets: Asset[], nisabThreshold: NisabThreshold) => {
      setLoading(true);
      setError(null);

      try {
        // Use domain service
        const calculation = calculationService.calculate(assets, nisabThreshold.getNisab());
        setResult(calculation);
        return calculation;
      } catch (err) {
        const domainError = err instanceof DomainError ? err : new DomainError("Calculation failed");
        setError(domainError);
        throw domainError;
      } finally {
        setLoading(false);
      }
    },
    [calculationService],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, calculate, reset };
};

// Usage in component
export const ZakatCalculator: React.FC = () => {
  const { result, loading, error, calculate } = useZakatCalculation();
  const [assets, setAssets] = useState<Asset[]>([]);

  const handleCalculate = async () => {
    const nisab = NisabThreshold.create(60, 1.5, "USD");
    await calculate(assets, nisab);
  };

  return (
    <div className="zakat-calculator">
      <h2>Zakat Calculator</h2>

      <AssetForm onAddAsset={(asset) => setAssets([...assets, asset])} />

      <AssetList assets={assets} />

      <button onClick={handleCalculate} disabled={loading || assets.length === 0}>
        {loading ? "Calculating..." : "Calculate Zakat"}
      </button>

      {error && <ErrorMessage error={error} />}

      {result && (
        <div className="result">
          <h3>Calculation Result</h3>
          <p>Total Wealth: {result.totalWealth.toString()}</p>
          <p>Nisab Threshold: {result.nisabThreshold.toString()}</p>
          <p>Eligible for Zakat: {result.isEligible ? "Yes" : "No"}</p>
          {result.isEligible && <p className="zakat-due">Zakat Due: {result.zakatDue.toString()}</p>}
        </div>
      )}
    </div>
  );
};
```

## Factory Methods

Use factory methods for complex object creation with validation.

```typescript
// features/waqf/factories/WaqfProjectFactory.ts

export class WaqfProjectFactory {
  static createEducationProject(params: { name: string; description: string; fundingGoal: Money }): WaqfProject {
    // Validate education project rules
    if (params.fundingGoal.amount < 10000) {
      throw new ValidationError("Education projects require minimum funding of $10,000", "fundingGoal");
    }

    const project = WaqfProject.create(params);

    // Add standard education milestones
    return project
      .addMilestone({
        title: "Curriculum Development",
        description: "Complete curriculum design and materials",
        targetAmount: params.fundingGoal.multiply(0.25),
      })
      .addMilestone({
        title: "Facility Setup",
        description: "Prepare classrooms and equipment",
        targetAmount: params.fundingGoal.multiply(0.5),
      })
      .addMilestone({
        title: "First Semester",
        description: "Launch first academic semester",
        targetAmount: params.fundingGoal.multiply(0.75),
      })
      .addMilestone({
        title: "Full Operation",
        description: "Achieve full operational capacity",
        targetAmount: params.fundingGoal,
      });
  }

  static createHealthcareProject(params: { name: string; description: string; fundingGoal: Money }): WaqfProject {
    // Validate healthcare project rules
    if (params.fundingGoal.amount < 50000) {
      throw new ValidationError("Healthcare projects require minimum funding of $50,000", "fundingGoal");
    }

    const project = WaqfProject.create(params);

    // Add standard healthcare milestones
    return project
      .addMilestone({
        title: "Medical Equipment",
        description: "Purchase essential medical equipment",
        targetAmount: params.fundingGoal.multiply(0.3),
      })
      .addMilestone({
        title: "Staff Recruitment",
        description: "Hire qualified medical staff",
        targetAmount: params.fundingGoal.multiply(0.6),
      })
      .addMilestone({
        title: "Clinic Launch",
        description: "Open clinic to patients",
        targetAmount: params.fundingGoal,
      });
  }
}

// Usage in React
export const CreateWaqfProjectForm: React.FC = () => {
  const [projectType, setProjectType] = useState<"education" | "healthcare">("education");

  const { mutate: createProject } = useMutation({
    mutationFn: async (params: { name: string; description: string; fundingGoal: number }) => {
      const fundingGoal = Money.create(params.fundingGoal, "USD");

      const project =
        projectType === "education"
          ? WaqfProjectFactory.createEducationProject({ ...params, fundingGoal })
          : WaqfProjectFactory.createHealthcareProject({ ...params, fundingGoal });

      return waqfRepository.save(project);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <select value={projectType} onChange={(e) => setProjectType(e.target.value as any)}>
        <option value="education">Education Project</option>
        <option value="healthcare">Healthcare Project</option>
      </select>
      {/* Form fields */}
    </form>
  );
};
```

## Bounded Contexts and Context Mapping

Define clear boundaries between different business domains.

```typescript
// Context Map: How contexts interact

// Zakat Context → Donation Context (Customer/Supplier)
// When zakat is paid, it can be directed to a donation project

export interface ZakatToDonationMapper {
  mapZakatPaymentToDonation(zakatPayment: ZakatPayment): DonationIntent;
}

export class ZakatDonationMapper implements ZakatToDonationMapper {
  mapZakatPaymentToDonation(zakatPayment: ZakatPayment): DonationIntent {
    return {
      donorId: zakatPayment.userId,
      amount: zakatPayment.amount,
      projectId: zakatPayment.targetProjectId,
      source: "ZAKAT",
      isRecurring: false,
    };
  }
}

// React integration with context mapping
export const ZakatPaymentFlow: React.FC = () => {
  const { calculate } = useZakatCalculation();
  const { allocateToDonation } = useDonationAllocation();
  const mapper = new ZakatDonationMapper();

  const handlePayZakat = async (payment: ZakatPayment) => {
    try {
      // Process zakat payment in Zakat context
      await zakatService.processPayment(payment);

      // Map to Donation context if targeting a project
      if (payment.targetProjectId) {
        const donationIntent = mapper.mapZakatPaymentToDonation(payment);
        await allocateToDonation(donationIntent);
      }

      toast.success("Zakat payment processed successfully");
    } catch (error) {
      toast.error("Payment processing failed");
    }
  };

  return <ZakatPaymentForm onSubmit={handlePayZakat} />;
};
```

## OSE Platform Examples

### Complete Zakat Aggregate with Business Rules

```typescript
// features/zakat/aggregates/ZakatRecord.ts

export class ZakatRecord {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly islamicYear: number,
    private assets: Asset[],
    private payments: ZakatPayment[],
    public readonly nisabThreshold: NisabThreshold,
    public readonly status: ZakatRecordStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static createForYear(userId: string, islamicYear: number, nisabThreshold: NisabThreshold): ZakatRecord {
    return new ZakatRecord(
      crypto.randomUUID(),
      userId,
      islamicYear,
      [],
      [],
      nisabThreshold,
      "OPEN",
      new Date(),
      new Date(),
    );
  }

  addAsset(asset: Asset): ZakatRecord {
    if (this.status === "CLOSED") {
      throw new InvariantViolation("Cannot add assets to closed Zakat record");
    }

    // Business rule: Cannot add duplicate assets
    if (this.assets.some((a) => a.id === asset.id)) {
      throw new InvariantViolation("Asset already exists in record");
    }

    // Business rule: Asset value must match record currency
    if (!asset.value.hasSameCurrency(this.nisabThreshold.getNisab())) {
      throw new ValidationError("Asset currency must match record currency", "currency");
    }

    return new ZakatRecord(
      this.id,
      this.userId,
      this.islamicYear,
      [...this.assets, asset],
      this.payments,
      this.nisabThreshold,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  removeAsset(assetId: string): ZakatRecord {
    if (this.status === "CLOSED") {
      throw new InvariantViolation("Cannot remove assets from closed Zakat record");
    }

    const filteredAssets = this.assets.filter((a) => a.id !== assetId);

    if (filteredAssets.length === this.assets.length) {
      throw new NotFoundError("Asset", assetId);
    }

    return new ZakatRecord(
      this.id,
      this.userId,
      this.islamicYear,
      filteredAssets,
      this.payments,
      this.nisabThreshold,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  calculateZakat(): ZakatCalculation {
    const totalWealth = this.assets.reduce(
      (sum, asset) => sum.add(asset.value),
      Money.zero(this.nisabThreshold.getNisab().currency),
    );

    const nisab = this.nisabThreshold.getNisab();
    const isEligible = totalWealth.isGreaterThanOrEqual(nisab);
    const zakatDue = isEligible ? totalWealth.multiply(0.025) : Money.zero(totalWealth.currency);

    return {
      id: crypto.randomUUID(),
      userId: this.userId,
      assets: this.assets,
      nisabThreshold: nisab,
      totalWealth,
      zakatDue,
      isEligible,
      calculatedAt: new Date(),
    };
  }

  recordPayment(payment: Omit<ZakatPayment, "id" | "recordId" | "createdAt">): ZakatRecord {
    if (this.status === "CLOSED") {
      throw new InvariantViolation("Cannot record payment for closed Zakat record");
    }

    const calculation = this.calculateZakat();

    // Business rule: Cannot overpay zakat
    const totalPaid = this.getTotalPaid();
    const remainingDue = calculation.zakatDue.subtract(totalPaid);

    if (payment.amount.isGreaterThan(remainingDue)) {
      throw new ValidationError("Payment amount exceeds remaining zakat due", "amount");
    }

    const newPayment: ZakatPayment = {
      ...payment,
      id: crypto.randomUUID(),
      recordId: this.id,
      createdAt: new Date(),
    };

    // Check if fully paid
    const newTotalPaid = totalPaid.add(payment.amount);
    const newStatus = newTotalPaid.isGreaterThanOrEqual(calculation.zakatDue) ? "PAID" : this.status;

    return new ZakatRecord(
      this.id,
      this.userId,
      this.islamicYear,
      this.assets,
      [...this.payments, newPayment],
      this.nisabThreshold,
      newStatus,
      this.createdAt,
      new Date(),
    );
  }

  closeYear(): ZakatRecord {
    if (this.status === "CLOSED") {
      throw new InvariantViolation("Record already closed");
    }

    const calculation = this.calculateZakat();
    const totalPaid = this.getTotalPaid();

    // Business rule: Must be fully paid to close
    if (calculation.isEligible && totalPaid.isLessThan(calculation.zakatDue)) {
      throw new InvariantViolation("Cannot close record with unpaid zakat");
    }

    return new ZakatRecord(
      this.id,
      this.userId,
      this.islamicYear,
      this.assets,
      this.payments,
      this.nisabThreshold,
      "CLOSED",
      this.createdAt,
      new Date(),
    );
  }

  getTotalPaid(): Money {
    return this.payments.reduce((sum, payment) => sum.add(payment.amount), Money.zero(this.nisabThreshold.getNisab().currency));
  }

  getAssets(): ReadonlyArray<Asset> {
    return this.assets;
  }

  getPayments(): ReadonlyArray<ZakatPayment> {
    return this.payments;
  }
}

type ZakatRecordStatus = "OPEN" | "PAID" | "CLOSED";

interface ZakatPayment {
  id: string;
  recordId: string;
  amount: Money;
  paymentMethod: string;
  targetProjectId?: string;
  createdAt: Date;
}

// React component using the aggregate
export const ZakatRecordManager: React.FC<{ userId: string; islamicYear: number }> = ({ userId, islamicYear }) => {
  const [record, setRecord] = useState<ZakatRecord | null>(null);
  const { data: nisabThreshold } = useNisabThreshold();

  useEffect(() => {
    if (nisabThreshold) {
      const newRecord = ZakatRecord.createForYear(userId, islamicYear, nisabThreshold);
      setRecord(newRecord);
    }
  }, [userId, islamicYear, nisabThreshold]);

  const handleAddAsset = (asset: Asset) => {
    if (record) {
      try {
        const updatedRecord = record.addAsset(asset);
        setRecord(updatedRecord);
        toast.success("Asset added successfully");
      } catch (error) {
        if (error instanceof DomainError) {
          toast.error(error.message);
        }
      }
    }
  };

  const handleRecordPayment = (payment: Omit<ZakatPayment, "id" | "recordId" | "createdAt">) => {
    if (record) {
      try {
        const updatedRecord = record.recordPayment(payment);
        setRecord(updatedRecord);
        toast.success("Payment recorded successfully");
      } catch (error) {
        if (error instanceof DomainError) {
          toast.error(error.message);
        }
      }
    }
  };

  if (!record) return <LoadingSpinner />;

  const calculation = record.calculateZakat();

  return (
    <div className="zakat-record-manager">
      <h2>
        Zakat Record - Islamic Year {islamicYear} ({record.status})
      </h2>

      <AssetList assets={record.getAssets()} onAddAsset={handleAddAsset} />

      <ZakatCalculationDisplay calculation={calculation} />

      {calculation.isEligible && (
        <>
          <PaymentHistory payments={record.getPayments()} />

          {record.status === "OPEN" && (
            <ZakatPaymentForm
              remainingDue={calculation.zakatDue.subtract(record.getTotalPaid())}
              onSubmit={handleRecordPayment}
            />
          )}
        </>
      )}
    </div>
  );
};
```

## DDD Best Practices Checklist

### Domain Modeling

- ✅ **Use value objects** for immutable concepts (Money, Email, Address)
- ✅ **Use entities** for mutable objects with identity (Contract, User, Order)
- ✅ **Define aggregates** with clear boundaries and root entities
- ✅ **Enforce invariants** at the aggregate level
- ✅ **Use domain events** to capture business-significant occurrences
- ✅ **Create domain-specific errors** for better error handling
- ✅ **Use factory methods** for complex object creation

### React Integration

- ✅ **Keep domain logic** out of React components
- ✅ **Use custom hooks** to encapsulate domain operations
- ✅ **Use Context API** to provide domain services
- ✅ **Map domain errors** to user-friendly messages
- ✅ **Use repositories** to abstract data access
- ✅ **Separate concerns**: presentation (React) vs. domain logic (services/aggregates)

### Code Organization

- ✅ **Organize by feature** (features/zakat/, features/murabaha/)
- ✅ **Keep bounded contexts** isolated with clear interfaces
- ✅ **Use TypeScript** for type-safe domain models
- ✅ **Define explicit interfaces** for repositories and services
- ✅ **Create anti-corruption layers** when integrating external systems

### Testing

- ✅ **Test domain logic** independently of React
- ✅ **Test aggregates** thoroughly (business rules, invariants)
- ✅ **Mock repositories** in service tests
- ✅ **Test React integration** with domain mocks
- ✅ **Test domain events** and event handlers

## Related Documentation

- **[Component Architecture](component-architecture.md)** - Component patterns
- **[TypeScript](typescript.md)** - Domain modeling
- **[Best Practices](best-practices.md)** - Architecture standards
