---
title: "Intermediate"
date: 2026-01-31T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 31-60: Bounded Contexts, Context Mapping, Application Services, Domain Event Handlers, Advanced Factories, Specifications, and Integration Patterns (40-75% coverage)"
tags:
  [
    "ddd",
    "domain-driven-design",
    "tutorial",
    "by-example",
    "intermediate",
    "bounded-contexts",
    "context-mapping",
    "application-services",
  ]
---

This intermediate-level tutorial advances Domain-Driven Design knowledge through 30 annotated code examples, covering strategic DDD patterns like Bounded Contexts and Context Mapping, along with advanced tactical patterns including Application Services, Domain Event Handlers, Factories, Specifications, and integration strategies for multi-context systems.

## Bounded Contexts (Examples 31-35)

### Example 31: What is a Bounded Context?

A Bounded Context is an explicit boundary within which a domain model is defined and applicable. The same concept can have different meanings in different contexts, and each context maintains its own model with its own ubiquitous language.

```mermaid
graph TD
    A["Sales Context<br/>Customer = Buyer<br/>Product = Catalog Item"]
    B["Shipping Context<br/>Customer = Delivery Address<br/>Product = Physical Package"]
    C["Support Context<br/>Customer = Account<br/>Product = Service SKU"]

    A -.->|Anti-Corruption Layer| B
    B -.->|Anti-Corruption Layer| C

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Key Concepts**:

- **Bounded Context**: Explicit boundary defining model applicability
- **Context-specific models**: Same entity name, different meaning per context
- **Ubiquitous Language per context**: Terms have precise meaning within boundary
- **Anti-Corruption Layer**: Prevents external models from corrupting internal model

**Key Takeaway**: Bounded Contexts prevent model ambiguity by creating explicit boundaries where domain concepts have precise, context-specific meanings. The same term (e.g., "Customer") can mean different things in different contexts without conflict.

**Why It Matters**: Without Bounded Contexts, teams waste months debating "what is a Customer?" When an e-commerce platform separated their Sales, Fulfillment, and Customer Service contexts, they discovered each team needed different Customer definitions. Sales needed purchase history, Fulfillment needed shipping addresses, Support needed account status. Trying to create one unified Customer model created an oversized entity that nobody understood. Bounded Contexts let each team optimize their model for their specific needs while maintaining clean integration points through Anti-Corruption Layers.

### Example 32: Bounded Context Implementation - Sales Context

Implementing a complete Bounded Context with its own model, repositories, and services isolated from other contexts.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    subgraph SalesContext[Sales Bounded Context]
        A["Customer\n(Sales model)"]
        B["Product\n(Sales model)"]
        C["Order\n(Sales model)"]
        D["SalesOrderRepository"]
        E["SalesService"]
    end
    subgraph ShippingContext[Shipping Bounded Context]
        F["Shipment\n(Shipping model)"]
        G["Address\n(Shipping model)"]
        H["ShipmentRepository"]
    end

    E -->|via ACL/event| F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#0173B2,stroke:#000,color:#fff
    style C fill:#0173B2,stroke:#000,color:#fff
    style F fill:#DE8F05,stroke:#000,color:#000
    style G fill:#DE8F05,stroke:#000,color:#000
```

```typescript
// Sales Bounded Context - Customer means "Buyer with purchase history"
namespace SalesContext {
  // => SalesContext: context boundary namespace

  // Sales-specific Customer entity
  export class Customer {
    // => Sales context: Customer = buyer with payment info
    private readonly customerId: string; // => Unique identifier in Sales
    private readonly email: string; // => Contact for order confirmations
    private readonly creditLimit: number; // => Maximum order value allowed
    private orders: Order[] = []; // => Purchase history (Sales-specific)

    constructor(customerId: string, email: string, creditLimit: number) {
      // => Constructor: initializes new instance

      this.customerId = customerId; // => Initialize customer ID
      this.email = email; // => Set email for sales communications
      this.creditLimit = creditLimit; // => Set credit limit for orders
    }

    placeOrder(order: Order): void {
      // => Business rule: Sales validates against credit limit
      this.ensureCreditAvailable(order.getTotalAmount());
      // => Delegates to internal method
      this.orders.push(order); // => Add to purchase history
      // => Order placed successfully
    }

    private ensureCreditAvailable(amount: number): void {
      // => Internal logic (not part of public API)
      const totalOutstanding = this.getTotalOutstanding(); // => Calculate current debt
      if (totalOutstanding + amount > this.creditLimit) {
        // => Validate against credit limit
        throw new Error("Credit limit exceeded");
        // => Throws domain error: "Credit limit exceeded"
      }
      // => Credit check passed
    }

    private getTotalOutstanding(): number {
      // => Internal logic (not part of public API)
      return (
        this.orders
          // => Returns this.orders

          .filter((o) => !o.isPaid()) // => Filter unpaid orders
          .reduce((sum, o) => sum + o.getTotalAmount(), 0)
      ); // => Sum unpaid amounts
    }

    getCustomerId(): string {
      // => getCustomerId(): returns string

      return this.customerId; // => Expose customer ID
    }

    getEmail(): string {
      // => getEmail(): returns string

      return this.email; // => Expose email
    }
  }

  // Sales-specific Order entity
  export class Order {
    private readonly orderId: string; // => Order identifier
    private readonly totalAmount: number; // => Order total
    private paid: boolean = false; // => Payment status

    constructor(orderId: string, totalAmount: number) {
      // => Constructor: initializes new instance

      this.orderId = orderId; // => Initialize order ID
      this.totalAmount = totalAmount; // => Set total amount
    }

    markAsPaid(): void {
      // => markAsPaid(): returns void

      this.paid = true; // => Update payment status
    }

    isPaid(): boolean {
      // => isPaid(): returns boolean

      return this.paid; // => Return payment status
    }

    getTotalAmount(): number {
      // => getTotalAmount(): returns number

      return this.totalAmount; // => Expose total amount
    }
  }

  // Sales-specific repository
  export interface CustomerRepository {
    findById(customerId: string): Customer | null; // => Retrieve by ID
    save(customer: Customer): void; // => Persist customer
  }
}

// Usage - Sales Context operations
const salesCustomer = new SalesContext.Customer("C123", "alice@example.com", 10000);
// => salesCustomer: creditLimit=10000, orders=[]
const order = new SalesContext.Order("O456", 5000);
// => order: totalAmount=5000, paid=false
salesCustomer.placeOrder(order);
// => Order added to purchase history, credit limit checked
console.log(salesCustomer.getEmail());
// => Outputs result
// => Output: alice@example.com
```

**Key Takeaway**: Each Bounded Context implements its own model with context-specific entities, value objects, and repositories. Sales Context's Customer focuses on credit limits and purchase history, completely independent of how other contexts model Customer.

**Why It Matters**: Bounded Context isolation enables independent evolution. When a media platform's Sales team needed to add subscription tiers, they modified their Customer model without coordinating with Streaming, Support, or Analytics teams. Each context evolved at its own pace, deployed independently, and maintained backward compatibility only at integration boundaries. This organizational independence significantly reduced feature delivery time because teams no longer waited for cross-context alignment meetings.

### Example 33: Bounded Context Implementation - Shipping Context

The same domain concept (Customer) modeled differently in Shipping Context, focusing on delivery logistics rather than sales.

```typescript
// Shipping Bounded Context - Customer means "Delivery recipient"
namespace ShippingContext {
  // => ShippingContext: context boundary namespace

  // Shipping-specific Customer entity
  export class Customer {
    // => Shipping context: Customer = delivery address holder
    private readonly customerId: string; // => Unique identifier in Shipping
    private readonly name: string; // => Recipient name for delivery
    private readonly addresses: DeliveryAddress[] = []; // => Delivery locations

    constructor(customerId: string, name: string) {
      // => Constructor: initializes new instance

      this.customerId = customerId; // => Initialize customer ID
      this.name = name; // => Set recipient name
    }

    addDeliveryAddress(address: DeliveryAddress): void {
      // => addDeliveryAddress(): returns void

      this.addresses.push(address); // => Add delivery location
      // => Address added to customer's delivery options
    }

    getDefaultAddress(): DeliveryAddress | null {
      // => getDefaultAddress(): returns DeliveryAddress | null

      const defaultAddr = this.addresses.find((a) => a.isDefault());
      // => Find default address
      return defaultAddr || null; // => Return default or null
    }

    getCustomerId(): string {
      // => getCustomerId(): returns string

      return this.customerId; // => Expose customer ID
    }
  }

  // Shipping-specific value object
  export class DeliveryAddress {
    private readonly street: string; // => Street address
    private readonly city: string; // => City name
    private readonly zipCode: string; // => Postal code
    private readonly country: string; // => Country
    private readonly isDefaultAddress: boolean; // => Default flag

    constructor(street: string, city: string, zipCode: string, country: string, isDefaultAddress: boolean = false) {
      // => Constructor: initializes new instance

      this.street = street; // => Initialize street
      this.city = city; // => Initialize city
      this.zipCode = zipCode; // => Initialize zip code
      this.country = country; // => Initialize country
      this.isDefaultAddress = isDefaultAddress; // => Set default flag
    }

    isDefault(): boolean {
      // => isDefault(): returns boolean

      return this.isDefaultAddress; // => Return default status
    }

    getFullAddress(): string {
      // => getFullAddress(): returns string

      return `${this.street}, ${this.city}, ${this.zipCode}, ${this.country}`;
      // => Format complete address string
    }
  }

  // Shipment entity - Shipping context specific
  export class Shipment {
    private readonly shipmentId: string; // => Shipment identifier
    private readonly customerId: string; // => Reference to customer
    private readonly address: DeliveryAddress; // => Delivery destination
    private status: ShipmentStatus = "PENDING"; // => Current status

    constructor(shipmentId: string, customerId: string, address: DeliveryAddress) {
      // => Constructor: initializes new instance

      this.shipmentId = shipmentId; // => Initialize shipment ID
      this.customerId = customerId; // => Link to customer
      this.address = address; // => Set delivery address
    }

    ship(): void {
      // => ship(): returns void

      if (this.status !== "PENDING") {
        // => Validate current status
        throw new Error("Shipment already processed");
        // => Throws domain error: "Shipment already processed"
      }
      this.status = "SHIPPED"; // => Update to shipped
      // => Shipment marked as shipped
    }

    getStatus(): ShipmentStatus {
      // => getStatus(): returns ShipmentStatus

      return this.status; // => Return current status
    }
  }

  type ShipmentStatus = "PENDING" | "SHIPPED" | "DELIVERED";
  // => Type definition for shipment states
}

// Usage - Shipping Context operations
const shippingCustomer = new ShippingContext.Customer("C123", "Alice Smith");
// => shippingCustomer: name="Alice Smith", addresses=[]
const address = new ShippingContext.DeliveryAddress("123 Main St", "Seattle", "98101", "USA", true);
// => address: street="123 Main St", city="Seattle", isDefault=true
shippingCustomer.addDeliveryAddress(address);
// => Address added to customer's delivery options
const shipment = new ShippingContext.Shipment("S789", "C123", address);
// => shipment: status="PENDING", address=address
shipment.ship();
// => shipment.status becomes "SHIPPED"
console.log(shipment.getStatus());
// => Outputs result
// => Output: SHIPPED
```

**Key Takeaway**: Shipping Context models Customer completely differently than Sales Context. Same customerId links the concepts, but Shipping focuses on delivery addresses and logistics, not credit limits or purchase history. Each context optimizes its model for its specific responsibilities.

**Why It Matters**: Context-specific models prevent feature bloat. Shipping systems integrated with e-commerce platforms need shipping addresses and package dimensions, not customer credit scores or purchase preferences. By maintaining separate Shipping and Sales contexts, systems exchange only necessary data through well-defined interfaces, reducing coupling and API payload sizes. This separation enables Shipping systems to serve multiple Sales systems without modification.

### Example 34: Context Mapping - Shared Kernel Pattern

Two Bounded Contexts sharing a common subset of the domain model where tight coordination is acceptable.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Shared Kernel\nCustomer ID\nCurrency\n(shared model)"]
    B["Sales Context\nuses shared kernel"]
    C["Billing Context\nuses shared kernel"]

    A -->|shared by| B
    A -->|shared by| C
    B <-->|coordinate changes| C

    style A fill:#029E73,stroke:#000,color:#fff
    style B fill:#0173B2,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
```

```typescript
// Shared Kernel - Common model shared between contexts
namespace SharedKernel {
  // => SharedKernel: context boundary namespace

  // Shared value object - used by multiple contexts
  export class Money {
    private readonly amount: number; // => Monetary amount
    private readonly currency: string; // => Currency code (USD, EUR, etc.)

    constructor(amount: number, currency: string) {
      // => Initialize object with parameters
      if (amount < 0) {
        // => Validate non-negative amount
        throw new Error("Amount cannot be negative");
        // => Raise domain exception
      }
      this.amount = amount; // => Initialize amount
      this.currency = currency; // => Initialize currency
    }

    add(other: Money): Money {
      // => add(): returns Money

      this.ensureSameCurrency(other); // => Validate currency match
      return new Money(this.amount + other.amount, this.currency);
      // => Return new Money with combined amount
    }

    private ensureSameCurrency(other: Money): void {
      // => Internal logic (not part of public API)
      if (this.currency !== other.currency) {
        // => Validate currencies match
        throw new Error("Cannot operate on different currencies");
        // => Raise domain exception
      }
      // => Currency validation passed
    }

    getAmount(): number {
      // => getAmount(): returns number

      return this.amount; // => Expose amount
    }

    getCurrency(): string {
      // => getCurrency(): returns string

      return this.currency; // => Expose currency
    }
  }

  // Shared enum - product category taxonomy
  export enum ProductCategory {
    ELECTRONICS = "ELECTRONICS", // => Electronic goods
    CLOTHING = "CLOTHING", // => Apparel items
    BOOKS = "BOOKS", // => Published works
    FOOD = "FOOD", // => Consumable products
  }
}

// Billing Context - uses shared kernel
namespace BillingContext {
  // => BillingContext: context boundary namespace

  import Money = SharedKernel.Money; // => Import shared Money type

  export class Invoice {
    private readonly invoiceId: string; // => Invoice identifier
    private readonly items: InvoiceItem[] = []; // => Line items

    constructor(invoiceId: string) {
      // => Constructor: initializes new instance

      this.invoiceId = invoiceId; // => Initialize invoice ID
    }

    addItem(item: InvoiceItem): void {
      // => addItem(): returns void

      this.items.push(item); // => Add line item
      // => Item added to invoice
    }

    getTotal(): Money {
      // => getTotal(): returns Money

      if (this.items.length === 0) {
        // => Check for empty invoice
        return new Money(0, "USD"); // => Return zero amount
      }
      return (
        // => Return result to caller
        this.items
          .map((item) => item.getPrice()) // => Extract prices
          .reduce((sum, price) => sum.add(price))
      ); // => Sum all prices
    }
  }

  export class InvoiceItem {
    private readonly description: string; // => Item description
    private readonly price: Money; // => Item price (shared type)

    constructor(description: string, price: Money) {
      // => Constructor: initializes new instance

      this.description = description; // => Initialize description
      this.price = price; // => Initialize price
    }

    getPrice(): Money {
      // => getPrice(): returns Money

      return this.price; // => Expose price
    }
  }
}

// Accounting Context - also uses shared kernel
namespace AccountingContext {
  // => AccountingContext: context boundary namespace

  import Money = SharedKernel.Money; // => Import shared Money type

  export class Transaction {
    private readonly transactionId: string; // => Transaction identifier
    private readonly amount: Money; // => Transaction amount (shared type)
    private readonly type: "DEBIT" | "CREDIT"; // => Transaction type

    constructor(transactionId: string, amount: Money, type: "DEBIT" | "CREDIT") {
      // => Constructor: initializes new instance

      this.transactionId = transactionId; // => Initialize transaction ID
      this.amount = amount; // => Initialize amount
      this.type = type; // => Set transaction type
    }

    getAmount(): Money {
      // => getAmount(): returns Money

      return this.amount; // => Expose amount
    }

    getType(): string {
      // => getType(): returns string

      return this.type; // => Expose transaction type
    }
  }
}

// Usage - Both contexts use shared Money type
const invoiceItem = new BillingContext.InvoiceItem("Laptop", new SharedKernel.Money(1200, "USD"));
// => invoiceItem: description="Laptop", price=Money{1200, USD}
const invoice = new BillingContext.Invoice("INV-001");
// => invoice: invoiceId="INV-001", items=[]
invoice.addItem(invoiceItem);
// => Item added to invoice
const total = invoice.getTotal();
// => total: Money{1200, USD}
console.log(`Total: ${total.getAmount()} ${total.getCurrency()}`);
// => Outputs result
// => Output: Total: 1200 USD

const transaction = new AccountingContext.Transaction("TXN-001", new SharedKernel.Money(1200, "USD"), "DEBIT");
// => transaction: amount=Money{1200, USD}, type="DEBIT"
console.log(`Transaction: ${transaction.getAmount().getAmount()}`);
// => Outputs result
// => Output: Transaction: 1200
```

**Key Takeaway**: Shared Kernel reduces duplication for commonly used types (Money, Address, etc.) that have identical semantics across contexts. Both teams must coordinate changes to shared code, making this pattern suitable only when tight collaboration is acceptable.

**Why It Matters**: Shared Kernels prevent value object sprawl. A payment platform's Billing and Accounting contexts share Money, Currency, and Account value objects because these have identical semantics in both contexts. This eliminated multiple Money implementations with subtle differences (rounding rules, currency conversion) that caused financial reconciliation errors. However, Shared Kernel requires coordination—both teams must approve changes, making it unsuitable for loosely coupled teams. Use sparingly for truly universal concepts.

### Example 35: Context Mapping - Customer-Supplier Pattern

One context (Supplier) provides services to another context (Customer), with the Customer depending on the Supplier's API.

```typescript
// Supplier Context - Provides product catalog service
namespace ProductCatalogContext {
  // Supplier's public API
  export interface ProductCatalogService {
    getProduct(productId: string): ProductDTO | null; // => Public interface
    searchProducts(query: string): ProductDTO[]; // => Search functionality
  }

  // Data Transfer Object - Supplier's contract
  export interface ProductDTO {
    // => Communicates domain intent
    productId: string; // => Product identifier
    name: string; // => Product name
    description: string; // => Product description
    // => Validates business rule
    price: number; // => Price in cents
    // => Enforces invariant
    currency: string; // => Currency code
  }
  // => Validates business rule

  // Internal implementation (private to Supplier)
  class Product {
    constructor(
      // => Initialize object with parameters
      private readonly productId: string,
      // => Encapsulated state, not directly accessible
      private readonly name: string,
      // => Encapsulated state, not directly accessible
      private readonly description: string,
      // => Encapsulated state, not directly accessible
      private readonly price: number,
      // => Encapsulated state, not directly accessible
      private readonly currency: string,
      // => Encapsulated state, not directly accessible
    ) {}
    // => Enforces invariant

    toDTO(): ProductDTO {
      // => Convert internal model to public DTO
      return {
        productId: this.productId,
        // => Business rule enforced here
        name: this.name,
        // => Execution delegated to domain service
        description: this.description,
        // => Aggregate boundary enforced here
        price: this.price,
        // => Domain event triggered or handled
        currency: this.currency,
        // => Cross-context interaction point
      };
    }
  }

  // Supplier's service implementation
  export class ProductCatalogServiceImpl implements ProductCatalogService {
    private products: Map<string, Product> = new Map();
    // => Encapsulated field (not publicly accessible)
    // => Internal product storage

    constructor() {
      // => Initialize object with parameters
      // Seed with sample data
      const laptop = new Product("P1", "Laptop", "15-inch laptop", 120000, "USD");
      // => laptop: price=120000 cents = $1200
      this.products.set("P1", laptop);
      // => Delegates to internal method
      // => Product stored in catalog
    }

    getProduct(productId: string): ProductDTO | null {
      const product = this.products.get(productId);
      // => Retrieve product by ID
      return product ? product.toDTO() : null;
      // => Return DTO or null if not found
    }

    searchProducts(query: string): ProductDTO[] {
      const results: ProductDTO[] = [];
      // => Create data structure
      this.products.forEach((product) => {
        // => Iterate all products
        if (product["name"].toLowerCase().includes(query.toLowerCase())) {
          // => Check if name matches query
          results.push(product.toDTO());
          // => Add matching product to results
        }
        // => Communicates domain intent
      });
      return results; // => Return matching products
    }
  }
}
// => Validates business rule

// Customer Context - Depends on Supplier's service
namespace OrderManagementContext {
  // => Enforces invariant
  import ProductDTO = ProductCatalogContext.ProductDTO;
  // => Business rule enforced here
  import ProductCatalogService = ProductCatalogContext.ProductCatalogService;
  // => Import Supplier's public contracts

  // Customer's domain model
  export class OrderItem {
    private readonly productId: string; // => Reference to catalog product
    private readonly productName: string; // => Cached name
    private readonly price: number; // => Price at order time
    private readonly quantity: number; // => Quantity ordered

    constructor(productId: string, productName: string, price: number, quantity: number) {
      // => Method body begins here
      this.productId = productId; // => Initialize product ID
      this.productName = productName; // => Initialize cached name
      this.price = price; // => Initialize price snapshot
      this.quantity = quantity; // => Initialize quantity
    }

    getTotalPrice(): number {
      return this.price * this.quantity; // => Calculate line total
    }

    getProductName(): string {
      return this.productName; // => Expose product name
    }
  }

  // Customer's service using Supplier
  export class OrderService {
    constructor(private catalogService: ProductCatalogService) {}
    // => Inject Supplier's service

    createOrderItem(productId: string, quantity: number): OrderItem {
      const productDTO = this.catalogService.getProduct(productId);
      // => Call Supplier's API to get product
      if (!productDTO) {
        // => Validate product exists
        throw new Error("Product not found");
        // => Raise domain exception
      }
      return new OrderItem(productDTO.productId, productDTO.name, productDTO.price, quantity);
      // => Create order item with product data from Supplier
    }
  }
}

// Usage - Customer depends on Supplier
const catalogService = new ProductCatalogContext.ProductCatalogServiceImpl();
// => Supplier service instantiated
const orderService = new OrderManagementContext.OrderService(catalogService);
// => Customer service depends on Supplier

const orderItem = orderService.createOrderItem("P1", 2);
// => Calls Supplier API: getProduct("P1")
// => Creates OrderItem with product data
console.log(`Ordered: ${orderItem.getProductName()}, Total: ${orderItem.getTotalPrice()}`);
// => Outputs result
// => Output: Ordered: Laptop, Total: 240000
```

**Key Takeaway**: Customer-Supplier pattern establishes clear dependency direction. Supplier context defines the contract (DTOs, interfaces), Customer context depends on it. Supplier evolves independently but must maintain backward compatibility for Customer.

**Why It Matters**: Customer-Supplier clarifies API ownership and evolution responsibility. When an e-commerce platform's Inventory context (Supplier) serves Order Management (Customer), Inventory team owns the API contract and ensures backward compatibility. Customer teams can't demand breaking changes without negotiation, preventing the chaos of bidirectional dependencies. This pattern significantly reduced integration failures because API contracts became explicit, versioned, and ownership was clear—Supplier must maintain stability, Customer must adapt to contract.

## Context Mapping Patterns (Examples 36-42)

### Example 36: Anti-Corruption Layer (ACL)

Protecting your context's domain model from external systems by translating external concepts into your ubiquitous language.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["External System\n(legacy/third-party)\nuses foreign concepts"]
    B["Anti-Corruption Layer\ntranslates concepts\nadapter + translator"]
    C["Your Domain\nClean ubiquitous\nlanguage model"]

    A -->|foreign model| B
    B -->|clean domain model| C
    C -.->|never sees| A

    style A fill:#CA9161,stroke:#000,color:#fff
    style B fill:#CC78BC,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

```typescript
// External Payment Gateway - Third-party system with its own model
namespace ExternalPaymentGateway {
  // => ExternalPaymentGateway: context boundary namespace

  // External system's data structure (we don't control this)
  export interface PaymentResponse {
    transaction_id: string; // => Snake case naming
    status_code: number; // => Numeric status codes
    amount_cents: number; // => Amount in cents
    currency_iso: string; // => ISO currency code
    timestamp_ms: number; // => Unix timestamp
    customer_ref: string; // => External customer reference
  }

  // Simulated external API
  export class PaymentGatewayAPI {
    processPayment(amount: number, currency: string, customerRef: string): PaymentResponse {
      // => External system processes payment
      return {
        // => Returns {

        transaction_id: `TXN-${Date.now()}`, // => Generate transaction ID
        status_code: 200, // => 200 = success in their system
        amount_cents: amount,
        currency_iso: currency,
        timestamp_ms: Date.now(),
        // => Execute method
        customer_ref: customerRef,
      };
    }
  }
}

// Our Bounded Context - with its own domain model
namespace PaymentContext {
  // => PaymentContext: context boundary namespace

  // Our domain model - uses our ubiquitous language
  export class Payment {
    private readonly paymentId: string; // => Our naming: paymentId
    private readonly amount: Money; // => Our Money value object
    private readonly status: PaymentStatus; // => Our status enum
    private readonly processedAt: Date; // => Our Date type

    constructor(paymentId: string, amount: Money, status: PaymentStatus, processedAt: Date) {
      // => Constructor: initializes new instance

      this.paymentId = paymentId; // => Initialize payment ID
      this.amount = amount; // => Initialize amount
      this.status = status; // => Initialize status
      this.processedAt = processedAt; // => Initialize timestamp
    }

    isSuccessful(): boolean {
      // => isSuccessful(): returns boolean

      return this.status === PaymentStatus.COMPLETED;
      // => Check if payment succeeded
    }

    getPaymentId(): string {
      // => getPaymentId(): returns string

      return this.paymentId; // => Expose payment ID
    }

    getAmount(): Money {
      // => getAmount(): returns Money

      return this.amount; // => Expose amount
    }
  }

  export class Money {
    constructor(
      // => Initialize object with parameters
      private readonly amount: number,
      // => Encapsulated state, not directly accessible
      private readonly currency: string,
      // => Encapsulated state, not directly accessible
    ) {}
    // => Constructor body empty: no additional initialization needed

    getAmount(): number {
      // => getAmount(): returns number

      return this.amount; // => Expose amount
    }

    getCurrency(): string {
      // => getCurrency(): returns string

      return this.currency; // => Expose currency
    }
  }

  export enum PaymentStatus {
    PENDING = "PENDING", // => Payment initiated
    COMPLETED = "COMPLETED", // => Payment succeeded
    FAILED = "FAILED", // => Payment failed
  }

  // Anti-Corruption Layer - Translates external model to our model
  export class PaymentGatewayAdapter {
    constructor(private readonly gateway: ExternalPaymentGateway.PaymentGatewayAPI) {}
    // => Adapter wraps external system

    processPayment(amount: Money, customerRef: string): Payment {
      // => Public method uses our domain model
      const response = this.gateway.processPayment(amount.getAmount(), amount.getCurrency(), customerRef);
      // => Call external API (uses their model)

      return this.translateToPayment(response);
      // => Translate external response to our domain model
    }

    private translateToPayment(response: ExternalPaymentGateway.PaymentResponse): Payment {
      // => Internal logic (not part of public API)
      // => ACL translation logic
      const money = new Money(response.amount_cents, response.currency_iso);
      // => Convert external amount to our Money type

      const status = this.translateStatus(response.status_code);
      // => Convert external status code to our enum

      const processedAt = new Date(response.timestamp_ms);
      // => Convert Unix timestamp to Date

      return new Payment(response.transaction_id, money, status, processedAt);
      // => Create our domain model from external data
    }

    private translateStatus(statusCode: number): PaymentStatus {
      // => Internal logic (not part of public API)
      // => Map external status codes to our enum
      switch (statusCode) {
        case 200:
          return PaymentStatus.COMPLETED; // => 200 → COMPLETED
        case 400:
        case 500:
          return PaymentStatus.FAILED; // => Error codes → FAILED
        default:
          return PaymentStatus.PENDING; // => Unknown → PENDING
      }
    }
  }
}

// Usage - ACL protects our domain from external model
const externalGateway = new ExternalPaymentGateway.PaymentGatewayAPI();
// => External system instantiated
const adapter = new PaymentContext.PaymentGatewayAdapter(externalGateway);
// => ACL adapter wraps external system

const money = new PaymentContext.Money(5000, "USD");
// => Our Money value object
const payment = adapter.processPayment(money, "CUST-123");
// => Process payment through ACL
// => ACL calls external API, translates response to our model

console.log(`Payment ${payment.getPaymentId()} successful: ${payment.isSuccessful()}`);
// => Outputs result
// => Output: Payment TXN-[timestamp] successful: true
```

**Key Takeaway**: Anti-Corruption Layer (ACL) shields your domain model from external systems by translating between your ubiquitous language and external contracts. This prevents external models from corrupting your carefully crafted domain model with their naming conventions, data structures, and business rules.

**Why It Matters**: ACLs prevent technical debt from external integrations. When a ride-sharing platform integrated with a mapping service API, they built an ACL that translated the external "lat_lng" objects to their own "GeoLocation" domain model. When the external API changed, only the ACL needed updates—none of the platform's domain services changed. Without ACL, the API change would have required updating numerous files across multiple microservices. ACLs isolate integration complexity to a single boundary, protecting domain purity.

### Example 37: Published Language Pattern

Creating a well-documented, stable exchange format (like JSON Schema or Protocol Buffers) that multiple contexts can use for integration.

```typescript
// Published Language - Shared contract for Order events
namespace OrderEventPublishedLanguage {
  // Version 1.0 - Stable, documented contract
  export interface OrderCreatedEvent {
    eventType: "OrderCreated"; // => Event discriminator
    version: "1.0"; // => Schema version for compatibility
    timestamp: string; // => ISO 8601 timestamp
    payload: {
      orderId: string; // => Order identifier
      customerId: string; // => Customer reference
      // => Communicates domain intent
      items: Array<{
        // => Order line items
        productId: string; // => Product reference
        quantity: number; // => Quantity ordered
        priceAtOrder: number; // => Price snapshot in cents
        // => Validates business rule
      }>;
      // => Enforces invariant
      totalAmount: number; // => Total in cents
      currency: string; // => Currency code (ISO 4217)
    };
  }
  // => Validates business rule

  // Validator for Published Language contract
  export class OrderCreatedEventValidator {
    static validate(event: any): event is OrderCreatedEvent {
      // => Type guard for validation
      return (
        event.eventType === "OrderCreated" && // => Check event type
        event.version === "1.0" && // => Check schema version
        typeof event.timestamp === "string" && // => Validate timestamp
        typeof event.payload.orderId === "string" && // => Validate orderId
        Array.isArray(event.payload.items) && // => Validate items array
        typeof event.payload.totalAmount === "number" // => Validate total
      );
      // => Enforces invariant
    }
  }
}

// Context 1 (Publisher) - Order Management publishes events
namespace OrderManagementContext {
  import OrderCreatedEvent = OrderEventPublishedLanguage.OrderCreatedEvent;
  // => Import Published Language contract

  export class Order {
    constructor(
      // => Initialize object with parameters
      private readonly orderId: string,
      // => Encapsulated state, not directly accessible
      private readonly customerId: string,
      // => Encapsulated state, not directly accessible
      private readonly items: OrderItem[],
      // => Encapsulated state, not directly accessible
      private readonly totalAmount: number,
      // => Encapsulated state, not directly accessible
    ) {}

    // Translate internal model to Published Language
    toOrderCreatedEvent(): OrderCreatedEvent {
      // => Convert domain model to Published Language
      return {
        eventType: "OrderCreated",
        // => DDD tactical pattern applied
        version: "1.0",
        // => Entity state transition managed
        timestamp: new Date().toISOString(), // => ISO 8601 format
        payload: {
          orderId: this.orderId,
          // => Transaction boundary maintained
          customerId: this.customerId,
          // => Entity state transition managed
          items: this.items.map((item) => ({
            // => Map domain items to Published Language
            productId: item.productId,
            // => Domain model consistency maintained
            quantity: item.quantity,
            // => Communicates domain intent
            priceAtOrder: item.price,
            // => Domain operation executes here
          })),
          totalAmount: this.totalAmount,
          // => Validates business rule
          currency: "USD",
          // => Enforces invariant
        },
      };
    }
  }

  export class OrderItem {
    constructor(
      // => Initialize object with parameters
      public readonly productId: string,
      public readonly quantity: number,
      public readonly price: number,
    ) {}
  }
}

// Context 2 (Subscriber) - Billing consumes events
namespace BillingContext {
  import OrderCreatedEvent = OrderEventPublishedLanguage.OrderCreatedEvent;
  // => Entity state transition managed
  import Validator = OrderEventPublishedLanguage.OrderCreatedEventValidator;
  // => Import Published Language contract and validator

  export class BillingService {
    handleOrderCreated(event: OrderCreatedEvent): void {
      // => Receive event in Published Language format
      if (!Validator.validate(event)) {
        // => Validate against Published Language schema
        throw new Error("Invalid OrderCreatedEvent");
        // => Raise domain exception
      }

      const invoice = this.createInvoice(event);
      // => Translate Published Language to our domain model
      console.log(`Invoice created: ${invoice.invoiceId}`);
      // => Outputs result
      // => Process in our context's ubiquitous language
    }
    // => Communicates domain intent

    private createInvoice(event: OrderCreatedEvent): Invoice {
      // => Internal logic (not part of public API)
      // => Convert Published Language to our domain model
      return new Invoice(
        // => Communicates domain intent
        `INV-${event.payload.orderId}`, // => Generate invoice ID
        event.payload.customerId,
        // => Domain operation executes here
        event.payload.totalAmount,
        // => Modifies aggregate internal state
      );
      // => Validates business rule
    }
    // => Enforces invariant
  }

  class Invoice {
    constructor(
      // => Initialize object with parameters
      public readonly invoiceId: string,
      public readonly customerId: string,
      public readonly amount: number,
    ) {}
  }
}

// Usage - Published Language enables clean integration
const orderItem = new OrderManagementContext.OrderItem("P123", 2, 5000);
// => orderItem: productId="P123", quantity=2, price=5000
const order = new OrderManagementContext.Order("O456", "C789", [orderItem], 10000);
// => order: orderId="O456", totalAmount=10000

const event = order.toOrderCreatedEvent();
// => Convert to Published Language format
console.log(`Event version: ${event.version}, Type: ${event.eventType}`);
// => Outputs result
// => Output: Event version: 1.0, Type: OrderCreated

const billingService = new BillingContext.BillingService();
// => Billing context service
billingService.handleOrderCreated(event);
// => Consume Published Language event
// => Output: Invoice created: INV-O456
```

**Key Takeaway**: Published Language establishes a documented, versioned contract for inter-context communication. Both publisher and subscriber translate between their internal models and the Published Language, enabling independent evolution as long as the contract is maintained.

**Why It Matters**: Published Language prevents integration brittleness. A payment platform's webhook events use Published Language (JSON schemas with semantic versioning). When their internal Order model added new fields, their webhook schema remained unchanged, preventing breaking changes for API consumers. Publishers evolve internally, subscribers evolve internally, and only the stable Published Language contract binds them—significantly reducing cross-team coordination needs while maintaining integration stability.

### Example 38: Conformist Pattern

When your context must conform to an external system's model because you have no negotiating power to change it.

```typescript
// External System - Legacy ERP we must integrate with
namespace LegacyERPSystem {
  // => LegacyERPSystem: context boundary namespace

  // ERP's model (we don't control this)
  export class ERPCustomer {
    cust_id: string; // => Legacy naming convention
    full_name_text: string; // => Verbose field names
    email_addr: string; // => Abbreviated naming
    credit_limit_cents: number; // => Amount in cents
    status_flag: number; // => 1=active, 0=inactive

    constructor(
      // => Initialize object with parameters
      cust_id: string,
      full_name_text: string,
      email_addr: string,
      credit_limit_cents: number,
      status_flag: number,
    ) {
      this.cust_id = cust_id; // => Initialize customer ID
      this.full_name_text = full_name_text; // => Initialize name
      this.email_addr = email_addr; // => Initialize email
      this.credit_limit_cents = credit_limit_cents; // => Initialize credit limit
      this.status_flag = status_flag; // => Initialize status
    }
  }

  export class ERPService {
    private customers: Map<string, ERPCustomer> = new Map();
    // => Encapsulated field (not publicly accessible)
    // => ERP customer storage

    getCustomer(cust_id: string): ERPCustomer | null {
      // => getCustomer(): returns ERPCustomer | null

      return this.customers.get(cust_id) || null;
      // => Retrieve customer by legacy ID format
    }

    saveCustomer(customer: ERPCustomer): void {
      // => saveCustomer(): returns void

      this.customers.set(customer.cust_id, customer);
      // => Delegates to internal method
      // => Store customer in ERP
    }
  }
}

// Our Context - Conformist approach (no translation layer)
namespace SalesContext {
  // => SalesContext: context boundary namespace

  import ERPCustomer = LegacyERPSystem.ERPCustomer;
  import ERPService = LegacyERPSystem.ERPService;
  // => Direct import of ERP types (conformist)

  // We conform to ERP's model instead of maintaining our own
  export class SalesService {
    constructor(private erpService: ERPService) {}
    // => Inject ERP service

    createCustomer(name: string, email: string, creditLimit: number): ERPCustomer {
      // => Use ERP model directly in our domain
      const customer = new ERPCustomer(
        // => customer = new ERPCustomer(

        `CUST-${Date.now()}`, // => Generate ERP-format ID
        name,
        email,
        creditLimit * 100, // => Convert to cents for ERP
        1, // => 1 = active in ERP's convention
      );
      // => Create ERP customer directly

      this.erpService.saveCustomer(customer);
      // => Delegates to internal method
      // => Save using ERP service
      return customer; // => Return ERP model
    }

    isCustomerActive(customer: ERPCustomer): boolean {
      // => Our business logic uses ERP conventions
      return customer.status_flag === 1;
      // => Check status using ERP's numeric flag
    }

    getCreditLimitDollars(customer: ERPCustomer): number {
      // => Our helper methods work with ERP model
      return customer.credit_limit_cents / 100;
      // => Convert cents to dollars
    }
  }
}

// Usage - Conformist pattern (accept external model)
const erpService = new LegacyERPSystem.ERPService();
// => ERP service instantiated
const salesService = new SalesContext.SalesService(erpService);
// => Our service conforms to ERP

const customer = salesService.createCustomer("Alice", "alice@example.com", 5000);
// => Creates ERPCustomer directly
console.log(`Customer: ${customer.full_name_text}, Active: ${salesService.isCustomerActive(customer)}`);
// => Outputs result
// => Output: Customer: Alice, Active: true
console.log(`Credit limit: $${salesService.getCreditLimitDollars(customer)}`);
// => Outputs result
// => Output: Credit limit: $5000
```

**Key Takeaway**: Conformist pattern accepts the external system's model without translation. Use when the external system is non-negotiable (legacy ERP, government API) and the cost of maintaining an Anti-Corruption Layer exceeds the benefit. Your domain adopts their naming, data structures, and conventions.

**Why It Matters**: Conformist reduces integration overhead when you lack leverage. Small startups integrating with Salesforce or SAP often use Conformist because building ACLs for massive external systems is prohibitively expensive. The trade-off: your domain model becomes coupled to external conventions, but you avoid maintaining translation layers. Use Conformist for stable, dominant external systems where you're a small player—save ACL investment for systems you can influence or that change frequently.

### Example 39: Open Host Service Pattern

Defining a clear protocol for accessing your context's services, making it easy for multiple consumers to integrate.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Open Host Service\nPublished REST API\nstable protocol"]
    B["Consumer A\nMobile App"]
    C["Consumer B\nPartner System"]
    D["Consumer C\nInternal Service"]
    E["Your Domain\nBounded Context"]

    A -->|serves| B
    A -->|serves| C
    A -->|serves| D
    E -->|exposes via| A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#DE8F05,stroke:#000,color:#000
    style E fill:#029E73,stroke:#000,color:#fff
```

```typescript
// Our Bounded Context - Inventory Management (Host)
namespace InventoryContext {
  // Internal domain model (private)
  class Product {
    constructor(
      // => Initialize object with parameters
      private readonly productId: string,
      // => Encapsulated state, not directly accessible
      private readonly name: string,
      // => Encapsulated state, not directly accessible
      private stockLevel: number,
      // => Encapsulated field (not publicly accessible)
    ) {}

    reserveStock(quantity: number): void {
      if (this.stockLevel < quantity) {
        // => Validate sufficient stock
        throw new Error("Insufficient stock");
        // => Raise domain exception
      }
      this.stockLevel -= quantity; // => Reduce available stock
      // => Modifies stockLevel
      // => State change operation
      // => Stock reserved successfully
    }
    // => Validates business rule

    getStockLevel(): number {
      return this.stockLevel; // => Expose current stock
    }
    // => Enforces invariant

    getProductId(): string {
      return this.productId; // => Expose product ID
      // => Communicates domain intent
    }

    getName(): string {
      return this.name; // => Expose product name
    }
  }

  // Public API - Open Host Service
  export interface InventoryService {
    // => Public interface for external contexts
    checkAvailability(productId: string): StockAvailabilityDTO;
    // => Check stock availability
    reserveStock(request: StockReservationRequest): StockReservationResult;
    // => Reserve stock for order
  }

  // Public DTOs - Well-documented contracts
  export interface StockAvailabilityDTO {
    productId: string; // => Product identifier
    // => Validates business rule
    productName: string; // => Product name
    // => Enforces invariant
    availableQuantity: number; // => Current stock level
    isAvailable: boolean; // => Availability flag
  }

  export interface StockReservationRequest {
    productId: string; // => Product to reserve
    quantity: number; // => Quantity to reserve
    reservationId: string; // => Idempotency key
  }

  export interface StockReservationResult {
    success: boolean; // => Reservation outcome
    reservationId: string; // => Idempotency key
    remainingStock: number; // => Stock after reservation
  }

  // Open Host Service implementation
  export class InventoryServiceImpl implements InventoryService {
    private products: Map<string, Product> = new Map();
    // => Encapsulated field (not publicly accessible)
    // => Internal product storage

    constructor() {
      // => Initialize object with parameters
      // Seed initial inventory
      this.products.set("P1", new Product("P1", "Laptop", 50));
      // => Delegates to internal method
      // => Product P1: stockLevel=50
      this.products.set("P2", new Product("P2", "Mouse", 200));
      // => Delegates to internal method
      // => Product P2: stockLevel=200
    }

    checkAvailability(productId: string): StockAvailabilityDTO {
      // => Public method: check stock
      const product = this.products.get(productId);
      // => Retrieve product from internal model

      if (!product) {
        // => Product not found
        return {
          productId,
          // => Entity state transition managed
          productName: "Unknown",
          // => Domain model consistency maintained
          availableQuantity: 0,
          // => Communicates domain intent
          isAvailable: false,
          // => Domain operation executes here
        };
        // => Return unavailable DTO
      }

      return {
        // => Convert internal model to public DTO
        productId: product.getProductId(),
        // => Execute method
        productName: product.getName(),
        // => Execute method
        availableQuantity: product.getStockLevel(),
        // => Execute method
        isAvailable: product.getStockLevel() > 0,
        // => Execute method
      };
      // => Return availability DTO
    }
    // => Validates business rule

    reserveStock(request: StockReservationRequest): StockReservationResult {
      // => Public method: reserve stock
      const product = this.products.get(request.productId);
      // => Retrieve product

      if (!product) {
        // => Product not found
        return {
          success: false,
          // => Enforces invariant
          reservationId: request.reservationId,
          // => Business rule enforced here
          remainingStock: 0,
          // => Execution delegated to domain service
        };
      }

      try {
        product.reserveStock(request.quantity);
        // => Attempt reservation on domain model
        return {
          success: true,
          // => DDD tactical pattern applied
          reservationId: request.reservationId,
          // => Invariant validation executed
          remainingStock: product.getStockLevel(),
          // => Execute method
        };
        // => Return success result
      } catch (error) {
        // => Reservation failed (insufficient stock)
        return {
          success: false,
          // => Transaction boundary maintained
          reservationId: request.reservationId,
          // => Entity state transition managed
          remainingStock: product.getStockLevel(),
          // => Execute method
        };
        // => Return failure result
      }
    }
    // => Communicates domain intent
  }
}

// Consumer Context - Order Management uses Open Host Service
namespace OrderContext {
  // => Validates business rule
  import InventoryService = InventoryContext.InventoryService;
  // => Enforces invariant
  import StockReservationRequest = InventoryContext.StockReservationRequest;
  // => Import public contracts from Open Host

  export class OrderService {
    constructor(private inventoryService: InventoryService) {}
    // => Depend on Open Host Service interface

    placeOrder(productId: string, quantity: number): void {
      // => Place order using inventory service
      const availability = this.inventoryService.checkAvailability(productId);
      // => Check availability via Open Host Service

      if (!availability.isAvailable || availability.availableQuantity < quantity) {
        // => Validate stock sufficient
        throw new Error("Product not available");
        // => Raise domain exception
      }

      const result = this.inventoryService.reserveStock({
        // => Reserve stock via Open Host Service
        productId,
        // => Execution delegated to domain service
        quantity,
        // => Aggregate boundary enforced here
        reservationId: `RES-${Date.now()}`,
        // => Execute method
      });

      if (!result.success) {
        // => Validate reservation succeeded
        throw new Error("Reservation failed");
        // => Raise domain exception
      }

      console.log(`Order placed. Remaining stock: ${result.remainingStock}`);
      // => Outputs result
      // => Output success message
    }
  }
}

// Usage - Multiple consumers can easily integrate
const inventoryService = new InventoryContext.InventoryServiceImpl();
// => Open Host Service instantiated

const availability = inventoryService.checkAvailability("P1");
// => Check stock via public API
console.log(`${availability.productName}: ${availability.availableQuantity} available`);
// => Outputs result
// => Output: Laptop: 50 available

const orderService = new OrderContext.OrderService(inventoryService);
// => Consumer uses Open Host Service
orderService.placeOrder("P1", 5);
// => Order placed. Remaining stock: 45
```

**Key Takeaway**: Open Host Service provides a well-documented, stable public API that makes integration easy for multiple consumers. Internal domain model remains private; only DTOs and service interfaces are exposed. This pattern standardizes access and reduces integration complexity.

**Why It Matters**: Open Host Service reduces integration fragmentation. Major cloud storage providers use Open Host Services (RESTful APIs with multi-language SDKs), enabling widespread integration with stable contracts. Before standardizing on Open Host pattern, many early cloud platforms had numerous different integration patterns, requiring custom code per service. Open Host Service with stable contracts significantly reduces integration time and enables self-service integration without direct platform team involvement.

### Example 40: Separate Ways Pattern

Acknowledging that two contexts have no integration needs and can evolve independently without communication.

```typescript
// Context 1 - Employee HR Management
namespace HRContext {
  // => HRContext: context boundary namespace

  export class Employee {
    // => HR's Employee model
    private readonly employeeId: string; // => HR identifier
    private readonly fullName: string; // => Legal name
    private readonly department: string; // => Org structure
    private readonly salary: number; // => Compensation info
    private readonly hireDate: Date; // => Employment start date

    constructor(employeeId: string, fullName: string, department: string, salary: number, hireDate: Date) {
      // => Constructor: initializes new instance

      this.employeeId = employeeId; // => Initialize employee ID
      this.fullName = fullName; // => Initialize name
      this.department = department; // => Initialize department
      this.salary = salary; // => Initialize salary
      this.hireDate = hireDate; // => Initialize hire date
    }

    promoteEmployee(newDepartment: string, newSalary: number): void {
      // => HR operation: promotion
      // Note: No integration with CustomerSupport context
      console.log(`Promoted ${this.fullName} to ${newDepartment}`);
      // => Delegates to internal method
      // => Outputs result
      // => HR-specific business logic
    }

    getEmployeeId(): string {
      // => getEmployeeId(): returns string

      return this.employeeId; // => Expose employee ID
    }
  }

  export class HRService {
    private employees: Map<string, Employee> = new Map();
    // => Encapsulated field (not publicly accessible)
    // => HR employee records

    hireEmployee(employee: Employee): void {
      // => hireEmployee(): returns void

      this.employees.set(employee.getEmployeeId(), employee);
      // => Delegates to internal method
      // => Add employee to HR system
      console.log("Employee hired in HR system");
      // => Outputs result
      // => HR-specific process (no external context notified)
    }
  }
}

// Context 2 - Customer Support Ticketing (completely independent)
namespace CustomerSupportContext {
  // => CustomerSupportContext: context boundary namespace

  export class SupportAgent {
    // => Support's Agent model (different from HR Employee!)
    private readonly agentId: string; // => Support identifier
    private readonly displayName: string; // => Customer-facing name
    private readonly skillSet: string[]; // => Support categories
    private readonly activeTickets: number = 0; // => Current workload

    constructor(agentId: string, displayName: string, skillSet: string[]) {
      // => Constructor: initializes new instance

      this.agentId = agentId; // => Initialize agent ID
      this.displayName = displayName; // => Initialize display name
      this.skillSet = skillSet; // => Initialize skills
    }

    assignTicket(ticket: SupportTicket): void {
      // => Support operation: ticket assignment
      // Note: No integration with HR context
      console.log(`Ticket assigned to ${this.displayName}`);
      // => Delegates to internal method
      // => Outputs result
      // => Support-specific business logic
    }

    getAgentId(): string {
      // => getAgentId(): returns string

      return this.agentId; // => Expose agent ID
    }
  }

  export class SupportTicket {
    constructor(
      private readonly ticketId: string,
      // => ticketId: private readonly string field

      private readonly description: string,
      // => description: private readonly string field
    ) {}
    // => Constructor body empty: no additional initialization needed

    getTicketId(): string {
      // => getTicketId(): returns string

      return this.ticketId; // => Expose ticket ID
    }
  }

  export class SupportService {
    private agents: Map<string, SupportAgent> = new Map();
    // => Encapsulated field (not publicly accessible)
    // => Support agent records

    registerAgent(agent: SupportAgent): void {
      // => registerAgent(): returns void

      this.agents.set(agent.getAgentId(), agent);
      // => Delegates to internal method
      // => Add agent to Support system
      console.log("Agent registered in Support system");
      // => Outputs result
      // => Support-specific process (no HR context notified)
    }
  }
}

// Usage - Separate Ways: No integration between contexts
const hrService = new HRContext.HRService();
// => HR context service
const employee = new HRContext.Employee("E123", "Alice Johnson", "Engineering", 120000, new Date("2024-01-15"));
// => HR Employee entity
hrService.hireEmployee(employee);
// => Output: Employee hired in HR system
// => Note: No notification to Support context

const supportService = new CustomerSupportContext.SupportService();
// => Support context service (independent)
const agent = new CustomerSupportContext.SupportAgent("A456", "Alice J.", ["Technical", "Billing"]);
// => Support Agent entity (unrelated to HR Employee)
supportService.registerAgent(agent);
// => Output: Agent registered in Support system
// => Note: No notification to HR context

// These contexts operate independently - no shared data, no integration
console.log("Contexts operate separately with no integration");
// => Outputs result
```

**Key Takeaway**: Separate Ways acknowledges that integration isn't always necessary or valuable. When two contexts have no business reason to communicate, forcing integration creates unnecessary coupling and complexity. Let them evolve independently.

**Why It Matters**: Not every context needs integration. A media platform's HR system and their Content Recommendation engine have zero integration points—HR hires people, Recommendation suggests videos, and these domains don't overlap. Forcing integration (e.g., "recommend employee training based on viewing habits") would create artificial coupling for negligible value. Separate Ways saves development cost by explicitly documenting "no integration needed," preventing future teams from wasting time on unnecessary integration projects.

### Example 41: Partnership Pattern

Two teams with mutual dependency commit to coordinating their development to support each other's needs.

```typescript
// Context 1 - Order Management (Partner A)
namespace OrderManagementContext {
  export class Order {
    constructor(
      // => Initialize object with parameters
      private readonly orderId: string,
      // => Encapsulated state, not directly accessible
      private readonly customerId: string,
      // => Encapsulated state, not directly accessible
      private readonly items: OrderItem[],
      // => Encapsulated state, not directly accessible
      private status: OrderStatus = "PENDING",
      // => Encapsulated field (not publicly accessible)
    ) {}

    confirm(): void {
      if (this.status !== "PENDING") {
        // => Validate status
        throw new Error("Order already processed");
        // => Raise domain exception
      }
      this.status = "CONFIRMED"; // => Update status
      // => Order confirmed, ready for payment
    }
    // => Validates business rule

    getOrderId(): string {
      return this.orderId; // => Expose order ID
      // => Validates business rule
    }
    // => Enforces invariant

    getStatus(): OrderStatus {
      return this.status; // => Expose status
      // => Enforces invariant
    }

    getTotalAmount(): number {
      return this.items.reduce((sum, item) => sum + item.getTotal(), 0);
      // => Calculate total amount
    }
  }

  export class OrderItem {
    constructor(
      // => Initialize object with parameters
      private readonly productId: string,
      // => Encapsulated state, not directly accessible
      private readonly quantity: number,
      // => Encapsulated state, not directly accessible
      private readonly price: number,
      // => Encapsulated state, not directly accessible
    ) {}

    getTotal(): number {
      return this.quantity * this.price; // => Line item total
    }
  }

  export type OrderStatus = "PENDING" | "CONFIRMED" | "PAID" | "SHIPPED";
  // => Invariant validation executed

  // Partnership coordination method - supports PaymentContext
  export interface OrderService {
    getOrderForPayment(orderId: string): OrderPaymentDetails;
    // => Method designed in partnership with Payment team
    markOrderAsPaid(orderId: string): void;
    // => Callback method for Payment team to invoke
  }

  export interface OrderPaymentDetails {
    orderId: string; // => Order identifier
    customerId: string; // => Customer reference
    amount: number; // => Amount to charge
    currency: string; // => Currency code
  }
}
// => Communicates domain intent

// Context 2 - Payment Processing (Partner B)
namespace PaymentContext {
  import OrderPaymentDetails = OrderManagementContext.OrderPaymentDetails;
  // => Import partner's contract

  export class Payment {
    constructor(
      // => Initialize object with parameters
      private readonly paymentId: string,
      // => Encapsulated state, not directly accessible
      private readonly orderId: string,
      // => Encapsulated state, not directly accessible
      private readonly amount: number,
      // => Encapsulated state, not directly accessible
      private status: PaymentStatus = "PENDING",
      // => Encapsulated field (not publicly accessible)
    ) {}

    process(): void {
      if (this.status !== "PENDING") {
        // => Validate status
        throw new Error("Payment already processed");
        // => Raise domain exception
      }
      this.status = "COMPLETED"; // => Update status
      // => Payment processed successfully
    }
    // => Validates business rule

    getStatus(): PaymentStatus {
      return this.status; // => Expose status
    }
    // => Enforces invariant

    getOrderId(): string {
      return this.orderId; // => Expose order ID
    }
  }

  export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";
  // => Aggregate boundary enforced here

  // Partnership coordination - designed with Order team
  export interface PaymentService {
    processOrderPayment(paymentDetails: OrderPaymentDetails): Payment;
    // => Method uses Order team's contract
  }
}

// Partnership implementation - coordinated development
class PartnershipCoordinator {
  constructor(
    // => Initialize object with parameters
    private orderRepository: Map<string, OrderManagementContext.Order>,
    // => Encapsulated field (not publicly accessible)
    private paymentRepository: Map<string, PaymentContext.Payment>,
    // => Encapsulated field (not publicly accessible)
  ) {}

  // Workflow coordinated between both teams
  processOrderWithPayment(orderId: string): void {
    // => Partnership workflow
    const order = this.orderRepository.get(orderId);
    // => Retrieve order
    if (!order) {
      throw new Error("Order not found");
      // => Raise domain exception
    }

    // Step 1: Order team confirms order
    order.confirm();
    // => Order status: PENDING → CONFIRMED

    // Step 2: Create payment details (agreed interface)
    const paymentDetails: OrderManagementContext.OrderPaymentDetails = {
      // => Create data structure
      orderId: order.getOrderId(),
      // => Execute method
      customerId: "CUST-123",
      // => Entity state transition managed
      amount: order.getTotalAmount(),
      // => Execute method
      currency: "USD",
      // => Domain model consistency maintained
    };
    // => Payment details extracted from order

    // Step 3: Payment team processes payment
    const payment = new PaymentContext.Payment(`PAY-${Date.now()}`, paymentDetails.orderId, paymentDetails.amount);
    // => Payment created
    payment.process();
    // => Payment processed

    this.paymentRepository.set(payment.getOrderId(), payment);
    // => Delegates to internal method
    // => Payment stored

    console.log(`Partnership workflow: Order ${orderId} confirmed and paid`);
    // => Outputs result
    // => Both contexts coordinated successfully
  }
  // => Communicates domain intent
}

// Usage - Partnership pattern in action
const orderRepo = new Map<string, OrderManagementContext.Order>();
// => Store value in orderRepo
const paymentRepo = new Map<string, PaymentContext.Payment>();
// => Store value in paymentRepo

const orderItem = new OrderManagementContext.OrderItem("P1", 2, 5000);
// => orderItem: quantity=2, price=5000
const order = new OrderManagementContext.Order("O123", "C456", [orderItem]);
// => order: totalAmount=10000, status="PENDING"
orderRepo.set("O123", order);
// => Execute method

const coordinator = new PartnershipCoordinator(orderRepo, paymentRepo);
// => Coordinator manages partnership workflow
coordinator.processOrderWithPayment("O123");
// => Output: Partnership workflow: Order O123 confirmed and paid
```

**Key Takeaway**: Partnership pattern formalizes mutual dependency between two contexts. Both teams coordinate development schedules, share interface designs, and commit to supporting each other's needs. Use when success of both contexts depends on tight integration and neither dominates the relationship.

**Why It Matters**: Partnership enables collaborative innovation when contexts need deep integration. A payment platform's Payment and Fraud Detection contexts operate as partners—Fraud needs real-time payment data, Payments need immediate fraud verdicts. Both teams meet regularly to coordinate API changes, release schedules, and feature roadmaps. This partnership significantly reduced payment fraud while maintaining low payment latency. Partnership works when both teams have equal leverage and mutual dependency—otherwise, use Customer-Supplier pattern.

### Example 42: Big Ball of Mud Pattern (Anti-Pattern Recognition)

Recognizing when no clear boundaries exist and refactoring toward proper Bounded Contexts.

```typescript
// ANTI-PATTERN: Big Ball of Mud - No clear context boundaries
class GodClass {
  // => Single class mixing multiple domain concerns
  private customerId: string; // => Sales concern
  private orderHistory: any[] = []; // => Order concern
  private shippingAddress: string; // => Shipping concern
  private creditLimit: number; // => Finance concern
  private supportTickets: any[] = []; // => Support concern
  // => Communicates domain intent
  private loyaltyPoints: number; // => Marketing concern

  // Sales method
  placeOrder(orderId: string, amount: number): void {
    // => Sales logic mixed with everything else
    if (amount > this.creditLimit) {
      throw new Error("Credit limit exceeded");
      // => Raise domain exception
    }
    this.orderHistory.push({ orderId, amount });
    // => Delegates to internal method
    this.loyaltyPoints += Math.floor(amount / 100);
    // => Modifies loyaltyPoints
    // => State change operation
    // => Multiple concerns entangled
  }

  // Support method
  createTicket(issue: string): void {
    // => Support logic mixed in
    this.supportTickets.push({ issue, date: new Date() });
    // => Delegates to internal method
  }
  // => Validates business rule

  // Shipping method
  updateAddress(newAddress: string): void {
    // => Shipping logic mixed in
    this.shippingAddress = newAddress;
    // => Update shippingAddress state
  }
  // => Enforces invariant
}

// REFACTORED: Clear Bounded Contexts
namespace RefactoredSalesContext {
  export class Customer {
    // => Sales-specific customer model
    private readonly customerId: string;
    // => Encapsulated state, not directly accessible
    private readonly creditLimit: number;
    // => Encapsulated state, not directly accessible
    private orders: string[] = [];
    // => Encapsulated field (not publicly accessible)

    constructor(customerId: string, creditLimit: number) {
      // => Initialize object with parameters
      this.customerId = customerId;
      // => Update customerId state
      this.creditLimit = creditLimit;
      // => Update creditLimit state
    }

    placeOrder(orderId: string, amount: number): void {
      // => Pure sales business logic
      if (amount > this.creditLimit) {
        throw new Error("Credit limit exceeded");
        // => Raise domain exception
      }
      this.orders.push(orderId);
      // => Delegates to internal method
      // => Sales concern isolated
    }

    getCustomerId(): string {
      return this.customerId;
      // => Return result to caller
    }
  }
}

namespace RefactoredShippingContext {
  export class DeliveryProfile {
    // => Shipping-specific model
    private readonly customerId: string;
    // => Encapsulated state, not directly accessible
    private shippingAddress: string;
    // => Encapsulated field (not publicly accessible)

    constructor(customerId: string, shippingAddress: string) {
      // => Initialize object with parameters
      this.customerId = customerId;
      // => Update customerId state
      this.shippingAddress = shippingAddress;
      // => Update shippingAddress state
    }

    updateAddress(newAddress: string): void {
      // => Pure shipping business logic
      this.shippingAddress = newAddress;
      // => Shipping concern isolated
    }
    // => Communicates domain intent

    getAddress(): string {
      return this.shippingAddress;
      // => Return result to caller
    }
  }
}
// => Validates business rule

namespace RefactoredSupportContext {
  // => Enforces invariant
  export class CustomerAccount {
    // => Support-specific model
    private readonly customerId: string;
    // => Encapsulated state, not directly accessible
    private tickets: Ticket[] = [];
    // => Encapsulated field (not publicly accessible)

    constructor(customerId: string) {
      // => Initialize object with parameters
      this.customerId = customerId;
      // => Update customerId state
    }

    createTicket(issue: string): Ticket {
      // => Pure support business logic
      const ticket = new Ticket(issue, new Date());
      // => Store value in ticket
      this.tickets.push(ticket);
      // => Delegates to internal method
      return ticket;
      // => Support concern isolated
    }
  }

  class Ticket {
    constructor(
      // => Initialize object with parameters
      public readonly issue: string,
      public readonly createdAt: Date,
    ) {}
  }
}

// Usage - Proper context boundaries
const salesCustomer = new RefactoredSalesContext.Customer("C123", 10000);
// => Sales context: focus on credit and orders
salesCustomer.placeOrder("O456", 5000);
// => Execute method

const deliveryProfile = new RefactoredShippingContext.DeliveryProfile("C123", "123 Main St");
// => Shipping context: focus on delivery logistics
deliveryProfile.updateAddress("456 Oak Ave");
// => Execute method

const supportAccount = new RefactoredSupportContext.CustomerAccount("C123");
// => Support context: focus on customer issues
supportAccount.createTicket("Product defect");
// => Execute method

console.log("Contexts properly separated with clear boundaries");
// => Outputs result
```

**Key Takeaway**: Big Ball of Mud occurs when no Bounded Contexts exist—all domain concepts tangled in shared classes. Refactoring into Bounded Contexts separates concerns, enabling independent evolution and clearer domain models. Recognize the anti-pattern by spotting classes mixing unrelated business rules.

**Why It Matters**: Big Ball of Mud is the default state without DDD. A marketplace platform's initial codebase had a single "User" class with many fields serving Hosts, Guests, Payment, Support, and Marketing. Refactoring into context-specific models (Host, Guest, PaymentAccount, SupportCase, MarketingProfile) significantly reduced the User class complexity into multiple focused classes. This separation enabled independent teams to work simultaneously without merge conflicts, accelerating feature delivery.

## Application Services (Examples 43-47)

### Example 43: Application Service - Orchestrating Use Cases

Application Services coordinate domain objects to fulfill use cases. They're transaction boundaries that delegate business logic to domain entities while managing infrastructure concerns.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant UI as UI/Controller
    participant AS as Application Service
    participant Repo as Repository
    participant Agg as Order (Aggregate)
    participant EB as Event Bus

    UI->>AS: placeOrder(command)
    AS->>Repo: findCustomer(id)
    AS->>Agg: place(items)
    Agg-->>AS: OrderPlaced event
    AS->>Repo: save(order)
    AS->>EB: publish(event)
    AS-->>UI: result
```

```typescript
// Domain Layer - Rich domain model with business logic
class BankAccount {
  private constructor(
    // => Initialize object with parameters
    private readonly accountId: string,
    // => Encapsulated state, not directly accessible
    private balance: number,
    // => Encapsulated field (not publicly accessible)
    private readonly overdraftLimit: number,
    // => Encapsulated state, not directly accessible
  ) {}

  static create(accountId: string, initialDeposit: number, overdraftLimit: number): BankAccount {
    // => Factory method with business rules
    if (initialDeposit < 0) {
      throw new Error("Initial deposit cannot be negative");
      // => Raise domain exception
    }
    return new BankAccount(accountId, initialDeposit, overdraftLimit);
    // => Create new account with validated initial state
  }
  // => Validates business rule

  withdraw(amount: number): void {
    // => Domain business logic
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
      // => Raise domain exception
    }
    // => Enforces invariant
    const availableBalance = this.balance + this.overdraftLimit;
    // => Store value in availableBalance
    if (amount > availableBalance) {
      throw new Error("Insufficient funds including overdraft");
      // => Raise domain exception
    }
    this.balance -= amount;
    // => State change operation
    // => Modifies state value
    // => Balance updated
    // => Balance updated, business rules enforced
  }

  deposit(amount: number): void {
    // => Domain business logic
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive");
      // => Raise domain exception
    }
    this.balance += amount;
    // => State change operation
    // => Modifies state value
    // => Balance updated
    // => Balance updated
  }

  getBalance(): number {
    return this.balance;
    // => Return result to caller
  }

  getAccountId(): string {
    return this.accountId;
    // => Return result to caller
  }
}

// Repository Interface (Domain Layer)
interface BankAccountRepository {
  // => BankAccountRepository: contract definition
  findById(accountId: string): BankAccount | null;
  save(account: BankAccount): void;
}

// Application Service - Orchestrates use case
class TransferApplicationService {
  // => Application layer: coordinates domain objects
  constructor(private readonly accountRepository: BankAccountRepository) {}
  // => Initialize object with parameters

  transferMoney(fromAccountId: string, toAccountId: string, amount: number): void {
    // => Use case: transfer money between accounts
    // Step 1: Load aggregates
    const fromAccount = this.accountRepository.findById(fromAccountId);
    // => Store value in fromAccount
    const toAccount = this.accountRepository.findById(toAccountId);
    // => Store value in toAccount

    if (!fromAccount || !toAccount) {
      throw new Error("Account not found");
      // => Raise domain exception
    }

    // Step 2: Execute domain logic (business rules in domain)
    fromAccount.withdraw(amount);
    // => Domain enforces withdrawal rules
    toAccount.deposit(amount);
    // => Domain enforces deposit rules

    // Step 3: Persist changes (transaction boundary)
    this.accountRepository.save(fromAccount);
    // => Delegates to internal method
    // => Save updated source account
    this.accountRepository.save(toAccount);
    // => Delegates to internal method
    // => Save updated target account

    // => Application Service coordinates, domain objects enforce rules
  }
}
// => Communicates domain intent

// Infrastructure Layer - Repository implementation
class InMemoryBankAccountRepository implements BankAccountRepository {
  private accounts: Map<string, BankAccount> = new Map();
  // => Encapsulated field (not publicly accessible)

  findById(accountId: string): BankAccount | null {
    return this.accounts.get(accountId) || null;
    // => Retrieve account
  }

  save(account: BankAccount): void {
    this.accounts.set(account.getAccountId(), account);
    // => Delegates to internal method
    // => Persist account
  }
}
// => Validates business rule

// Usage - Application Service orchestrates use case
const repository = new InMemoryBankAccountRepository();
// => Infrastructure dependency

const account1 = BankAccount.create("ACC-001", 1000, 500);
// => account1: balance=1000, overdraftLimit=500
repository.save(account1);
// => Execute method

const account2 = BankAccount.create("ACC-002", 500, 0);
// => account2: balance=500, overdraftLimit=0
repository.save(account2);
// => Execute method

const transferService = new TransferApplicationService(repository);
// => Application Service instantiated
transferService.transferMoney("ACC-001", "ACC-002", 300);
// => Orchestrates: withdraw from ACC-001, deposit to ACC-002

console.log(`ACC-001 balance: ${account1.getBalance()}`);
// => Outputs result
// => Output: ACC-001 balance: 700
console.log(`ACC-002 balance: ${account2.getBalance()}`);
// => Outputs result
// => Output: ACC-002 balance: 800
```

**Key Takeaway**: Application Services orchestrate use cases by coordinating domain objects, managing transactions, and handling infrastructure. Business logic stays in domain entities; Application Services delegate to domain objects rather than implementing business rules themselves.

**Why It Matters**: Application Services prevent anemic domain models. When Square refactored their payment processing, they moved business logic from Application Services into Payment, Merchant, and Transaction domain entities. Application Services became thin orchestration layers handling transactions, logging, and event publishing—while domain entities enforced business rules like "refund can't exceed original payment." This separation enabled domain logic reuse across multiple use cases (web API, mobile app, batch processing) without duplicating business rules.

### Example 44: Application Service with Domain Events

Application Services publish domain events after successful use case completion, enabling decoupled communication.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Application Service\nuse case coordinator"]
    B["Domain Aggregate\nbusiness logic"]
    C["Event Publisher\npublishes after commit"]
    D["Email Service\nhandler"]
    E["Audit Service\nhandler"]

    A -->|orchestrates| B
    B -->|raises| C
    A -->|publishes after tx| C
    C -->|notifies| D
    C -->|notifies| E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#000
    style E fill:#DE8F05,stroke:#000,color:#000
```

```typescript
// Domain Event
class OrderPlacedEvent {
  // => Domain event representing business-significant occurrence
  constructor(
    // => Initialize object with parameters
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly occurredAt: Date,
  ) {}
}

// Domain Model
class Order {
  private events: OrderPlacedEvent[] = [];
  // => Encapsulated field (not publicly accessible)
  // => Collect domain events

  constructor(
    // => Initialize object with parameters
    private readonly orderId: string,
    // => Encapsulated state, not directly accessible
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private readonly items: OrderItem[],
    // => Encapsulated state, not directly accessible
    private status: OrderStatus = "DRAFT",
    // => Encapsulated field (not publicly accessible)
  ) {}
  // => Validates business rule

  place(): void {
    // => Domain business logic
    if (this.status !== "DRAFT") {
      throw new Error("Order already placed");
      // => Raise domain exception
    }
    // => Enforces invariant
    this.status = "PLACED";
    // => Status updated

    // Raise domain event
    this.events.push(new OrderPlacedEvent(this.orderId, this.customerId, this.getTotalAmount(), new Date()));
    // => Delegates to internal method
    // => Event recorded for later publication
  }

  getEvents(): OrderPlacedEvent[] {
    return [...this.events];
    // => Expose collected events
  }

  clearEvents(): void {
    this.events = [];
    // => Clear events after publication
  }

  private getTotalAmount(): number {
    // => Internal logic (not part of public API)
    return this.items.reduce((sum, item) => sum + item.price, 0);
    // => Return result to caller
  }

  getOrderId(): string {
    return this.orderId;
    // => Return result to caller
  }
}

class OrderItem {
  constructor(
    // => Initialize object with parameters
    public readonly productId: string,
    public readonly price: number,
  ) {}
}

type OrderStatus = "DRAFT" | "PLACED" | "SHIPPED";
// => Entity state transition managed

// Event Publisher Interface
interface EventPublisher {
  // => EventPublisher: contract definition
  publish(event: OrderPlacedEvent): void;
}

// Application Service - Publishes events after transaction
class PlaceOrderApplicationService {
  constructor(
    // => Initialize object with parameters
    private readonly orderRepository: OrderRepository,
    // => Encapsulated state, not directly accessible
    private readonly eventPublisher: EventPublisher,
    // => Encapsulated state, not directly accessible
  ) {}
  // => Communicates domain intent

  placeOrder(orderId: string): void {
    // => Use case: place order
    const order = this.orderRepository.findById(orderId);
    // => Store value in order
    if (!order) {
      throw new Error("Order not found");
      // => Raise domain exception
    }

    // Execute domain logic
    order.place();
    // => Domain raises event internally

    // Persist changes
    this.orderRepository.save(order);
    // => Delegates to internal method
    // => Save order state

    // Publish domain events (after transaction succeeds)
    const events = order.getEvents();
    // => Store value in events
    events.forEach((event) => this.eventPublisher.publish(event));
    // => Publish events to external subscribers

    order.clearEvents();
    // => Clear events after publication
  }
}
// => Validates business rule

interface OrderRepository {
  // => OrderRepository: contract definition
  findById(orderId: string): Order | null;
  save(order: Order): void;
}
// => Enforces invariant

// Infrastructure - Simple event publisher
class InMemoryEventPublisher implements EventPublisher {
  private publishedEvents: OrderPlacedEvent[] = [];
  // => Encapsulated field (not publicly accessible)

  publish(event: OrderPlacedEvent): void {
    this.publishedEvents.push(event);
    // => Delegates to internal method
    // => Record published event
    console.log(`Event published: OrderPlaced for ${event.orderId}`);
    // => Outputs result
  }

  getPublishedEvents(): OrderPlacedEvent[] {
    return this.publishedEvents;
    // => Return result to caller
  }
}

class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  // => Encapsulated field (not publicly accessible)

  findById(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
    // => Return result to caller
  }

  save(order: Order): void {
    this.orders.set(order.getOrderId(), order);
    // => Delegates to internal method
  }
}

// Usage - Application Service publishes events
const orderRepo = new InMemoryOrderRepository();
// => Store value in orderRepo
const eventPublisher = new InMemoryEventPublisher();
// => Store value in eventPublisher

const order = new Order("O123", "C456", [new OrderItem("P1", 5000), new OrderItem("P2", 3000)]);
// => order: totalAmount=8000, status="DRAFT"
orderRepo.save(order);
// => Execute method

const placeOrderService = new PlaceOrderApplicationService(orderRepo, eventPublisher);
// => Application Service with event publishing
placeOrderService.placeOrder("O123");
// => Output: Event published: OrderPlaced for O123

console.log(`Events published: ${eventPublisher.getPublishedEvents().length}`);
// => Outputs result
// => Output: Events published: 1
```

**Key Takeaway**: Application Services collect domain events from aggregates and publish them after successful transaction completion. Domain objects raise events internally; Application Services handle infrastructure concerns (event publishing, transaction management). This maintains clean separation between domain logic and infrastructure.

**Why It Matters**: Event publishing at Application Service layer ensures consistency. A ride-sharing platform's Trip domain raises TripCompleted event when driver marks trip finished. The Application Service saves trip state, publishes event (triggering payment processing, driver rating prompt, receipt email), and only then commits the transaction. If any step fails, entire operation rolls back—preventing split-brain scenarios where trip marked complete but payment never processed. Application Services as transaction boundaries with event publication ensure atomic state changes plus reliable side effects.

### Example 45: Application Service - Input Validation

Application Services validate input from external sources (API, CLI) before invoking domain logic.

```typescript
// Input DTO from external source (API, CLI, etc.)
interface CreateProductRequest {
  name: string | null; // => May be null from external source
  price: number | null; // => May be null
  category: string | null; // => May be null
}

// Domain Model - assumes valid input
class Product {
  private constructor(
    // => Initialize object with parameters
    private readonly productId: string,
    // => Encapsulated state, not directly accessible
    private readonly name: string,
    // => Encapsulated state, not directly accessible
    private readonly price: number,
    // => Encapsulated state, not directly accessible
    private readonly category: string,
    // => Encapsulated state, not directly accessible
  ) {}

  static create(productId: string, name: string, price: number, category: string): Product {
    // => Domain factory assumes valid input (validation already done)
    return new Product(productId, name, price, category);
    // => Return result to caller
  }
  // => Validates business rule

  getProductId(): string {
    return this.productId;
    // => Return result to caller
  }
  // => Enforces invariant
}

interface ProductRepository {
  // => ProductRepository: contract definition
  save(product: Product): void;
}

// Application Service - validates external input
class CreateProductApplicationService {
  constructor(private readonly productRepository: ProductRepository) {}
  // => Initialize object with parameters

  createProduct(request: CreateProductRequest): string {
    // => Use case with input validation
    // Step 1: Validate input (Application Service responsibility)
    this.validateRequest(request);
    // => Delegates to internal method
    // => Throws if invalid, prevents bad data reaching domain

    // Step 2: Ensure non-null after validation
    const name = request.name!;
    // => Store value in name
    const price = request.price!;
    // => Store value in price
    const category = request.category!;
    // => Store value in category

    // Step 3: Invoke domain logic (assumes valid input)
    const productId = `PROD-${Date.now()}`;
    // => Store value in productId
    const product = Product.create(productId, name, price, category);
    // => Domain creates product with valid data

    // Step 4: Persist
    this.productRepository.save(product);
    // => Delegates to internal method
    // => Save to repository

    return productId; // => Return identifier
  }

  private validateRequest(request: CreateProductRequest): void {
    // => Internal logic (not part of public API)
    // => Input validation rules (Application layer concern)
    const errors: string[] = [];
    // => Create data structure

    if (!request.name || request.name.trim().length === 0) {
      // => Conditional check
      errors.push("Name is required");
      // => Execute method
    }
    if (request.name && request.name.length > 100) {
      errors.push("Name cannot exceed 100 characters");
      // => Execute method
    }

    if (request.price === null || request.price === undefined) {
      errors.push("Price is required");
      // => Execute method
    }
    if (request.price !== null && request.price <= 0) {
      errors.push("Price must be positive");
      // => Execute method
    }

    if (!request.category || request.category.trim().length === 0) {
      // => Conditional check
      errors.push("Category is required");
      // => Execute method
    }

    if (errors.length > 0) {
      // => Validation failed
      throw new Error(`Validation failed: ${errors.join(", ")}`);
      // => Raise domain exception
    }
    // => Validation passed
  }
}

// Infrastructure
class InMemoryProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();
  // => Encapsulated field (not publicly accessible)

  save(product: Product): void {
    this.products.set(product.getProductId(), product);
    // => Delegates to internal method
    console.log(`Product saved: ${product.getProductId()}`);
    // => Outputs result
  }
  // => Communicates domain intent
}

// Usage - Application Service validates input
const productRepo = new InMemoryProductRepository();
// => Store value in productRepo
const createProductService = new CreateProductApplicationService(productRepo);
// => Store value in createProductService

// Valid request
const validRequest: CreateProductRequest = {
  // => Create data structure
  name: "Laptop",
  // => Modifies aggregate internal state
  price: 1200,
  // => Validates business rule
  category: "Electronics",
  // => Enforces invariant
};
const productId = createProductService.createProduct(validRequest);
// => Output: Product saved: PROD-[timestamp]
console.log(`Created product: ${productId}`);
// => Outputs result

// Invalid request - caught by validation
try {
  const invalidRequest: CreateProductRequest = {
    // => Communicates domain intent
    name: null, // => Invalid: name required
    price: -100, // => Invalid: price must be positive
    category: "",
    // => Aggregate boundary enforced here
  };
  createProductService.createProduct(invalidRequest);
  // => Execute method
} catch (error) {
  // => Cross-context interaction point
  console.log(`Validation error: ${error.message}`);
  // => Outputs result
  // => Output: Validation error: Validation failed: Name is required, Price must be positive, Category is required
}
```

**Key Takeaway**: Application Services validate external input before invoking domain logic. This separates infrastructure concerns (parsing, type coercion, null checks) from domain concerns (business rules). Domain objects can assume inputs are valid, making domain code cleaner and more focused on business logic.

**Why It Matters**: Input validation at Application Service layer prevents defensive programming in domain layer. A payment platform's Charge domain entity doesn't check for null amounts or negative values—that's validated in CreateChargeApplicationService before reaching domain. This separation enables reusing Charge entity across REST API, GraphQL API, and internal admin tools, each with different input formats but same domain rules. Application Services adapt external inputs to domain requirements, keeping domain pure.

### Example 46: Application Service - Cross-Aggregate Transactions

Coordinating multiple aggregates within a transaction while respecting aggregate boundaries.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant AS as Application Service
    participant OA as Order Aggregate
    participant IA as Inventory Aggregate
    participant DB as Database

    AS->>OA: place(items)
    OA-->>AS: OrderPlaced event
    AS->>IA: reserve(items)
    IA-->>AS: InventoryReserved event
    AS->>DB: commit transaction
    DB-->>AS: success
```

```typescript
// Aggregate 1 - Customer
class Customer {
  private constructor(
    // => Initialize object with parameters
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private loyaltyPoints: number,
    // => Encapsulated field (not publicly accessible)
  ) {}

  static create(customerId: string, initialPoints: number): Customer {
    return new Customer(customerId, initialPoints);
    // => Return result to caller
  }

  addLoyaltyPoints(points: number): void {
    // => Domain logic: earn loyalty points
    if (points < 0) {
      throw new Error("Points must be positive");
      // => Raise domain exception
    }
    // => Validates business rule
    this.loyaltyPoints += points;
    // => Modifies loyaltyPoints
    // => State change operation
    // => Modifies state value
    // => Points added
  }
  // => Enforces invariant

  getCustomerId(): string {
    return this.customerId;
    // => Return result to caller
  }

  getLoyaltyPoints(): number {
    return this.loyaltyPoints;
    // => Return result to caller
  }
}

// Aggregate 2 - Order
class Order {
  private constructor(
    // => Initialize object with parameters
    private readonly orderId: string,
    // => Encapsulated state, not directly accessible
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private readonly totalAmount: number,
    // => Encapsulated state, not directly accessible
    private status: OrderStatus = "PENDING",
    // => Encapsulated field (not publicly accessible)
  ) {}

  static create(orderId: string, customerId: string, totalAmount: number): Order {
    if (totalAmount <= 0) {
      throw new Error("Total amount must be positive");
      // => Raise domain exception
    }
    return new Order(orderId, customerId, totalAmount);
    // => Return result to caller
  }

  confirm(): void {
    // => Domain logic: confirm order
    if (this.status !== "PENDING") {
      throw new Error("Order already processed");
      // => Raise domain exception
    }
    this.status = "CONFIRMED";
    // => Order confirmed
  }

  getTotalAmount(): number {
    return this.totalAmount;
    // => Return result to caller
  }

  getCustomerId(): string {
    return this.customerId;
    // => Return result to caller
  }

  getOrderId(): string {
    return this.orderId;
    // => Return result to caller
  }
  // => Communicates domain intent
}

type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED";
// => Modifies aggregate internal state

interface CustomerRepository {
  // => CustomerRepository: contract definition
  findById(customerId: string): Customer | null;
  save(customer: Customer): void;
}
// => Validates business rule

interface OrderRepository {
  // => OrderRepository: contract definition
  save(order: Order): void;
}
// => Enforces invariant

// Application Service - coordinates multiple aggregates
class PlaceOrderWithLoyaltyService {
  constructor(
    // => Initialize object with parameters
    private readonly customerRepo: CustomerRepository,
    // => Encapsulated state, not directly accessible
    private readonly orderRepo: OrderRepository,
    // => Encapsulated state, not directly accessible
  ) {}

  placeOrder(customerId: string, totalAmount: number): string {
    // => Use case: place order and award loyalty points
    // Step 1: Create order aggregate
    const orderId = `ORDER-${Date.now()}`;
    // => Store value in orderId
    const order = Order.create(orderId, customerId, totalAmount);
    // => Order aggregate created

    // Step 2: Confirm order (within Order aggregate)
    order.confirm();
    // => Order confirmed

    // Step 3: Calculate loyalty points (business rule)
    const loyaltyPoints = Math.floor(totalAmount / 100);
    // => 1 point per $100 spent

    // Step 4: Load Customer aggregate
    const customer = this.customerRepo.findById(customerId);
    // => Store value in customer
    if (!customer) {
      throw new Error("Customer not found");
      // => Raise domain exception
    }

    // Step 5: Award points (within Customer aggregate)
    customer.addLoyaltyPoints(loyaltyPoints);
    // => Points added to customer

    // Step 6: Persist both aggregates (transaction boundary)
    this.orderRepo.save(order);
    // => Delegates to internal method
    // => Save order
    this.customerRepo.save(customer);
    // => Delegates to internal method
    // => Save customer
    // => Both aggregates updated atomically

    return orderId;
  }
}

// Infrastructure
class InMemoryCustomerRepository implements CustomerRepository {
  private customers: Map<string, Customer> = new Map();
  // => Encapsulated field (not publicly accessible)

  findById(customerId: string): Customer | null {
    return this.customers.get(customerId) || null;
    // => Return result to caller
  }

  save(customer: Customer): void {
    this.customers.set(customer.getCustomerId(), customer);
    // => Delegates to internal method
  }
}

class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  // => Encapsulated field (not publicly accessible)

  save(order: Order): void {
    this.orders.set(order.getOrderId(), order);
    // => Delegates to internal method
  }
}

// Usage - Application Service coordinates multiple aggregates
const customerRepo = new InMemoryCustomerRepository();
// => Store value in customerRepo
const orderRepo = new InMemoryOrderRepository();
// => Store value in orderRepo

const customer = Customer.create("C123", 100);
// => customer: loyaltyPoints=100
customerRepo.save(customer);
// => Execute method

const placeOrderService = new PlaceOrderWithLoyaltyService(customerRepo, orderRepo);
// => Application Service coordinates Order and Customer
const orderId = placeOrderService.placeOrder("C123", 5000);
// => Creates Order, awards 50 loyalty points to Customer

console.log(`Order placed: ${orderId}`);
// => Outputs result
console.log(`Customer loyalty points: ${customer.getLoyaltyPoints()}`);
// => Outputs result
// => Output: Customer loyalty points: 150
```

**Key Takeaway**: Application Services coordinate multiple aggregates within a single transaction, respecting aggregate boundaries. Each aggregate enforces its own invariants; Application Service manages the transaction scope ensuring all changes commit together or roll back together.

**Why It Matters**: Cross-aggregate transactions are unavoidable in real systems, but must be used carefully. An e-commerce platform's OrderPlacement service updates Order, Customer, and Inventory aggregates atomically—preventing oversold inventory or lost loyalty points. However, cross-aggregate transactions reduce scalability (locks on multiple aggregates) and should be minimized. Eventual consistency (domain events + separate transactions) is preferred for loosely coupled aggregates, but immediate consistency via Application Service transactions is necessary when business invariants span aggregates.

### Example 47: Application Service - Error Handling and Compensation

Application Services handle failure scenarios gracefully, implementing compensation logic when partial operations fail.

```typescript
// Domain entities
class Reservation {
  constructor(
    // => Initialize object with parameters
    private readonly reservationId: string,
    // => Encapsulated state, not directly accessible
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private status: ReservationStatus = "ACTIVE",
    // => Encapsulated field (not publicly accessible)
  ) {}

  cancel(): void {
    if (this.status !== "ACTIVE") {
      throw new Error("Reservation already cancelled");
      // => Raise domain exception
    }
    this.status = "CANCELLED";
    // => Update status state
  }
  // => Validates business rule

  getReservationId(): string {
    return this.reservationId;
    // => Return result to caller
  }
  // => Enforces invariant

  getCustomerId(): string {
    return this.customerId;
    // => Return result to caller
  }
}

type ReservationStatus = "ACTIVE" | "CANCELLED";
// => Aggregate boundary enforced here

class PaymentRecord {
  constructor(
    // => Initialize object with parameters
    private readonly paymentId: string,
    // => Encapsulated state, not directly accessible
    private readonly amount: number,
    // => Encapsulated state, not directly accessible
    private refunded: boolean = false,
    // => Encapsulated field (not publicly accessible)
  ) {}

  refund(): void {
    if (this.refunded) {
      throw new Error("Already refunded");
      // => Raise domain exception
    }
    this.refunded = true;
    // => Update refunded state
  }

  getPaymentId(): string {
    return this.paymentId;
    // => Return result to caller
  }

  isRefunded(): boolean {
    return this.refunded;
    // => Return result to caller
  }
}

// Repositories
interface ReservationRepository {
  // => ReservationRepository: contract definition
  findById(reservationId: string): Reservation | null;
  save(reservation: Reservation): void;
}

interface PaymentRepository {
  // => PaymentRepository: contract definition
  findByReservation(reservationId: string): PaymentRecord | null;
  save(payment: PaymentRecord): void;
}
// => Communicates domain intent

// External service that may fail
interface NotificationService {
  // => NotificationService: contract definition
  sendCancellationEmail(customerId: string): void;
}

class UnreliableNotificationService implements NotificationService {
  private shouldFail: boolean = false;
  // => Encapsulated field (not publicly accessible)

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
    // => Update shouldFail state
  }

  sendCancellationEmail(customerId: string): void {
    if (this.shouldFail) {
      throw new Error("Email service unavailable");
      // => Raise domain exception
    }
    // => Validates business rule
    console.log(`Cancellation email sent to ${customerId}`);
    // => Outputs result
  }
  // => Enforces invariant
}

// Application Service with error handling and compensation
class CancelReservationService {
  constructor(
    // => Initialize object with parameters
    private readonly reservationRepo: ReservationRepository,
    // => Encapsulated state, not directly accessible
    private readonly paymentRepo: PaymentRepository,
    // => Encapsulated state, not directly accessible
    private readonly notificationService: NotificationService,
    // => Encapsulated state, not directly accessible
  ) {}

  cancelReservation(reservationId: string): void {
    let reservation: Reservation | null = null;
    // => Aggregate boundary enforced here
    let payment: PaymentRecord | null = null;
    // => Domain event triggered or handled

    try {
      // Step 1: Load reservation
      reservation = this.reservationRepo.findById(reservationId);
      // => DDD tactical pattern applied
      if (!reservation) {
        throw new Error("Reservation not found");
        // => Raise domain exception
      }

      // Step 2: Cancel reservation
      reservation.cancel();
      // => Execute method
      this.reservationRepo.save(reservation);
      // => Delegates to internal method
      // => Reservation cancelled and saved

      // Step 3: Process refund
      payment = this.paymentRepo.findByReservation(reservationId);
      // => Transaction boundary maintained
      if (payment) {
        payment.refund();
        // => Execute method
        this.paymentRepo.save(payment);
        // => Delegates to internal method
        // => Refund processed and saved
      }

      // Step 4: Send notification (may fail)
      this.notificationService.sendCancellationEmail(reservation.getCustomerId());
      // => Delegates to internal method
      // => Email sent successfully
    } catch (error) {
      // => Domain model consistency maintained
      // Error occurred - implement compensation logic
      console.log(`Error during cancellation: ${error.message}`);
      // => Outputs result

      // Compensation: If email failed but cancellation succeeded, log for retry
      if (reservation && reservation.getReservationId()) {
        // => Conditional check
        console.log(`Reservation ${reservationId} cancelled but notification failed - queued for retry`);
        // => Outputs result
        // => In production: add to dead letter queue for retry
      }
      // => Communicates domain intent

      // Re-throw if critical steps failed
      if (!reservation || error.message === "Reservation not found") {
        // => Guard: early return when entity not found
        throw error; // => Critical failure, propagate to caller
      }

      // Non-critical failure (email) - log but don't fail operation
      console.log("Cancellation completed despite notification failure");
      // => Outputs result
    }
  }
  // => Validates business rule
}
// => Enforces invariant

// Infrastructure
class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Map<string, Reservation> = new Map();
  // => Encapsulated field (not publicly accessible)

  findById(reservationId: string): Reservation | null {
    return this.reservations.get(reservationId) || null;
    // => Return result to caller
  }

  save(reservation: Reservation): void {
    this.reservations.set(reservation.getReservationId(), reservation);
    // => Delegates to internal method
  }
}

class InMemoryPaymentRepository implements PaymentRepository {
  private payments: Map<string, PaymentRecord> = new Map();
  // => Encapsulated field (not publicly accessible)

  findByReservation(reservationId: string): PaymentRecord | null {
    return this.payments.get(reservationId) || null;
    // => Return result to caller
  }

  save(payment: PaymentRecord): void {
    this.payments.set(payment.getPaymentId(), payment);
    // => Delegates to internal method
  }
}

// Usage - Application Service handles errors gracefully
const reservationRepo = new InMemoryReservationRepository();
// => Store value in reservationRepo
const paymentRepo = new InMemoryPaymentRepository();
// => Store value in paymentRepo
const notificationService = new UnreliableNotificationService();
// => Store value in notificationService

const reservation = new Reservation("R123", "C456");
// => Store value in reservation
reservationRepo.save(reservation);
// => Execute method

const payment = new PaymentRecord("PAY-789", 10000);
// => Store value in payment
paymentRepo.save(payment);
// => Execute method
paymentRepo["payments"].set("R123", payment); // Link payment to reservation
// => Execute method

const cancelService = new CancelReservationService(reservationRepo, paymentRepo, notificationService);
// => Store value in cancelService

// Scenario 1: Successful cancellation
cancelService.cancelReservation("R123");
// => Output: Cancellation email sent to C456

// Scenario 2: Email service fails - compensation logic handles it
const reservation2 = new Reservation("R456", "C789");
// => Store value in reservation2
reservationRepo.save(reservation2);
// => Execute method
notificationService.setShouldFail(true);
// => Execute method

cancelService.cancelReservation("R456");
// => Output: Error during cancellation: Email service unavailable
// => Output: Reservation R456 cancelled but notification failed - queued for retry
// => Output: Cancellation completed despite notification failure
```

**Key Takeaway**: Application Services implement error handling and compensation logic for multi-step use cases. Critical operations (cancel reservation, process refund) must succeed; non-critical operations (send email) can fail gracefully with compensation (retry queue). This ensures business operations complete even when infrastructure fails.

**Why It Matters**: Real systems face partial failures. When CancelBooking services fail to send email after successful cancellation, the Application Service logs the failure to a retry queue rather than rolling back the cancellation. Guests get refunded even if email servers are down; emails retry asynchronously. This separation of critical domain operations from infrastructure failures improves reliability—booking cancellations succeed even when email service experiences downtime.

## Domain Event Handlers (Examples 48-52)

### Example 48: Basic Domain Event Handler

Domain Event Handlers react to domain events, implementing eventual consistency and decoupled workflows.

```typescript
// Domain Event
class OrderPlacedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly occurredAt: Date,
  ) {}
}

// Event Handler Interface
interface DomainEventHandler<T> {
  // => DomainEventHandler: contract definition
  handle(event: T): void;
}
// => Validates business rule

// Event Handler - Send Order Confirmation Email
class SendOrderConfirmationEmailHandler implements DomainEventHandler<OrderPlacedEvent> {
  constructor(private readonly emailService: EmailService) {}
  // => Initialize object with parameters

  handle(event: OrderPlacedEvent): void {
    // => React to OrderPlaced event
    console.log(`Handling OrderPlacedEvent for ${event.orderId}`);
    // => Outputs result

    this.emailService.sendEmail(
      // => Enforces invariant
      event.customerId,
      // => Business rule enforced here
      "Order Confirmation",
      // => Execution delegated to domain service
      `Your order ${event.orderId} has been placed. Total: $${event.totalAmount / 100}`,
      // => Aggregate boundary enforced here
    );
    // => Send confirmation email
  }
}

// Event Handler - Update Loyalty Points
class AwardLoyaltyPointsHandler implements DomainEventHandler<OrderPlacedEvent> {
  constructor(
    // => Initialize object with parameters
    private readonly customerRepo: CustomerRepository,
    // => Encapsulated state, not directly accessible
    private readonly pointsCalculator: LoyaltyPointsCalculator,
    // => Encapsulated state, not directly accessible
  ) {}

  handle(event: OrderPlacedEvent): void {
    // => React to OrderPlaced event
    console.log(`Awarding loyalty points for order ${event.orderId}`);
    // => Outputs result

    const customer = this.customerRepo.findById(event.customerId);
    // => Store value in customer
    if (!customer) {
      console.log("Customer not found - skipping loyalty points");
      // => Outputs result
      return;
      // => Invariant validation executed
    }

    const points = this.pointsCalculator.calculate(event.totalAmount);
    // => Store value in points
    customer.addLoyaltyPoints(points);
    // => Execute method
    this.customerRepo.save(customer);
    // => Delegates to internal method
    // => Loyalty points awarded

    console.log(`Awarded ${points} points to ${event.customerId}`);
    // => Outputs result
  }
}

// Supporting classes
interface EmailService {
  // => EmailService: contract definition
  sendEmail(recipient: string, subject: string, body: string): void;
}
// => Communicates domain intent

class MockEmailService implements EmailService {
  sendEmail(recipient: string, subject: string, body: string): void {
    console.log(`Email sent to ${recipient}: ${subject}`);
    // => Outputs result
  }
}

interface CustomerRepository {
  // => CustomerRepository: contract definition
  findById(customerId: string): Customer | null;
  save(customer: Customer): void;
}
// => Validates business rule

class Customer {
  constructor(
    // => Initialize object with parameters
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private loyaltyPoints: number,
    // => Encapsulated field (not publicly accessible)
  ) {}
  // => Enforces invariant

  addLoyaltyPoints(points: number): void {
    this.loyaltyPoints += points;
    // => Modifies loyaltyPoints
    // => State change operation
    // => Modifies state value
  }

  getCustomerId(): string {
    return this.customerId;
    // => Return result to caller
  }

  getLoyaltyPoints(): number {
    return this.loyaltyPoints;
    // => Return result to caller
  }
}

class InMemoryCustomerRepository implements CustomerRepository {
  private customers: Map<string, Customer> = new Map();
  // => Encapsulated field (not publicly accessible)

  findById(customerId: string): Customer | null {
    return this.customers.get(customerId) || null;
    // => Return result to caller
  }

  save(customer: Customer): void {
    this.customers.set(customer.getCustomerId(), customer);
    // => Delegates to internal method
  }
}

class LoyaltyPointsCalculator {
  calculate(amount: number): number {
    return Math.floor(amount / 100); // 1 point per $100
  }
}

// Event Dispatcher - coordinates handlers
class EventDispatcher {
  private handlers: Map<string, DomainEventHandler<any>[]> = new Map();
  // => Encapsulated field (not publicly accessible)

  register<T>(eventType: string, handler: DomainEventHandler<T>): void {
    // => Method body begins here
    if (!this.handlers.has(eventType)) {
      // => Conditional check
      this.handlers.set(eventType, []);
      // => Delegates to internal method
    }
    // => Communicates domain intent
    this.handlers.get(eventType)!.push(handler);
    // => Delegates to internal method
    // => Handler registered for event type
  }

  dispatch<T>(eventType: string, event: T): void {
    // => Method body begins here
    const handlers = this.handlers.get(eventType) || [];
    // => Store value in handlers
    handlers.forEach((handler) => handler.handle(event));
    // => Dispatch event to all registered handlers
  }
  // => Validates business rule
}
// => Enforces invariant

// Usage - Multiple handlers react to single event
const customerRepo = new InMemoryCustomerRepository();
// => Store value in customerRepo
const customer = new Customer("C123", 0);
// => Store value in customer
customerRepo.save(customer);
// => Execute method

const emailService = new MockEmailService();
// => Store value in emailService
const pointsCalculator = new LoyaltyPointsCalculator();
// => Store value in pointsCalculator

const dispatcher = new EventDispatcher();
// => Store value in dispatcher

// Register handlers
dispatcher.register("OrderPlaced", new SendOrderConfirmationEmailHandler(emailService));
// => Execute method
dispatcher.register("OrderPlaced", new AwardLoyaltyPointsHandler(customerRepo, pointsCalculator));
// => Two handlers registered for OrderPlaced event

// Publish event
const event = new OrderPlacedEvent("O456", "C123", 15000, new Date());
// => Store value in event
dispatcher.dispatch("OrderPlaced", event);
// => Output: Handling OrderPlacedEvent for O456
// => Output: Email sent to C123: Order Confirmation
// => Output: Awarding loyalty points for order O456
// => Output: Awarded 150 points to C123

console.log(`Customer points: ${customer.getLoyaltyPoints()}`);
// => Outputs result
// => Output: Customer points: 150
```

**Key Takeaway**: Domain Event Handlers enable decoupled reactions to business events. Multiple handlers can subscribe to the same event, each implementing independent workflows (email, loyalty, analytics). This achieves eventual consistency without tight coupling between domain operations.

**Why It Matters**: Event Handlers prevent tightly coupled workflows. When an e-commerce platform's OrderPlaced event fires, multiple independent handlers react: send confirmation email, update inventory, trigger fulfillment, award loyalty points, log analytics, notify warehouse, update recommendations, etc. Adding new reactions requires zero changes to Order domain—just register new handler. This extensibility enables adding new features (gift wrapping, carbon offset, fraud scoring) by adding handlers, not modifying core Order logic.

### Example 49: Idempotent Event Handlers

Ensuring event handlers can safely process the same event multiple times without side effects.

```typescript
// Domain Event with unique identifier
class PaymentProcessedEvent {
  constructor(
    // => Constructor: initializes object with provided parameters
    public readonly eventId: string, // => Unique event identifier for deduplication
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly occurredAt: Date,
  ) {}
}

// Event Processing Record - tracks processed events
class ProcessedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly eventId: string,
    public readonly processedAt: Date,
  ) {}
  // => Validates business rule
}
// => Enforces invariant

interface ProcessedEventRepository {
  // => ProcessedEventRepository: contract definition
  hasBeenProcessed(eventId: string): boolean;
  markAsProcessed(eventId: string): void;
}

class InMemoryProcessedEventRepository implements ProcessedEventRepository {
  private processedEvents: Set<string> = new Set();
  // => Encapsulated field (not publicly accessible)

  hasBeenProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
    // => Check if event already processed
  }

  markAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
    // => Delegates to internal method
    // => Record event as processed
  }
}

// Idempotent Event Handler
class UpdateAccountingLedgerHandler implements DomainEventHandler<PaymentProcessedEvent> {
  constructor(
    // => Initialize object with parameters
    private readonly processedEventRepo: ProcessedEventRepository,
    // => Encapsulated state, not directly accessible
    private readonly ledgerService: AccountingLedgerService,
    // => Encapsulated state, not directly accessible
  ) {}

  handle(event: PaymentProcessedEvent): void {
    // => Idempotent event handling
    console.log(`Processing PaymentProcessedEvent ${event.eventId}`);
    // => Outputs result

    // Check if already processed
    if (this.processedEventRepo.hasBeenProcessed(event.eventId)) {
      // => Conditional check
      console.log(`Event ${event.eventId} already processed - skipping`);
      // => Outputs result
      return; // => Skip duplicate processing
    }

    // Process event (first time)
    this.ledgerService.recordTransaction(event.paymentId, event.amount);
    // => Delegates to internal method
    // => Update accounting ledger

    // Mark as processed
    this.processedEventRepo.markAsProcessed(event.eventId);
    // => Delegates to internal method
    // => Record event ID to prevent reprocessing

    console.log(`Event ${event.eventId} processed successfully`);
    // => Outputs result
  }
}

interface AccountingLedgerService {
  // => AccountingLedgerService: contract definition
  recordTransaction(paymentId: string, amount: number): void;
}

class MockAccountingLedgerService implements AccountingLedgerService {
  private transactions: Array<{ paymentId: string; amount: number }> = [];
  // => Encapsulated field (not publicly accessible)

  recordTransaction(paymentId: string, amount: number): void {
    this.transactions.push({ paymentId, amount });
    // => Delegates to internal method
    console.log(`Ledger updated: ${paymentId} - $${amount / 100}`);
    // => Outputs result
  }

  getTransactionCount(): number {
    return this.transactions.length;
    // => Return result to caller
  }
  // => Communicates domain intent
}

interface DomainEventHandler<T> {
  // => DomainEventHandler: contract definition
  handle(event: T): void;
}

// Usage - Idempotent handler prevents duplicate processing
const processedEventRepo = new InMemoryProcessedEventRepository();
// => Store value in processedEventRepo
const ledgerService = new MockAccountingLedgerService();
// => Store value in ledgerService
const handler = new UpdateAccountingLedgerHandler(processedEventRepo, ledgerService);
// => Store value in handler

const event = new PaymentProcessedEvent(
  // => event: value assigned for use in this scope
  "EVT-001", // => Unique event ID
  "PAY-123",
  // => Validates business rule
  10000,
  // => Enforces invariant
  new Date(),
  // => Business rule enforced here
);
// => Execution delegated to domain service

// Process event first time
handler.handle(event);
// => Output: Processing PaymentProcessedEvent EVT-001
// => Output: Ledger updated: PAY-123 - $100
// => Output: Event EVT-001 processed successfully

// Process same event again (duplicate delivery)
handler.handle(event);
// => Output: Processing PaymentProcessedEvent EVT-001
// => Output: Event EVT-001 already processed - skipping

console.log(`Total transactions recorded: ${ledgerService.getTransactionCount()}`);
// => Outputs result
// => Output: Total transactions recorded: 1 (not 2!)
```

**Key Takeaway**: Idempotent event handlers track processed event IDs to prevent duplicate processing. Distributed systems often deliver events multiple times; idempotency ensures handlers produce same result regardless of delivery count. Check processed event registry before executing business logic.

**Why It Matters**: Event delivery guarantees are "at least once" not "exactly once." Kafka, RabbitMQ, and AWS SQS can deliver events multiple times during network partitions. A payment platform's RefundProcessed handler tracks processed event IDs—if message broker re-delivers refund event, handler skips duplicate processing, preventing double refunds. Idempotency is critical for financial operations where duplicate processing causes monetary loss.

### Example 50: Saga Pattern with Event Handlers

Coordinating long-running business processes across multiple aggregates using events.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant O as Order Aggregate
    participant S as Saga
    participant P as Payment Aggregate
    participant I as Inventory Aggregate
    participant Ship as Shipping Aggregate

    O->>S: OrderPlaced event
    S->>P: processPayment()
    P->>S: PaymentCompleted event
    S->>I: reserveItems()
    I->>S: ItemsReserved event
    S->>Ship: scheduleShipment()
    Ship->>S: ShipmentScheduled event
```

```typescript
// Saga Coordinator - orchestrates multi-step process
class OrderFulfillmentSaga {
  constructor(
    // => Initialize object with parameters
    private readonly sagaRepo: SagaStateRepository,
    // => Encapsulated state, not directly accessible
    private readonly inventoryService: InventoryService,
    // => Encapsulated state, not directly accessible
    private readonly shippingService: ShippingService,
    // => Encapsulated state, not directly accessible
  ) {}

  onOrderPlaced(event: OrderPlacedEvent): void {
    // => Saga step 1: Order placed
    console.log(`Saga started for order ${event.orderId}`);
    // => Outputs result

    // Initialize saga state
    const sagaState = new SagaState(event.orderId, "STARTED");
    // => Store value in sagaState
    this.sagaRepo.save(sagaState);
    // => Delegates to internal method

    // Step 1: Reserve inventory
    try {
      this.inventoryService.reserve(event.orderId, event.items);
      // => Delegates to internal method
      sagaState.markInventoryReserved();
      // => Execute method
      this.sagaRepo.save(sagaState);
      // => Delegates to internal method
      console.log(`Inventory reserved for ${event.orderId}`);
      // => Outputs result
    } catch (error) {
      // => Validates business rule
      // Compensation: Saga failed at inventory step
      sagaState.markFailed();
      // => Execute method
      this.sagaRepo.save(sagaState);
      // => Delegates to internal method
      console.log(`Saga failed: ${error.message}`);
      // => Outputs result
      return;
      // => Enforces invariant
    }
  }

  onInventoryReserved(event: InventoryReservedEvent): void {
    // => Saga step 2: Inventory reserved
    const sagaState = this.sagaRepo.findByOrderId(event.orderId);
    // => Store value in sagaState
    if (!sagaState || sagaState.getStatus() !== "INVENTORY_RESERVED") {
      // => Conditional check
      console.log("Saga state invalid - skipping");
      // => Outputs result
      return;
      // => Aggregate boundary enforced here
    }

    // Step 2: Create shipment
    try {
      this.shippingService.createShipment(event.orderId);
      // => Delegates to internal method
      sagaState.markShipmentCreated();
      // => Execute method
      this.sagaRepo.save(sagaState);
      // => Delegates to internal method
      console.log(`Shipment created for ${event.orderId}`);
      // => Outputs result
    } catch (error) {
      // => DDD tactical pattern applied
      // Compensation: Rollback inventory reservation
      this.inventoryService.release(event.orderId);
      // => Delegates to internal method
      sagaState.markFailed();
      // => Execute method
      this.sagaRepo.save(sagaState);
      // => Delegates to internal method
      console.log(`Saga compensated: released inventory`);
      // => Outputs result
    }
  }

  onShipmentCreated(event: ShipmentCreatedEvent): void {
    // => Saga step 3: Shipment created (final step)
    const sagaState = this.sagaRepo.findByOrderId(event.orderId);
    // => Store value in sagaState
    if (!sagaState) {
      return;
      // => Entity state transition managed
    }

    sagaState.markCompleted();
    // => Execute method
    this.sagaRepo.save(sagaState);
    // => Delegates to internal method
    console.log(`Saga completed for ${event.orderId}`);
    // => Outputs result
  }
  // => Communicates domain intent
}

// Supporting classes
class OrderPlacedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly orderId: string,
    public readonly items: string[],
  ) {}
}
// => Validates business rule

class InventoryReservedEvent {
  constructor(public readonly orderId: string) {}
  // => Initialize object with parameters
}
// => Enforces invariant

class ShipmentCreatedEvent {
  constructor(public readonly orderId: string) {}
  // => Initialize object with parameters
}

class SagaState {
  constructor(
    // => Initialize object with parameters
    private readonly orderId: string,
    // => Encapsulated state, not directly accessible
    private status: SagaStatus,
    // => Encapsulated field (not publicly accessible)
  ) {}

  markInventoryReserved(): void {
    this.status = "INVENTORY_RESERVED";
    // => Update status state
  }

  markShipmentCreated(): void {
    this.status = "SHIPMENT_CREATED";
    // => Update status state
  }

  markCompleted(): void {
    this.status = "COMPLETED";
    // => Update status state
  }

  markFailed(): void {
    this.status = "FAILED";
    // => Update status state
  }

  getStatus(): SagaStatus {
    return this.status;
    // => Return result to caller
  }

  getOrderId(): string {
    return this.orderId;
    // => Return result to caller
  }
}

type SagaStatus = "STARTED" | "INVENTORY_RESERVED" | "SHIPMENT_CREATED" | "COMPLETED" | "FAILED";
// => Domain model consistency maintained

interface SagaStateRepository {
  // => SagaStateRepository: contract definition
  findByOrderId(orderId: string): SagaState | null;
  save(state: SagaState): void;
}
// => Communicates domain intent

class InMemorySagaStateRepository implements SagaStateRepository {
  private states: Map<string, SagaState> = new Map();
  // => Encapsulated field (not publicly accessible)

  findByOrderId(orderId: string): SagaState | null {
    return this.states.get(orderId) || null;
    // => Return result to caller
  }

  save(state: SagaState): void {
    this.states.set(state.getOrderId(), state);
    // => Delegates to internal method
  }
}
// => Validates business rule

interface InventoryService {
  // => InventoryService: contract definition
  reserve(orderId: string, items: string[]): void;
  release(orderId: string): void;
}
// => Enforces invariant

class MockInventoryService implements InventoryService {
  reserve(orderId: string, items: string[]): void {
    console.log(`Inventory reserved: ${items.join(", ")}`);
    // => Outputs result
  }

  release(orderId: string): void {
    console.log(`Inventory released for ${orderId}`);
    // => Outputs result
  }
}

interface ShippingService {
  // => ShippingService: contract definition
  createShipment(orderId: string): void;
}

class MockShippingService implements ShippingService {
  createShipment(orderId: string): void {
    console.log(`Shipment created for ${orderId}`);
    // => Outputs result
  }
}

// Usage - Saga coordinates multi-step process
const sagaRepo = new InMemorySagaStateRepository();
// => Store value in sagaRepo
const inventoryService = new MockInventoryService();
// => Store value in inventoryService
const shippingService = new MockShippingService();
// => Store value in shippingService

const saga = new OrderFulfillmentSaga(sagaRepo, inventoryService, shippingService);
// => Store value in saga

// Step 1: Order placed
const orderPlaced = new OrderPlacedEvent("O123", ["P1", "P2"]);
// => Store value in orderPlaced
saga.onOrderPlaced(orderPlaced);
// => Output: Saga started for order O123
// => Output: Inventory reserved: P1, P2
// => Output: Inventory reserved for O123

// Step 2: Inventory reserved
const inventoryReserved = new InventoryReservedEvent("O123");
// => Store value in inventoryReserved
saga.onInventoryReserved(inventoryReserved);
// => Output: Shipment created for O123
// => Output: Shipment created for O123

// Step 3: Shipment created
const shipmentCreated = new ShipmentCreatedEvent("O123");
// => Store value in shipmentCreated
saga.onShipmentCreated(shipmentCreated);
// => Output: Saga completed for O123
```

**Key Takeaway**: Saga pattern coordinates long-running processes across multiple aggregates using event-driven choreography. Each step publishes events; saga coordinator reacts by executing next step or compensating on failure. Saga state tracks progress and enables recovery.

**Why It Matters**: Sagas enable distributed transactions without distributed locks. RideCompletion sagas coordinate multiple steps: mark trip complete → process payment → update driver earnings → send receipt → award ratings. If payment fails, saga compensates by unmarking trip complete and releasing inventory. This achieves consistency across microservices without 2-phase commit, enabling horizontal scaling while maintaining business process integrity.

### Example 51: Event Sourcing with Event Handlers

Rebuilding aggregate state from domain events.

```typescript
// Domain Events
class AccountCreatedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly accountId: string,
    public readonly initialBalance: number,
    public readonly occurredAt: Date,
  ) {}
}

class MoneyDepositedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly accountId: string,
    public readonly amount: number,
    public readonly occurredAt: Date,
  ) {}
  // => Validates business rule
}
// => Enforces invariant

class MoneyWithdrawnEvent {
  constructor(
    // => Initialize object with parameters
    public readonly accountId: string,
    public readonly amount: number,
    public readonly occurredAt: Date,
  ) {}
}

type AccountEvent = AccountCreatedEvent | MoneyDepositedEvent | MoneyWithdrawnEvent;
// => Aggregate boundary enforced here

// Event-Sourced Aggregate
class EventSourcedBankAccount {
  private accountId: string = "";
  // => Encapsulated field (not publicly accessible)
  private balance: number = 0;
  // => Encapsulated field (not publicly accessible)
  private version: number = 0;
  // => Encapsulated field (not publicly accessible)

  // Apply events to rebuild state
  applyEvent(event: AccountEvent): void {
    if (event instanceof AccountCreatedEvent) {
      this.accountId = event.accountId;
      // => Update accountId state
      this.balance = event.initialBalance;
      // => Update balance state
    } else if (event instanceof MoneyDepositedEvent) {
      // => Domain event triggered or handled
      this.balance += event.amount;
      // => State change operation
      // => Modifies state value
      // => Balance updated
    } else if (event instanceof MoneyWithdrawnEvent) {
      // => Cross-context interaction point
      this.balance -= event.amount;
      // => State change operation
      // => Modifies state value
      // => Balance updated
    }
    this.version++;
    // => State updated from event
  }

  // Rebuild from event history
  static fromEvents(events: AccountEvent[]): EventSourcedBankAccount {
    const account = new EventSourcedBankAccount();
    // => Store value in account
    events.forEach((event) => account.applyEvent(event));
    // => forEach: process collection elements
    return account;
    // => Account state reconstructed from events
  }

  getBalance(): number {
    return this.balance;
    // => Return result to caller
  }

  getVersion(): number {
    return this.version;
    // => Return result to caller
  }

  getAccountId(): string {
    return this.accountId;
    // => Return result to caller
  }
  // => Communicates domain intent
}

// Event Store
interface EventStore {
  // => EventStore: contract definition
  getEvents(accountId: string): AccountEvent[];
  appendEvent(event: AccountEvent): void;
}

class InMemoryEventStore implements EventStore {
  private events: Map<string, AccountEvent[]> = new Map();
  // => Encapsulated field (not publicly accessible)

  getEvents(accountId: string): AccountEvent[] {
    return this.events.get(accountId) || [];
    // => Return result to caller
  }
  // => Validates business rule

  appendEvent(event: AccountEvent): void {
    const accountId = event.accountId;
    // => Store value in accountId
    if (!this.events.has(accountId)) {
      // => Conditional check
      this.events.set(accountId, []);
      // => Delegates to internal method
    }
    // => Enforces invariant
    this.events.get(accountId)!.push(event);
    // => Delegates to internal method
    console.log(`Event stored: ${event.constructor.name}`);
    // => Outputs result
  }
}

// Event Handler - Projection builder
class AccountBalanceProjectionHandler {
  private projections: Map<string, number> = new Map();
  // => Encapsulated field (not publicly accessible)

  handle(event: AccountEvent): void {
    // => Build read model from events
    const accountId = event.accountId;
    // => Store value in accountId
    let balance = this.projections.get(accountId) || 0;
    // => Store value in balance

    if (event instanceof AccountCreatedEvent) {
      balance = event.initialBalance;
      // => Aggregate boundary enforced here
    } else if (event instanceof MoneyDepositedEvent) {
      // => Domain event triggered or handled
      balance += event.amount;
      // => State change operation
      // => Modifies state value
      // => Balance updated
    } else if (event instanceof MoneyWithdrawnEvent) {
      // => Cross-context interaction point
      balance -= event.amount;
      // => State change operation
      // => Modifies state value
      // => Balance updated
    }

    this.projections.set(accountId, balance);
    // => Delegates to internal method
    console.log(`Projection updated: ${accountId} -> $${balance}`);
    // => Outputs result
  }

  getBalance(accountId: string): number {
    return this.projections.get(accountId) || 0;
    // => Return result to caller
  }
}

// Usage - Event Sourcing pattern
const eventStore = new InMemoryEventStore();
// => Store value in eventStore
const projectionHandler = new AccountBalanceProjectionHandler();
// => Store value in projectionHandler

// Create account
const created = new AccountCreatedEvent("ACC-001", 1000, new Date());
// => Store value in created
eventStore.appendEvent(created);
// => Execute method
projectionHandler.handle(created);
// => Output: Event stored: AccountCreatedEvent
// => Output: Projection updated: ACC-001 -> $1000

// Deposit money
const deposited = new MoneyDepositedEvent("ACC-001", 500, new Date());
// => Store value in deposited
eventStore.appendEvent(deposited);
// => Execute method
projectionHandler.handle(deposited);
// => Output: Event stored: MoneyDepositedEvent
// => Output: Projection updated: ACC-001 -> $1500

// Withdraw money
const withdrawn = new MoneyWithdrawnEvent("ACC-001", 300, new Date());
// => Store value in withdrawn
eventStore.appendEvent(withdrawn);
// => Execute method
projectionHandler.handle(withdrawn);
// => Output: Event stored: MoneyWithdrawnEvent
// => Output: Projection updated: ACC-001 -> $1200

// Rebuild aggregate from events
const events = eventStore.getEvents("ACC-001");
// => Store value in events
const account = EventSourcedBankAccount.fromEvents(events);
// => Store value in account
console.log(`Rebuilt account balance: $${account.getBalance()}, version: ${account.getVersion()}`);
// => Outputs result
// => Output: Rebuilt account balance: $1200, version: 3
```

**Key Takeaway**: Event Sourcing stores domain events as source of truth, rebuilding aggregate state by replaying events. Event Handlers build projections (read models) from event streams, enabling multiple views of same data. Every state change is captured as event, providing complete audit trail.

**Why It Matters**: Event Sourcing enables time travel and audit compliance. Banks use Event Sourcing for account ledgers—every deposit, withdrawal, and fee is an immutable event. Regulators can audit exact account state at any point in history by replaying events to that timestamp. GitLab uses Event Sourcing for project timelines, enabling "rewind" to any project state. Trade-off: complexity (managing event schemas, rebuilding projections) vs. benefits (audit trail, temporal queries, event-driven architecture).

### Example 52: Event Handler Error Handling and Dead Letter Queue

Handling failures in event processing gracefully.

```typescript
// Domain Event
class OrderShippedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly eventId: string,
    public readonly orderId: string,
    public readonly trackingNumber: string,
    public readonly occurredAt: Date,
  ) {}
}

// Dead Letter Queue - stores failed events for retry
interface DeadLetterQueue {
  // => DeadLetterQueue: contract definition
  addFailedEvent(event: any, error: Error, attemptCount: number): void;
  getFailedEvents(): Array<{ event: any; error: Error; attemptCount: number }>;
}

class InMemoryDeadLetterQueue implements DeadLetterQueue {
  private failedEvents: Array<{ event: any; error: Error; attemptCount: number }> = [];
  // => Encapsulated field (not publicly accessible)

  addFailedEvent(event: any, error: Error, attemptCount: number): void {
    this.failedEvents.push({ event, error, attemptCount });
    // => Delegates to internal method
    console.log(`Event ${event.eventId} added to DLQ after ${attemptCount} attempts`);
    // => Outputs result
  }

  getFailedEvents(): Array<{ event: any; error: Error; attemptCount: number }> {
    return this.failedEvents;
    // => Return result to caller
  }
}

// Event Handler with retry logic
class SendTrackingEmailHandler {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  // => Encapsulated state, not directly accessible

  constructor(
    // => Initialize object with parameters
    private readonly emailService: EmailService,
    // => Encapsulated state, not directly accessible
    private readonly deadLetterQueue: DeadLetterQueue,
    // => Encapsulated state, not directly accessible
  ) {}

  handle(event: OrderShippedEvent, attemptCount: number = 1): void {
    // => Handle event with retry logic
    console.log(`Processing OrderShippedEvent ${event.eventId}, attempt ${attemptCount}`);
    // => Outputs result

    try {
      // Attempt to send email
      this.emailService.sendTrackingEmail(event.orderId, event.trackingNumber);
      // => Delegates to internal method
      console.log(`Tracking email sent for ${event.orderId}`);
      // => Outputs result
      // => Success
    } catch (error) {
      // => Failure occurred
      console.log(`Error sending email: ${error.message}`);
      // => Outputs result

      if (attemptCount < this.MAX_RETRY_ATTEMPTS) {
        // Retry
        console.log(`Retrying... (${attemptCount + 1}/${this.MAX_RETRY_ATTEMPTS})`);
        // => Delegates to internal method
        // => Outputs result
        this.handle(event, attemptCount + 1);
        // => Delegates to internal method
        // => Recursive retry
      } else {
        // Max retries exceeded - move to DLQ
        this.deadLetterQueue.addFailedEvent(event, error, attemptCount);
        // => Delegates to internal method
        console.log(`Max retries exceeded - event moved to DLQ`);
        // => Outputs result
        // => Failed permanently, requires manual intervention
      }
    }
  }
}

interface EmailService {
  // => EmailService: contract definition
  sendTrackingEmail(orderId: string, trackingNumber: string): void;
}

class UnreliableEmailService implements EmailService {
  private attemptCount: number = 0;
  // => Encapsulated field (not publicly accessible)
  private readonly failUntilAttempt: number;
  // => Encapsulated state, not directly accessible

  constructor(failUntilAttempt: number) {
    // => Initialize object with parameters
    this.failUntilAttempt = failUntilAttempt;
    // => Update failUntilAttempt state
  }

  sendTrackingEmail(orderId: string, trackingNumber: string): void {
    this.attemptCount++;
    if (this.attemptCount < this.failUntilAttempt) {
      throw new Error("Email service temporarily unavailable");
      // => Raise domain exception
    }
    // Success on Nth attempt
    console.log(`Email service: Tracking email sent for ${orderId}`);
    // => Outputs result
  }

  reset(): void {
    this.attemptCount = 0;
    // => Update attemptCount state
  }
}

// Usage - Event handler with retry and DLQ
const dlq = new InMemoryDeadLetterQueue();
// => Store value in dlq

// Scenario 1: Success after retry
console.log("=== Scenario 1: Success after retry ===");
// => Outputs result
const emailService1 = new UnreliableEmailService(2); // Fails once, succeeds on attempt 2
// => Store value in emailService1
const handler1 = new SendTrackingEmailHandler(emailService1, dlq);
// => Store value in handler1

const event1 = new OrderShippedEvent("EVT-001", "O123", "TRK-456", new Date());
// => Store value in event1
handler1.handle(event1);
// => Output: Processing OrderShippedEvent EVT-001, attempt 1
// => Output: Error sending email: Email service temporarily unavailable
// => Output: Retrying... (2/3)
// => Output: Processing OrderShippedEvent EVT-001, attempt 2
// => Output: Email service: Tracking email sent for O123
// => Output: Tracking email sent for O123

// Scenario 2: Max retries exceeded - DLQ
console.log("\n=== Scenario 2: Max retries exceeded ===");
// => Outputs result
const emailService2 = new UnreliableEmailService(10); // Always fails
// => Store value in emailService2
const handler2 = new SendTrackingEmailHandler(emailService2, dlq);
// => Store value in handler2

const event2 = new OrderShippedEvent("EVT-002", "O456", "TRK-789", new Date());
// => Store value in event2
handler2.handle(event2);
// => Output: Processing OrderShippedEvent EVT-002, attempt 1
// => Output: Error sending email: Email service temporarily unavailable
// => Output: Retrying... (2/3)
// => Output: Processing OrderShippedEvent EVT-002, attempt 2
// => Output: Error sending email: Email service temporarily unavailable
// => Output: Retrying... (3/3)
// => Output: Processing OrderShippedEvent EVT-002, attempt 3
// => Output: Error sending email: Email service temporarily unavailable
// => Output: Event EVT-002 added to DLQ after 3 attempts
// => Output: Max retries exceeded - event moved to DLQ

console.log(`\nDead Letter Queue size: ${dlq.getFailedEvents().length}`);
// => Outputs result
// => Output: Dead Letter Queue size: 1
```

**Key Takeaway**: Event Handlers implement retry logic for transient failures and Dead Letter Queue for permanent failures. Retry with exponential backoff handles temporary issues (network glitch, service restart); DLQ captures events that fail repeatedly, requiring manual investigation or reprocessing.

**Why It Matters**: Distributed systems face transient failures frequently. Event handlers retry failed events multiple times before moving to DLQ. Event handlers use exponential backoff (increasing delays) to avoid overwhelming recovering services. DLQ enables operations teams to investigate failures (bad data, service bugs) and reprocess events after fixes. Without retry + DLQ, events are lost permanently, causing data inconsistencies.

## Advanced Factories (Examples 53-55)

### Example 53: Factory with Complex Validation

Factories encapsulating complex validation and construction logic for aggregates.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Factory\ncreate(params)"]
    B["Validate inputs"]
    C["Construct Aggregate\nall invariants satisfied"]
    D["Return valid Aggregate"]
    E["Throw error\nif invalid"]

    A --> B
    B -->|valid| C
    B -->|invalid| E
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#CC78BC,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
```

```typescript
// Value Objects
class EmailAddress {
  private constructor(private readonly value: string) {}
  // => Initialize object with parameters

  static create(email: string): EmailAddress {
    // => Value object factory with validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // => Store value in emailRegex
    if (!emailRegex.test(email)) {
      // => Conditional check
      throw new Error("Invalid email format");
      // => Raise domain exception
    }
    return new EmailAddress(email);
    // => Return result to caller
  }

  getValue(): string {
    return this.value;
    // => Return result to caller
  }
  // => Validates business rule
}
// => Enforces invariant

class PhoneNumber {
  private constructor(private readonly value: string) {}
  // => Initialize object with parameters

  static create(phone: string): PhoneNumber {
    // => Value object factory with validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    // => Store value in phoneRegex
    if (!phoneRegex.test(phone)) {
      // => Conditional check
      throw new Error("Invalid phone format (use E.164)");
      // => Raise domain exception
    }
    return new PhoneNumber(phone);
    // => Return result to caller
  }

  getValue(): string {
    return this.value;
    // => Return result to caller
  }
}

// Aggregate
class Customer {
  private constructor(
    // => Initialize object with parameters
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private readonly name: string,
    // => Encapsulated state, not directly accessible
    private readonly email: EmailAddress,
    // => Encapsulated state, not directly accessible
    private readonly phone: PhoneNumber,
    // => Encapsulated state, not directly accessible
    private readonly creditLimit: number,
    // => Encapsulated state, not directly accessible
    private readonly accountStatus: AccountStatus,
    // => Encapsulated state, not directly accessible
  ) {}

  // Factory method with complex validation
  static create(name: string, email: string, phone: string, requestedCreditLimit: number): Customer {
    // => Factory encapsulates complex creation logic

    // Validation 1: Name requirements
    if (!name || name.trim().length < 2) {
      // => Conditional check
      throw new Error("Name must be at least 2 characters");
      // => Raise domain exception
    }
    if (name.length > 100) {
      throw new Error("Name cannot exceed 100 characters");
      // => Raise domain exception
    }

    // Validation 2: Email (delegated to value object)
    const emailVO = EmailAddress.create(email);
    // => Throws if invalid

    // Validation 3: Phone (delegated to value object)
    const phoneVO = PhoneNumber.create(phone);
    // => Throws if invalid

    // Business Rule: Credit limit determination
    let creditLimit: number;
    // => Transaction boundary maintained
    if (requestedCreditLimit <= 0) {
      throw new Error("Credit limit must be positive");
      // => Raise domain exception
    } else if (requestedCreditLimit <= 5000) {
      // => Entity state transition managed
      creditLimit = requestedCreditLimit; // => Auto-approve small limits
    } else if (requestedCreditLimit <= 50000) {
      // => Communicates domain intent
      creditLimit = 5000; // => Cap at 5000 for manual review
    } else {
      throw new Error("Credit limit exceeds maximum (50000)");
      // => Raise domain exception
    }

    // Business Rule: Initial account status
    const accountStatus: AccountStatus = creditLimit > 1000 ? "ACTIVE" : "PENDING_APPROVAL";
    // => Accounts with >$1000 credit auto-approved

    const customerId = `CUST-${Date.now()}`;
    // => Store value in customerId
    return new Customer(customerId, name, emailVO, phoneVO, creditLimit, accountStatus);
    // => Return result to caller
  }
  // => Communicates domain intent

  getCustomerId(): string {
    return this.customerId;
    // => Return result to caller
  }

  getCreditLimit(): number {
    return this.creditLimit;
    // => Return result to caller
  }

  getAccountStatus(): AccountStatus {
    return this.accountStatus;
    // => Return result to caller
  }
  // => Validates business rule

  getEmail(): string {
    return this.email.getValue();
    // => Return result to caller
  }
  // => Enforces invariant
}

type AccountStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
// => Execution delegated to domain service

// Usage - Factory with complex validation
try {
  const customer = Customer.create("Alice Johnson", "alice@example.com", "+14155552671", 10000);
  // => Store value in customer
  console.log(`Customer created: ${customer.getCustomerId()}`);
  // => Outputs result
  console.log(`Credit limit: $${customer.getCreditLimit()}`);
  // => Outputs result
  console.log(`Status: ${customer.getAccountStatus()}`);
  // => Outputs result
  // => Output: Customer created: CUST-[timestamp]
  // => Output: Credit limit: $5000 (capped for manual review)
  // => Output: Status: ACTIVE
} catch (error) {
  // => Domain event triggered or handled
  console.log(`Creation failed: ${error.message}`);
  // => Outputs result
}

// Invalid inputs caught by factory
try {
  Customer.create("A", "invalid-email", "123", -1000);
  // => Execute method
} catch (error) {
  // => Invariant validation executed
  console.log(`Validation error: ${error.message}`);
  // => Outputs result
  // => Output: Validation error: Name must be at least 2 characters
}
```

**Key Takeaway**: Factories encapsulate complex validation and business rules for aggregate creation, ensuring only valid aggregates enter the system. Validation logic centralized in factory method prevents duplicating rules across application layer.

**Why It Matters**: Factories enforce invariants at creation time. A payment platform's Customer factory validates email, payment method, and compliance requirements before creating Customer aggregate—preventing invalid customers in system. This "fail fast" approach catches errors immediately rather than discovering invalid state later. Factories reduce Application Service complexity by handling validation internally, making services thin orchestration layers.

### Example 54: Factory for Reconstituting Aggregates from Persistence

Separating creation logic (business rules) from reconstitution logic (loading from database).

```typescript
// Aggregate
class Order {
  private constructor(
    // => Initialize object with parameters
    private readonly orderId: string,
    // => Encapsulated state, not directly accessible
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private readonly items: OrderItem[],
    // => Encapsulated state, not directly accessible
    private status: OrderStatus,
    // => Encapsulated field (not publicly accessible)
    private readonly createdAt: Date,
    // => Encapsulated state, not directly accessible
  ) {}

  // Factory for NEW orders (enforces business rules)
  static create(customerId: string, items: OrderItem[]): Order {
    // => Creation factory with validation
    if (!customerId || customerId.trim().length === 0) {
      // => Conditional check
      throw new Error("Customer ID required");
      // => Raise domain exception
    }
    if (items.length === 0) {
      throw new Error("Order must have at least one item");
      // => Raise domain exception
    }
    // => Validates business rule

    const orderId = `ORD-${Date.now()}`;
    // => Store value in orderId
    const status: OrderStatus = "PENDING";
    // => Enforces invariant
    const createdAt = new Date();
    // => Store value in createdAt

    return new Order(orderId, customerId, items, status, createdAt);
    // => New order created with initial state
  }

  // Factory for EXISTING orders (reconstitution from database)
  static reconstitute(
    // => Execution delegated to domain service
    orderId: string,
    // => Aggregate boundary enforced here
    customerId: string,
    // => Domain event triggered or handled
    items: OrderItem[],
    // => Cross-context interaction point
    status: OrderStatus,
    // => DDD tactical pattern applied
    createdAt: Date,
    // => Invariant validation executed
  ): Order {
    // => Reconstitution factory - NO validation
    // Assumes data from database is already valid
    return new Order(orderId, customerId, items, status, createdAt);
    // => Order rebuilt from persisted state
  }

  confirm(): void {
    if (this.status !== "PENDING") {
      throw new Error("Order already processed");
      // => Raise domain exception
    }
    this.status = "CONFIRMED";
    // => Update status state
  }

  getOrderId(): string {
    return this.orderId;
    // => Return result to caller
  }
  // => Communicates domain intent

  getStatus(): OrderStatus {
    return this.status;
    // => Return result to caller
  }

  getCreatedAt(): Date {
    return this.createdAt;
    // => Return result to caller
  }
}
// => Validates business rule

class OrderItem {
  constructor(
    // => Initialize object with parameters
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
  ) {}
  // => Enforces invariant
}

type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED";
// => Execution delegated to domain service

// Repository uses reconstitute factory
interface OrderRepository {
  // => OrderRepository: contract definition
  save(order: Order): void;
  findById(orderId: string): Order | null;
}

class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<
    // => Encapsulated field (not publicly accessible)
    string,
    // => Domain event triggered or handled
    { id: string; customerId: string; items: OrderItem[]; status: OrderStatus; createdAt: Date }
    // => Cross-context interaction point
  > = new Map();
  // => Create Map instance

  save(order: Order): void {
    // Persist order (simplified)
    this.orders.set(order.getOrderId(), {
      // => Delegates to internal method
      id: order.getOrderId(),
      // => Execute method
      customerId: "C123", // Simplified
      // => DDD tactical pattern applied
      items: [],
      // => Invariant validation executed
      status: order.getStatus(),
      // => Execute method
      createdAt: order.getCreatedAt(),
      // => Execute method
    });
  }

  findById(orderId: string): Order | null {
    const data = this.orders.get(orderId);
    // => Store value in data
    if (!data) {
      return null;
    }

    // Use reconstitute factory to rebuild aggregate
    return Order.reconstitute(data.id, data.customerId, data.items, data.status, data.createdAt);
    // => Order rebuilt from persisted data
  }
  // => Communicates domain intent
}

// Usage - Different factories for creation vs reconstitution
const repository = new InMemoryOrderRepository();
// => Store value in repository

// Scenario 1: Create new order (validation enforced)
const items = [new OrderItem("P1", 2, 5000)];
// => Store value in items
const newOrder = Order.create("C123", items);
// => Store value in newOrder
console.log(`New order created: ${newOrder.getOrderId()}, status: ${newOrder.getStatus()}`);
// => Outputs result
// => Output: New order created: ORD-[timestamp], status: PENDING

newOrder.confirm();
// => Execute method
repository.save(newOrder);
// => Execute method

// Scenario 2: Load existing order (no validation)
const loadedOrder = repository.findById(newOrder.getOrderId());
// => Store value in loadedOrder
if (loadedOrder) {
  console.log(`Loaded order: ${loadedOrder.getOrderId()}, status: ${loadedOrder.getStatus()}`);
  // => Outputs result
  // => Output: Loaded order: ORD-[timestamp], status: CONFIRMED
}
```

**Key Takeaway**: Separate factory methods for creation (validate business rules) vs reconstitution (load from database). Creation factories enforce invariants; reconstitution factories trust persisted data. This prevents unnecessary validation on every database load while ensuring new aggregates are valid.

**Why It Matters**: Performance and correctness trade-off. Re-validating aggregates on every database load wastes CPU cycles—data in database already validated during creation. However, creation must validate to prevent invalid state from entering system. Domain-Driven Design in Practice (Vladimir Khorikov) recommends separate factories for these concerns, improving performance while maintaining data integrity.

### Example 55: Abstract Factory for Polymorphic Aggregate Creation

Using Abstract Factory pattern to create different aggregate types based on business rules.

```typescript
// Abstract base
abstract class DiscountPolicy {
  abstract calculate(orderAmount: number): number;
  // => Domain operation executes here
  abstract getType(): string;
  // => Modifies aggregate internal state
}
// => Validates business rule

// Concrete implementations
class PercentageDiscountPolicy extends DiscountPolicy {
  constructor(private readonly percentage: number) {
    // => Initialize object with parameters
    super();
    // => Enforces invariant
  }

  calculate(orderAmount: number): number {
    return Math.floor(orderAmount * (this.percentage / 100));
    // => Calculate percentage discount
  }

  getType(): string {
    return `${this.percentage}% Discount`;
  }
}

class FixedAmountDiscountPolicy extends DiscountPolicy {
  constructor(private readonly fixedAmount: number) {
    // => Initialize object with parameters
    super();
    // => Cross-context interaction point
  }

  calculate(orderAmount: number): number {
    return Math.min(this.fixedAmount, orderAmount);
    // => Fixed amount, capped at order amount
  }

  getType(): string {
    return `$${this.fixedAmount / 100} Discount`;
  }
}

class NoDiscountPolicy extends DiscountPolicy {
  calculate(orderAmount: number): number {
    return 0; // => No discount
  }

  getType(): string {
    return "No Discount";
  }
  // => Communicates domain intent
}

// Abstract Factory
class DiscountPolicyFactory {
  static create(customerType: string, orderAmount: number, loyaltyPoints: number): DiscountPolicy {
    // => Factory logic based on business rules
    if (customerType === "VIP") {
      // VIP customers get 20% discount
      return new PercentageDiscountPolicy(20);
      // => Return result to caller
    } else if (customerType === "REGULAR" && loyaltyPoints > 1000) {
      // => Create data structure
      // Loyal regular customers get 10% discount
      return new PercentageDiscountPolicy(10);
      // => Return result to caller
    } else if (orderAmount > 50000) {
      // => Modifies aggregate internal state
      // Large orders get $50 discount
      return new FixedAmountDiscountPolicy(5000); // $50
      // => Return result to caller
    } else {
      // => Validates business rule
      // Default: no discount
      return new NoDiscountPolicy();
      // => Return result to caller
    }
    // => Enforces invariant
  }
}

// Usage - Abstract Factory creates polymorphic objects
const vipPolicy = DiscountPolicyFactory.create("VIP", 10000, 500);
// => Store value in vipPolicy
console.log(`${vipPolicy.getType()}: $${vipPolicy.calculate(10000) / 100}`);
// => Outputs result
// => Output: 20% Discount: $20

const regularLoyalPolicy = DiscountPolicyFactory.create("REGULAR", 10000, 1500);
// => Store value in regularLoyalPolicy
console.log(`${regularLoyalPolicy.getType()}: $${regularLoyalPolicy.calculate(10000) / 100}`);
// => Outputs result
// => Output: 10% Discount: $10

const largeOrderPolicy = DiscountPolicyFactory.create("REGULAR", 60000, 0);
// => Store value in largeOrderPolicy
console.log(`${largeOrderPolicy.getType()}: $${largeOrderPolicy.calculate(60000) / 100}`);
// => Outputs result
// => Output: $50 Discount: $50

const noDiscountPolicy = DiscountPolicyFactory.create("REGULAR", 5000, 0);
// => Store value in noDiscountPolicy
console.log(`${noDiscountPolicy.getType()}: $${noDiscountPolicy.calculate(5000) / 100}`);
// => Outputs result
// => Output: No Discount: $0
```

**Key Takeaway**: Abstract Factory creates polymorphic aggregates based on business rules, encapsulating complex selection logic. Client code receives interface/base class, unaware of concrete implementation. This enables Strategy pattern with centralized creation logic.

**Why It Matters**: Abstract Factories prevent conditional logic sprawl. A ride-sharing platform's PricingStrategyFactory creates different pricing algorithms (surge pricing, flat rate, time-based) based on city, time, and demand. Without factory, every pricing call would need complex if-else chains to select algorithm. Factory centralizes selection logic, and client code (trip calculation) works with PricingStrategy interface regardless of concrete implementation. This enables A/B testing new pricing algorithms by modifying factory logic, not client code.

## Specifications Pattern (Examples 56-58)

### Example 56: Basic Specification for Business Rules

Encapsulating business rules as reusable, composable objects.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["SpecificationA\nisSatisfiedBy()"]
    B["SpecificationB\nisSatisfiedBy()"]
    C["A.and(B)\nComposite Spec"]
    D["A.or(B)\nComposite Spec"]
    E["A.not()\nNegated Spec"]

    A -->|combines| C
    B -->|combines| C
    A -->|combines| D
    B -->|combines| D
    A -->|negates| E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

```typescript
// Specification interface
interface Specification<T> {
  // => Specification: contract definition
  isSatisfiedBy(candidate: T): boolean;
}

// Domain entity
class Product {
  constructor(
    // => Initialize object with parameters
    private readonly productId: string,
    // => Encapsulated state, not directly accessible
    private readonly name: string,
    // => Encapsulated state, not directly accessible
    private readonly price: number,
    // => Encapsulated state, not directly accessible
    private readonly category: string,
    // => Encapsulated state, not directly accessible
    private readonly inStock: boolean,
    // => Encapsulated state, not directly accessible
  ) {}

  getPrice(): number {
    return this.price;
    // => Return result to caller
  }
  // => Validates business rule

  getCategory(): string {
    return this.category;
    // => Return result to caller
  }
  // => Enforces invariant

  isInStock(): boolean {
    return this.inStock;
    // => Return result to caller
  }

  getName(): string {
    return this.name;
    // => Return result to caller
  }
}

// Concrete specifications
class PriceRangeSpecification implements Specification<Product> {
  constructor(
    // => Initialize object with parameters
    private readonly minPrice: number,
    // => Encapsulated state, not directly accessible
    private readonly maxPrice: number,
    // => Encapsulated state, not directly accessible
  ) {}

  isSatisfiedBy(product: Product): boolean {
    const price = product.getPrice();
    // => Store value in price
    return price >= this.minPrice && price <= this.maxPrice;
    // => Check if product price in range
  }
}

class CategorySpecification implements Specification<Product> {
  constructor(private readonly category: string) {}
  // => Initialize object with parameters

  isSatisfiedBy(product: Product): boolean {
    return product.getCategory() === this.category;
    // => Check if product matches category
  }
}

class InStockSpecification implements Specification<Product> {
  isSatisfiedBy(product: Product): boolean {
    return product.isInStock();
    // => Check if product in stock
  }
}

// Composite specifications (AND, OR, NOT)
class AndSpecification<T> implements Specification<T> {
  constructor(
    // => Initialize object with parameters
    private readonly left: Specification<T>,
    // => Encapsulated state, not directly accessible
    private readonly right: Specification<T>,
    // => Encapsulated state, not directly accessible
  ) {}
  // => Communicates domain intent

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
    // => Both specifications must be satisfied
  }
}

class OrSpecification<T> implements Specification<T> {
  constructor(
    // => Initialize object with parameters
    private readonly left: Specification<T>,
    // => Encapsulated state, not directly accessible
    private readonly right: Specification<T>,
    // => Encapsulated state, not directly accessible
  ) {}
  // => Validates business rule

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
    // => Either specification satisfied
  }
  // => Enforces invariant
}

class NotSpecification<T> implements Specification<T> {
  constructor(private readonly spec: Specification<T>) {}
  // => Initialize object with parameters

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
    // => Negates specification
  }
}

// Usage - Composable business rules
const products = [
  // => Store value in products
  new Product("P1", "Laptop", 120000, "Electronics", true),
  // => Domain event triggered or handled
  new Product("P2", "Book", 2000, "Books", true),
  // => Cross-context interaction point
  new Product("P3", "Phone", 80000, "Electronics", false),
  // => DDD tactical pattern applied
  new Product("P4", "Desk", 50000, "Furniture", true),
  // => Invariant validation executed
];
// => Transaction boundary maintained

// Specification: Electronics in stock, price $500-$1500
const electronicsSpec = new CategorySpecification("Electronics");
// => Store value in electronicsSpec
const inStockSpec = new InStockSpecification();
// => Store value in inStockSpec
const priceSpec = new PriceRangeSpecification(50000, 150000);
// => Store value in priceSpec

const combinedSpec = new AndSpecification(electronicsSpec, new AndSpecification(inStockSpec, priceSpec));
// => Complex specification composed from simple ones

const matchingProducts = products.filter((p) => combinedSpec.isSatisfiedBy(p));
// => Store value in matchingProducts
matchingProducts.forEach((p) => {
  // => forEach: process collection elements
  console.log(`Match: ${p.getName()} - $${p.getPrice() / 100}`);
  // => Outputs result
});
// => Output: Match: Laptop - $1200
```

**Key Takeaway**: Specification pattern encapsulates business rules as objects that can be combined using AND, OR, NOT operators. This enables reusable, testable, composable business logic separate from domain entities and repositories.

**Why It Matters**: Specifications prevent business rule duplication. E-commerce search filters (price range, category, in-stock) become reusable Specification objects rather than SQL WHERE clauses scattered across repositories. Major e-commerce platforms use Specifications for product eligibility rules (can ship to certain countries, eligible for promotions, available for gift wrapping)—same rules apply in search, checkout, and recommendations without duplicating logic. Specifications are unit-testable in isolation, improving code quality.

### Example 57: Specification for Repository Queries

Using Specifications to encapsulate complex query logic in repositories.

```typescript
// Specification interface
interface Specification<T> {
  // => Specification: contract definition
  isSatisfiedBy(candidate: T): boolean;
  toSQLWhereClause?(): string; // Optional: for database queries
  // => Domain operation executes here
}

// Customer entity
class Customer {
  constructor(
    // => Initialize object with parameters
    private readonly customerId: string,
    // => Encapsulated state, not directly accessible
    private readonly name: string,
    // => Encapsulated state, not directly accessible
    private readonly totalSpent: number,
    // => Encapsulated state, not directly accessible
    private readonly loyaltyTier: string,
    // => Encapsulated state, not directly accessible
  ) {}
  // => Validates business rule

  getTotalSpent(): number {
    return this.totalSpent;
    // => Return result to caller
  }
  // => Enforces invariant

  getLoyaltyTier(): string {
    return this.loyaltyTier;
    // => Return result to caller
  }

  getCustomerId(): string {
    return this.customerId;
    // => Return result to caller
  }

  getName(): string {
    return this.name;
    // => Return result to caller
  }
}

// Specifications
class HighValueCustomerSpecification implements Specification<Customer> {
  // => Immutable value type (no identity)
  private readonly HIGH_VALUE_THRESHOLD = 100000; // $1000
  // => Encapsulated state, not directly accessible

  isSatisfiedBy(customer: Customer): boolean {
    return customer.getTotalSpent() >= this.HIGH_VALUE_THRESHOLD;
  }

  toSQLWhereClause(): string {
    return `total_spent >= ${this.HIGH_VALUE_THRESHOLD}`;
    // => Converts to SQL for repository query
  }
}

class PremiumTierSpecification implements Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    return customer.getLoyaltyTier() === "PREMIUM";
  }

  toSQLWhereClause(): string {
    return `loyalty_tier = 'PREMIUM'`;
  }
}

// Composite specification with SQL generation
class AndSpecificationWithSQL<T> implements Specification<T> {
  constructor(
    // => Initialize object with parameters
    private readonly left: Specification<T>,
    // => Encapsulated state, not directly accessible
    private readonly right: Specification<T>,
    // => Encapsulated state, not directly accessible
  ) {}
  // => Communicates domain intent

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
    // => Return result to caller
  }

  toSQLWhereClause(): string {
    const leftSQL = this.left.toSQLWhereClause?.() || "";
    // => Store value in leftSQL
    const rightSQL = this.right.toSQLWhereClause?.() || "";
    // => Store value in rightSQL
    return `(${leftSQL} AND ${rightSQL})`;
    // => Combines SQL clauses with AND
  }
}
// => Validates business rule

// Repository using specifications
class CustomerRepository {
  private customers: Customer[] = [];
  // => Encapsulated field (not publicly accessible)

  constructor() {
    // => Initialize object with parameters
    // Seed data
    this.customers = [
      // => Update customers state
      new Customer("C1", "Alice", 150000, "PREMIUM"),
      // => Enforces invariant
      new Customer("C2", "Bob", 50000, "REGULAR"),
      // => Business rule enforced here
      new Customer("C3", "Carol", 200000, "PREMIUM"),
      // => Execution delegated to domain service
      new Customer("C4", "Dave", 30000, "REGULAR"),
      // => Aggregate boundary enforced here
    ];
    // => Domain event triggered or handled
  }

  findBySpecification(spec: Specification<Customer>): Customer[] {
    // In-memory filtering (use spec.toSQLWhereClause() for real database)
    return this.customers.filter((c) => spec.isSatisfiedBy(c));
    // => Repository delegates filtering to specification
  }

  // Simulate SQL query generation
  generateSQLQuery(spec: Specification<Customer>): string {
    const whereClause = spec.toSQLWhereClause?.() || "1=1";
    // => Store value in whereClause
    return `SELECT * FROM customers WHERE ${whereClause}`;
    // => Specification generates SQL WHERE clause
  }
}

// Usage - Repository queries with specifications
const repository = new CustomerRepository();
// => Store value in repository

// Find high-value premium customers
const highValueSpec = new HighValueCustomerSpecification();
// => Store value in highValueSpec
const premiumSpec = new PremiumTierSpecification();
// => Store value in premiumSpec
const combinedSpec = new AndSpecificationWithSQL(highValueSpec, premiumSpec);
// => Store value in combinedSpec

const customers = repository.findBySpecification(combinedSpec);
// => Store value in customers
customers.forEach((c) => {
  // => forEach: process collection elements
  console.log(`Customer: ${c.getName()}, Spent: $${c.getTotalSpent() / 100}, Tier: ${c.getLoyaltyTier()}`);
  // => Outputs result
});
// => Output: Customer: Alice, Spent: $1500, Tier: PREMIUM
// => Output: Customer: Carol, Spent: $2000, Tier: PREMIUM

// Generate SQL query
const sqlQuery = repository.generateSQLQuery(combinedSpec);
// => Store value in sqlQuery
console.log(`Generated SQL: ${sqlQuery}`);
// => Outputs result
// => Output: Generated SQL: SELECT * FROM customers WHERE (total_spent >= 100000 AND loyalty_tier = 'PREMIUM')
```

**Key Takeaway**: Specifications can encapsulate both in-memory filtering logic and database query generation. Repository methods accept Specification parameters, delegating query construction to business-rule objects. This keeps repositories thin and business rules explicit.

**Why It Matters**: Specifications with SQL generation enable query optimization while maintaining business rule centralization. Professional networking platforms use Specifications that generate optimized SQL—preventing N+1 queries while keeping business logic (e.g., "active connections over threshold") in domain layer, not SQL strings. This separation enables testing business rules without databases and migrating between SQL/NoSQL without rewriting business logic.

### Example 58: Specification for Validation

Using Specifications to validate complex business rules during aggregate state changes.

```typescript
// Specification for validation
interface ValidationSpecification<T> {
  // => ValidationSpecification: contract definition
  isSatisfiedBy(candidate: T): boolean;
  getErrorMessage(): string;
}

// Loan application entity
class LoanApplication {
  private constructor(
    // => Initialize object with parameters
    private readonly applicationId: string,
    // => Encapsulated state, not directly accessible
    private readonly applicantIncome: number,
    // => Encapsulated state, not directly accessible
    private readonly requestedAmount: number,
    // => Encapsulated state, not directly accessible
    private readonly creditScore: number,
    // => Encapsulated state, not directly accessible
    private status: LoanStatus = "PENDING",
    // => Encapsulated field (not publicly accessible)
  ) {}

  static create(applicantIncome: number, requestedAmount: number, creditScore: number): LoanApplication {
    const applicationId = `LOAN-${Date.now()}`;
    // => Store value in applicationId
    return new LoanApplication(applicationId, applicantIncome, requestedAmount, creditScore);
    // => Return result to caller
  }
  // => Validates business rule

  approve(validationSpec: ValidationSpecification<LoanApplication>): void {
    // => Validate using specification before approval
    if (!validationSpec.isSatisfiedBy(this)) {
      // => Conditional check
      throw new Error(`Cannot approve: ${validationSpec.getErrorMessage()}`);
      // => Raise domain exception
    }
    // => Enforces invariant
    this.status = "APPROVED";
    // => Loan approved
  }

  getApplicantIncome(): number {
    return this.applicantIncome;
    // => Return result to caller
  }

  getRequestedAmount(): number {
    return this.requestedAmount;
    // => Return result to caller
  }

  getCreditScore(): number {
    return this.creditScore;
    // => Return result to caller
  }

  getStatus(): LoanStatus {
    return this.status;
    // => Return result to caller
  }

  getApplicationId(): string {
    return this.applicationId;
    // => Return result to caller
  }
}

type LoanStatus = "PENDING" | "APPROVED" | "REJECTED";
// => Transaction boundary maintained

// Validation specifications
class MinimumIncomeSpecification implements ValidationSpecification<LoanApplication> {
  private readonly MINIMUM_INCOME = 30000; // $300/month
  // => Encapsulated state, not directly accessible

  isSatisfiedBy(application: LoanApplication): boolean {
    return application.getApplicantIncome() >= this.MINIMUM_INCOME;
  }

  getErrorMessage(): string {
    return `Applicant income must be at least $${this.MINIMUM_INCOME / 100}`;
  }
}
// => Communicates domain intent

class DebtToIncomeRatioSpecification implements ValidationSpecification<LoanApplication> {
  private readonly MAX_DEBT_TO_INCOME_RATIO = 0.43; // 43%
  // => Encapsulated state, not directly accessible

  isSatisfiedBy(application: LoanApplication): boolean {
    const ratio = application.getRequestedAmount() / application.getApplicantIncome();
    // => Store value in ratio
    return ratio <= this.MAX_DEBT_TO_INCOME_RATIO;
    // => Check debt-to-income ratio
  }

  getErrorMessage(): string {
    return `Debt-to-income ratio exceeds maximum (${this.MAX_DEBT_TO_INCOME_RATIO * 100}%)`;
  }
}
// => Validates business rule

class MinimumCreditScoreSpecification implements ValidationSpecification<LoanApplication> {
  private readonly MINIMUM_CREDIT_SCORE = 650;
  // => Encapsulated state, not directly accessible

  isSatisfiedBy(application: LoanApplication): boolean {
    return application.getCreditScore() >= this.MINIMUM_CREDIT_SCORE;
  }
  // => Enforces invariant

  getErrorMessage(): string {
    return `Credit score must be at least ${this.MINIMUM_CREDIT_SCORE}`;
  }
}

// Composite validation specification
class LoanApprovalSpecification implements ValidationSpecification<LoanApplication> {
  private readonly specs: ValidationSpecification<LoanApplication>[];
  // => Encapsulated state, not directly accessible

  constructor() {
    // => Initialize object with parameters
    this.specs = [
      // => Update specs state
      new MinimumIncomeSpecification(),
      // => Aggregate boundary enforced here
      new DebtToIncomeRatioSpecification(),
      // => Domain event triggered or handled
      new MinimumCreditScoreSpecification(),
      // => Cross-context interaction point
    ];
    // => DDD tactical pattern applied
  }

  isSatisfiedBy(application: LoanApplication): boolean {
    return this.specs.every((spec) => spec.isSatisfiedBy(application));
    // => All validation rules must pass
  }

  getErrorMessage(): string {
    const failures = this.specs.filter((spec) => !spec.isSatisfiedBy).map((spec) => spec.getErrorMessage());
    // => Store value in failures
    return failures.join("; ");
    // => Return all validation errors
  }
}

// Usage - Specifications for validation
const approvalSpec = new LoanApprovalSpecification();
// => Store value in approvalSpec

// Scenario 1: Valid application
const validApplication = LoanApplication.create(
  // => Store value in validApplication
  100000, // $1000 income
  // => Communicates domain intent
  40000, // $400 requested (40% ratio)
  // => Domain operation executes here
  700, // Credit score 700
  // => Modifies aggregate internal state
);
// => Validates business rule

try {
  // => Enforces invariant
  validApplication.approve(approvalSpec);
  // => Execute method
  console.log(`Loan ${validApplication.getApplicationId()} approved`);
  // => Outputs result
  // => Output: Loan LOAN-[timestamp] approved
} catch (error) {
  // => Business rule enforced here
  console.log(error.message);
  // => Outputs result
}

// Scenario 2: Invalid application - insufficient income
const invalidApplication1 = LoanApplication.create(
  // => Store value in invalidApplication1
  20000, // $200 income (below minimum)
  // => Aggregate boundary enforced here
  10000, // $100 requested
  // => Domain event triggered or handled
  700,
  // => Cross-context interaction point
);
// => DDD tactical pattern applied

try {
  invalidApplication1.approve(approvalSpec);
  // => Execute method
} catch (error) {
  // => Transaction boundary maintained
  console.log(error.message);
  // => Outputs result
  // => Output: Cannot approve: Applicant income must be at least $300
}

// Scenario 3: Invalid application - high debt-to-income ratio
const invalidApplication2 = LoanApplication.create(
  // => Store value in invalidApplication2
  100000, // $1000 income
  // => Domain model consistency maintained
  50000, // $500 requested (50% ratio - too high)
  // => Communicates domain intent
  700,
  // => Domain operation executes here
);
// => Modifies aggregate internal state

try {
  // => Validates business rule
  invalidApplication2.approve(approvalSpec);
  // => Execute method
} catch (error) {
  // => Enforces invariant
  console.log(error.message);
  // => Outputs result
  // => Output: Cannot approve: Debt-to-income ratio exceeds maximum (43%)
}
```

**Key Takeaway**: Validation Specifications encapsulate complex business rules for state transitions. Domain methods accept Specification parameters, delegating validation to business-rule objects. This keeps validation logic testable, reusable, and explicit rather than buried in domain entity methods.

**Why It Matters**: Validation Specifications enable regulatory compliance and business rule documentation. Banks must document loan approval criteria for auditors—Specification classes become living documentation of exact rules (minimum income, debt-to-income ratio, credit score thresholds). When regulations change (e.g., max debt-to-income ratio reduced from 43% to 36%), update one Specification class instead of finding all validation logic scattered across codebase. Specifications make business rules explicit, testable, and auditable.

## Integration Patterns (Examples 59-60)

### Example 59: Outbox Pattern for Reliable Event Publishing

Ensuring domain events are published reliably even if message broker is unavailable.

```typescript
// Domain Event
class OrderConfirmedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly eventId: string,
    public readonly orderId: string,
    public readonly occurredAt: Date,
  ) {}
}

// Outbox Entry - stores events in database
class OutboxEntry {
  constructor(
    // => Initialize object with parameters
    public readonly entryId: string,
    public readonly eventType: string,
    public readonly eventPayload: string, // JSON serialized event
    public readonly createdAt: Date,
    public published: boolean = false,
  ) {}
  // => Validates business rule

  markAsPublished(): void {
    this.published = true;
    // => Update published state
  }
  // => Enforces invariant
}

// Outbox Repository
interface OutboxRepository {
  // => OutboxRepository: contract definition
  save(entry: OutboxEntry): void;
  findUnpublished(): OutboxEntry[];
  markAsPublished(entryId: string): void;
}

class InMemoryOutboxRepository implements OutboxRepository {
  private entries: Map<string, OutboxEntry> = new Map();
  // => Encapsulated field (not publicly accessible)

  save(entry: OutboxEntry): void {
    this.entries.set(entry.entryId, entry);
    // => Delegates to internal method
    console.log(`Outbox entry saved: ${entry.entryId}`);
    // => Outputs result
  }

  findUnpublished(): OutboxEntry[] {
    return Array.from(this.entries.values()).filter((e) => !e.published);
  }

  markAsPublished(entryId: string): void {
    const entry = this.entries.get(entryId);
    // => Store value in entry
    if (entry) {
      entry.markAsPublished();
      // => Execute method
      console.log(`Outbox entry ${entryId} marked published`);
      // => Outputs result
    }
  }
}

// Application Service - saves to outbox instead of publishing directly
class ConfirmOrderService {
  constructor(
    // => Initialize object with parameters
    private readonly orderRepo: OrderRepository,
    // => Encapsulated state, not directly accessible
    private readonly outboxRepo: OutboxRepository,
    // => Encapsulated state, not directly accessible
  ) {}

  confirmOrder(orderId: string): void {
    // Step 1: Load and confirm order
    const order = this.orderRepo.findById(orderId);
    // => Store value in order
    if (!order) {
      throw new Error("Order not found");
      // => Raise domain exception
    }

    order.confirm();
    // => Execute method
    this.orderRepo.save(order);
    // => Delegates to internal method
    // => Order confirmed and saved

    // Step 2: Save event to outbox (same transaction as order update)
    const event = new OrderConfirmedEvent(`EVT-${Date.now()}`, orderId, new Date());
    // => Store value in event
    const outboxEntry = new OutboxEntry(`OUT-${Date.now()}`, "OrderConfirmed", JSON.stringify(event), new Date());
    // => Store value in outboxEntry
    this.outboxRepo.save(outboxEntry);
    // => Delegates to internal method
    // => Event saved to outbox (transactionally consistent)

    console.log(`Order ${orderId} confirmed, event saved to outbox`);
    // => Outputs result
  }
}
// => Communicates domain intent

// Background worker - publishes events from outbox
class OutboxPublisher {
  constructor(
    // => Initialize object with parameters
    private readonly outboxRepo: OutboxRepository,
    // => Encapsulated state, not directly accessible
    private readonly eventPublisher: EventPublisher,
    // => Encapsulated state, not directly accessible
  ) {}

  publishPendingEvents(): void {
    // => Background job: publish unpublished events
    const unpublished = this.outboxRepo.findUnpublished();
    // => Store value in unpublished
    console.log(`Found ${unpublished.length} unpublished events`);
    // => Outputs result

    unpublished.forEach((entry) => {
      // => forEach: process collection elements
      try {
        const event = JSON.parse(entry.eventPayload);
        // => Store value in event
        this.eventPublisher.publish(event);
        // => Delegates to internal method
        // => Publish to message broker

        this.outboxRepo.markAsPublished(entry.entryId);
        // => Delegates to internal method
        // => Mark as published in outbox
      } catch (error) {
        // => Validates business rule
        console.log(`Failed to publish ${entry.entryId}: ${error.message}`);
        // => Outputs result
        // => Retry on next poll
      }
      // => Enforces invariant
    });
  }
}

// Supporting classes
class Order {
  constructor(
    // => Initialize object with parameters
    private readonly orderId: string,
    // => Encapsulated state, not directly accessible
    private status: string = "PENDING",
    // => Encapsulated field (not publicly accessible)
  ) {}

  confirm(): void {
    this.status = "CONFIRMED";
    // => Update status state
  }

  getOrderId(): string {
    return this.orderId;
    // => Return result to caller
  }
}

interface OrderRepository {
  // => OrderRepository: contract definition
  findById(orderId: string): Order | null;
  save(order: Order): void;
}

class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  // => Encapsulated field (not publicly accessible)

  findById(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
    // => Return result to caller
  }

  save(order: Order): void {
    this.orders.set(order.getOrderId(), order);
    // => Delegates to internal method
  }
}
// => Communicates domain intent

interface EventPublisher {
  // => EventPublisher: contract definition
  publish(event: any): void;
}

class MockEventPublisher implements EventPublisher {
  private publishedEvents: any[] = [];
  // => Encapsulated field (not publicly accessible)

  publish(event: any): void {
    this.publishedEvents.push(event);
    // => Delegates to internal method
    console.log(`Event published to message broker: ${event.eventId}`);
    // => Outputs result
  }

  getPublishedCount(): number {
    return this.publishedEvents.length;
    // => Return result to caller
  }
  // => Validates business rule
}
// => Enforces invariant

// Usage - Outbox pattern ensures reliable event publishing
const orderRepo = new InMemoryOrderRepository();
// => Store value in orderRepo
const outboxRepo = new InMemoryOutboxRepository();
// => Store value in outboxRepo
const eventPublisher = new MockEventPublisher();
// => Store value in eventPublisher

const order = new Order("O123");
// => Store value in order
orderRepo.save(order);
// => Execute method

const confirmService = new ConfirmOrderService(orderRepo, outboxRepo);
// => Store value in confirmService
confirmService.confirmOrder("O123");
// => Output: Outbox entry saved: OUT-[timestamp]
// => Output: Order O123 confirmed, event saved to outbox

// Background worker publishes events
const outboxPublisher = new OutboxPublisher(outboxRepo, eventPublisher);
// => Store value in outboxPublisher
outboxPublisher.publishPendingEvents();
// => Output: Found 1 unpublished events
// => Output: Event published to message broker: EVT-[timestamp]
// => Output: Outbox entry OUT-[timestamp] marked published

console.log(`Total events published: ${eventPublisher.getPublishedCount()}`);
// => Outputs result
// => Output: Total events published: 1
```

**Key Takeaway**: Outbox pattern stores domain events in database within same transaction as aggregate changes, then publishes them asynchronously via background worker. This ensures events are never lost even if message broker is unavailable, achieving eventual consistency with guaranteed delivery.

**Why It Matters**: Direct event publishing to message brokers can lose events during failures. If Kafka is down when order confirmed, event never publishes, causing downstream systems (shipping, inventory) to miss critical state changes. Outbox pattern solves this: events saved to database (same transaction as order), background worker retries until published. Major platforms use Outbox for financial transactions where losing events means financial loss. Trade-off: slight delay (polling interval) vs. guaranteed delivery.

### Example 60: API Gateway Integration with Anti-Corruption Layer

Integrating with external REST APIs while protecting domain model from external contracts.

```typescript
// External API Response (third-party format we don't control)
interface ExternalProductAPIResponse {
  product_id: string; // => Snake case naming
  product_name: string;
  // => Domain operation executes here
  price_in_cents: number;
  // => Modifies aggregate internal state
  available_qty: number;
  // => Validates business rule
  category_code: string;
  // => Enforces invariant
}

// Our Domain Model (our ubiquitous language)
class Product {
  private constructor(
    // => Initialize object with parameters
    private readonly productId: string,
    // => Encapsulated state, not directly accessible
    private readonly name: string,
    // => Encapsulated state, not directly accessible
    private readonly price: Money,
    // => Encapsulated state, not directly accessible
    private readonly stockQuantity: number,
    // => Encapsulated state, not directly accessible
    private readonly category: ProductCategory,
    // => Encapsulated state, not directly accessible
  ) {}

  static create(
    // => Aggregate boundary enforced here
    productId: string,
    // => Domain event triggered or handled
    name: string,
    // => Cross-context interaction point
    price: Money,
    // => DDD tactical pattern applied
    stockQuantity: number,
    // => Invariant validation executed
    category: ProductCategory,
    // => Transaction boundary maintained
  ): Product {
    return new Product(productId, name, price, stockQuantity, category);
    // => Return result to caller
  }

  getProductId(): string {
    return this.productId;
    // => Return result to caller
  }
  // => Communicates domain intent

  getName(): string {
    return this.name;
    // => Return result to caller
  }

  getPrice(): Money {
    return this.price;
    // => Return result to caller
  }

  isAvailable(): boolean {
    return this.stockQuantity > 0;
    // => Return result to caller
  }
  // => Validates business rule
}
// => Enforces invariant

class Money {
  constructor(
    // => Initialize object with parameters
    private readonly amount: number,
    // => Encapsulated state, not directly accessible
    private readonly currency: string,
    // => Encapsulated state, not directly accessible
  ) {}

  getAmount(): number {
    return this.amount;
    // => Return result to caller
  }

  getCurrency(): string {
    return this.currency;
    // => Return result to caller
  }
}

enum ProductCategory {
  ELECTRONICS = "ELECTRONICS",
  // => ELECTRONICS: maps to string value "ELECTRONICS"
  CLOTHING = "CLOTHING",
  // => CLOTHING: maps to string value "CLOTHING"
  BOOKS = "BOOKS",
  // => BOOKS: maps to string value "BOOKS"
}

// Anti-Corruption Layer - translates external API to our domain
class ProductAPIAdapter {
  constructor(private readonly apiClient: ExternalProductAPI) {}
  // => Initialize object with parameters

  async fetchProduct(productId: string): Promise<Product> {
    // => ACL method using domain types
    const externalResponse = await this.apiClient.getProduct(productId);
    // => Call external API (uses their format)

    return this.translateToDomain(externalResponse);
    // => Translate to our domain model
  }

  private translateToDomain(response: ExternalProductAPIResponse): Product {
    // => Internal logic (not part of public API)
    // => ACL translation logic
    const money = new Money(response.price_in_cents, "USD");
    // => Convert external price to our Money value object

    const category = this.translateCategory(response.category_code);
    // => Map external category codes to our enum

    return Product.create(response.product_id, response.product_name, money, response.available_qty, category);
    // => Create our domain model from external data
  }
  // => Communicates domain intent

  private translateCategory(categoryCode: string): ProductCategory {
    // => Internal logic (not part of public API)
    // => Map external codes to domain enum
    switch (categoryCode) {
      case "ELEC":
        // => Domain operation executes here
        return ProductCategory.ELECTRONICS;
      case "CLTH":
        // => Modifies aggregate internal state
        return ProductCategory.CLOTHING;
      case "BOOK":
        // => Validates business rule
        return ProductCategory.BOOKS;
      default:
        // => Enforces invariant
        return ProductCategory.BOOKS; // Default fallback
    }
  }
}

// External API Client (simulated)
interface ExternalProductAPI {
  // => ExternalProductAPI: contract definition
  getProduct(productId: string): Promise<ExternalProductAPIResponse>;
}

class MockExternalProductAPI implements ExternalProductAPI {
  async getProduct(productId: string): Promise<ExternalProductAPIResponse> {
    // Simulate external API response
    return {
      product_id: productId,
      // => Cross-context interaction point
      product_name: "Laptop Pro",
      // => DDD tactical pattern applied
      price_in_cents: 150000,
      // => Invariant validation executed
      available_qty: 10,
      // => Transaction boundary maintained
      category_code: "ELEC",
      // => Entity state transition managed
    };
  }
  // => Communicates domain intent
}

// Application Service - uses ACL adapter
class ProductApplicationService {
  constructor(private readonly productAdapter: ProductAPIAdapter) {}
  // => Initialize object with parameters

  async getProductDetails(productId: string): Promise<void> {
    // => Application service uses domain model
    const product = await this.productAdapter.fetchProduct(productId);
    // => Retrieve product via ACL

    console.log(`Product: ${product.getName()}`);
    // => Outputs result
    console.log(`Price: ${product.getPrice().getCurrency()} ${product.getPrice().getAmount() / 100}`);
    // => Outputs result
    console.log(`Available: ${product.isAvailable()}`);
    // => Outputs result
    // => Work with our domain model, not external format
  }
}
// => Validates business rule

// Usage - ACL shields domain from external API
(async () => {
  // => Create data structure
  const externalAPI = new MockExternalProductAPI();
  // => Store value in externalAPI
  const adapter = new ProductAPIAdapter(externalAPI);
  // => Store value in adapter
  const applicationService = new ProductApplicationService(adapter);
  // => Store value in applicationService

  await applicationService.getProductDetails("P123");
  // => Output: Product: Laptop Pro
  // => Output: Price: USD 1500
  // => Output: Available: true
})();
// => Enforces invariant
```

**Key Takeaway**: API Gateway integration with Anti-Corruption Layer translates external API responses into domain models, protecting ubiquitous language from external contracts. External APIs use their naming conventions and data structures; ACL adapts to our domain model, keeping domain pure.

**Why It Matters**: External APIs change frequently and have different domain models. When integrating with a payment processor's API, don't pollute your domain with their naming conventions ("charge," "source," "customer_id"). Build ACL that translates external responses to your Payment, PaymentMethod, and Customer domain objects. When the external API changes (e.g., deprecates "source" in favor of "payment_method"), only ACL updates—domain model unchanged. This isolation enables switching payment processors by swapping ACL implementation without touching domain logic.
