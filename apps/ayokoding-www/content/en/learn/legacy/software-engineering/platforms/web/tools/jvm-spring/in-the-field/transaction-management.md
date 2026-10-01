---
title: "Transaction Management"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000022
description: "Manual Connection commit/rollback to @Transactional with propagation and isolation levels for production data integrity"
tags: ["spring", "in-the-field", "production", "transactions", "acid"]
---

## Why Transaction Management Matters

Transactions ensure data consistency through ACID properties (Atomicity, Consistency, Isolation, Durability). In production systems handling financial operations—like zakat transfers, payment processing, and account management—manual transaction management is error-prone. Spring's @Transactional annotation eliminates boilerplate while providing sophisticated propagation and isolation controls for complex business scenarios.

## JDBC Manual Transaction Baseline

Manual transaction management requires explicit commit/rollback:

```java
import java.sql.*;

// => Zakat transfer service: manual transaction management
public class ZakatTransferService {

    private final DataSource dataSource;

    // => Transfer zakat between accounts: manual transaction
    public void transferZakat(String fromAccount, String toAccount, BigDecimal amount) {
        Connection conn = null;  // => Connection: database connection

        try {
            // => Get connection from pool
            conn = dataSource.getConnection();

            // => Manual transaction start: disable auto-commit
            // => Default: auto-commit after each SQL statement
            // => setAutoCommit(false): manual transaction boundary
            conn.setAutoCommit(false);

            // => Debit from source account
            try (PreparedStatement debitStmt = conn.prepareStatement(
                    "UPDATE zakat_accounts SET balance = balance - ? WHERE account_number = ?")) {
                debitStmt.setBigDecimal(1, amount);  // => Deduct amount
                debitStmt.setString(2, fromAccount);
                int debitRows = debitStmt.executeUpdate();

                // => Verify debit succeeded: must affect exactly 1 row
                if (debitRows != 1) {
                    // => Rollback: undo all changes in transaction
                    conn.rollback();
                    throw new IllegalStateException("Failed to debit account: " + fromAccount);
                }
            }

            // => Credit to destination account
            try (PreparedStatement creditStmt = conn.prepareStatement(
                    "UPDATE zakat_accounts SET balance = balance + ? WHERE account_number = ?")) {
                creditStmt.setBigDecimal(1, amount);  // => Add amount
                creditStmt.setString(2, toAccount);
                int creditRows = creditStmt.executeUpdate();

                // => Verify credit succeeded
                if (creditRows != 1) {
                    // => Rollback: undo debit operation
                    conn.rollback();
                    throw new IllegalStateException("Failed to credit account: " + toAccount);
                }
            }

            // => Record transaction history
            try (PreparedStatement historyStmt = conn.prepareStatement(
                    "INSERT INTO transfer_history (from_account, to_account, amount, timestamp) VALUES (?, ?, ?, ?)")) {
                historyStmt.setString(1, fromAccount);
                historyStmt.setString(2, toAccount);
                historyStmt.setBigDecimal(3, amount);
                historyStmt.setTimestamp(4, new Timestamp(System.currentTimeMillis()));
                historyStmt.executeUpdate();
            }

            // => Manual commit: persist all changes
            // => Atomicity: all operations succeed or all fail
            conn.commit();

        } catch (SQLException e) {
            // => Error handling: rollback on any exception
            if (conn != null) {
                try {
                    // => Rollback: undo all changes in transaction
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    // => Rollback failure: serious issue, log and escalate
                    throw new RuntimeException("Failed to rollback transaction", rollbackEx);
                }
            }
            throw new RuntimeException("Transfer failed", e);

        } finally {
            // => Restore auto-commit mode
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);  // => Restore default behavior
                    conn.close();  // => Return connection to pool
                } catch (SQLException ignored) {}
            }
        }
    }
}
```

**Limitations:**

- **Boilerplate**: 60+ lines for single transaction
- **Error-prone**: Easy to forget rollback in catch block
- **Manual boundaries**: Must remember setAutoCommit(false)/commit/rollback
- **No propagation**: Can't compose transactions across service methods
- **No isolation control**: Stuck with database default isolation level
- **Resource management**: Must restore auto-commit and close connection

## Spring @Transactional Solution

Spring @Transactional manages transactions automatically:

```java
import org.springframework.transaction.annotation.Transactional;

// => Service: Spring transaction management
@Service  // => Spring-managed service bean
public class ZakatTransferService {

    private final ZakatAccountRepository accountRepository;
    private final TransferHistoryRepository historyRepository;

    // => Constructor injection: Spring provides repositories
    public ZakatTransferService(
            ZakatAccountRepository accountRepository,
            TransferHistoryRepository historyRepository) {
        this.accountRepository = accountRepository;
        this.historyRepository = historyRepository;
    }

    // => @Transactional: automatic transaction management
    // => Opens transaction, commits on success, rolls back on exception
    @Transactional  // => Transaction boundary: method start to method end
    public void transferZakat(String fromAccount, String toAccount, BigDecimal amount) {
        // => Transaction started automatically by Spring

        // => Debit from source account
        ZakatAccount from = accountRepository.findByAccountNumber(fromAccount)
            .orElseThrow(() -> new AccountNotFoundException("Source account not found: " + fromAccount));
        from.debit(amount);  // => Reduce balance
        accountRepository.save(from);  // => UPDATE in database

        // => Credit to destination account
        ZakatAccount to = accountRepository.findByAccountNumber(toAccount)
            .orElseThrow(() -> new AccountNotFoundException("Destination account not found: " + toAccount));
        to.credit(amount);  // => Increase balance
        accountRepository.save(to);  // => UPDATE in database

        // => Record transaction history
        TransferHistory history = new TransferHistory(fromAccount, toAccount, amount);
        historyRepository.save(history);  // => INSERT in database

        // => Automatic commit: all operations succeed together
        // => If any exception thrown: automatic rollback, no changes persisted
    }
}
```

**Benefits:**

- **95% less code**: 10 lines vs 60+ lines
- **Automatic boundaries**: Transaction starts/commits automatically
- **Exception-driven rollback**: Any exception triggers rollback
- **Composition**: Methods with @Transactional can call other @Transactional methods
- **Declarative**: Configuration separate from business logic

## Transaction Propagation

Propagation controls transaction behavior when methods call each other:

```java
import org.springframework.transaction.annotation.Propagation;

@Service
public class ZakatDistributionService {

    private final ZakatTransferService transferService;
    private final NotificationService notificationService;

    // => REQUIRED (default): join existing transaction or create new
    @Transactional(propagation = Propagation.REQUIRED)
    // => If caller has transaction: join it
    // => If no transaction: create new transaction
    public void distributeZakat(String sourceAccount, List<String> recipients, BigDecimal amountPerRecipient) {
        // => Transaction started here if not already active

        for (String recipient : recipients) {
            // => transferService.transferZakat() has @Transactional(REQUIRED)
            // => Joins this transaction: all transfers in same transaction
            transferService.transferZakat(sourceAccount, recipient, amountPerRecipient);
        }

        // => All transfers succeed or all fail together (atomicity)
        // => Commit happens here after all transfers complete
    }

    // => REQUIRES_NEW: always create new transaction (suspend existing)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    // => Always creates new transaction, even if caller has one
    // => Caller's transaction suspended during this method
    public void recordAuditLog(String operation, String details) {
        // => New transaction: commits independently of caller's transaction

        AuditLog log = new AuditLog(operation, details, LocalDateTime.now());
        auditRepository.save(log);

        // => Commits immediately when method ends
        // => Even if caller's transaction rolls back, audit log persists
    }

    // => Combining REQUIRED and REQUIRES_NEW
    @Transactional(propagation = Propagation.REQUIRED)
    public void processDistributionWithAudit(String sourceAccount, List<String> recipients, BigDecimal amount) {
        // => Transaction 1 starts here

        distributeZakat(sourceAccount, recipients, amount);  // => Joins Transaction 1

        // => recordAuditLog creates Transaction 2 (suspends Transaction 1)
        recordAuditLog("DISTRIBUTION", "Distributed to " + recipients.size() + " recipients");
        // => Transaction 2 commits immediately

        // => Back to Transaction 1
        // => If exception thrown here: Transaction 1 rolls back, but audit log persists
    }

    // => SUPPORTS: join transaction if exists, run without if not
    @Transactional(propagation = Propagation.SUPPORTS)
    // => If caller has transaction: join it
    // => If no transaction: execute without transaction
    public ZakatAccount getAccount(String accountNumber) {
        // => Read-only operation: doesn't need transaction
        // => But joins transaction if caller has one (consistent view)
        return accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new AccountNotFoundException(accountNumber));
    }

    // => NOT_SUPPORTED: always run without transaction (suspend existing)
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    // => Never runs in transaction
    // => Suspends caller's transaction if present
    public void sendNotification(String recipient, String message) {
        // => No transaction: notification service doesn't need ACID
        // => Suspends caller's transaction to avoid holding database connection
        notificationService.send(recipient, message);
    }

    // => MANDATORY: require existing transaction (throw exception if none)
    @Transactional(propagation = Propagation.MANDATORY)
    // => Must be called within existing transaction
    // => Throws exception if no transaction active
    public void validateTransfer(String fromAccount, String toAccount, BigDecimal amount) {
        // => Must be called from @Transactional method
        // => Ensures this operation always runs within transaction
        ZakatAccount from = accountRepository.findByAccountNumber(fromAccount)
            .orElseThrow(() -> new AccountNotFoundException(fromAccount));

        if (from.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient balance");
        }
    }

    // => NEVER: require no transaction (throw exception if exists)
    @Transactional(propagation = Propagation.NEVER)
    // => Must NOT be called within transaction
    // => Throws exception if transaction active
    public void generateReport() {
        // => Long-running operation: should not hold transaction
        // => Throws exception if caller has active transaction
        reportGenerator.generate();
    }

    // => NESTED: create savepoint within existing transaction
    @Transactional(propagation = Propagation.NESTED)
    // => Creates savepoint in existing transaction
    // => Can rollback to savepoint without rolling back entire transaction
    public void processSingleRecipient(String sourceAccount, String recipient, BigDecimal amount) {
        // => Savepoint created here

        try {
            transferService.transferZakat(sourceAccount, recipient, amount);
        } catch (Exception e) {
            // => Rolls back to savepoint: only this recipient's transfer undone
            // => Caller's transaction continues (other recipients still processed)
            throw new RecipientTransferFailedException(recipient, e);
        }

        // => Savepoint released on success
    }
}
```

## Transaction Isolation Levels

Isolation controls concurrent transaction behavior:

```java
import org.springframework.transaction.annotation.Isolation;

@Service
public class ZakatAccountService {

    private final ZakatAccountRepository accountRepository;

    // => READ_UNCOMMITTED: lowest isolation, highest concurrency
    @Transactional(isolation = Isolation.READ_UNCOMMITTED)
    // => Allows reading uncommitted changes (dirty reads)
    // => Fastest: no locking, but inconsistent data possible
    public BigDecimal getApproximateBalance(String accountNumber) {
        // => May read uncommitted balance changes from other transactions
        // => Use for approximate values where consistency not critical
        ZakatAccount account = accountRepository.findByAccountNumber(accountNumber).orElseThrow();
        return account.getBalance();
    }

    // => READ_COMMITTED: prevents dirty reads (default for most databases)
    @Transactional(isolation = Isolation.READ_COMMITTED)
    // => Reads only committed data, but data can change during transaction
    // => Non-repeatable reads: same SELECT may return different results
    public List<ZakatAccount> getAccountsAboveNisab(BigDecimal nisab) {
        // => First query: reads committed balances
        List<ZakatAccount> accounts = accountRepository.findByBalanceGreaterThan(nisab);

        // => If another transaction commits balance changes between queries...
        // => Second query may return different results (non-repeatable read)
        accounts.forEach(account -> {
            BigDecimal balance = accountRepository.findByAccountNumber(account.getAccountNumber())
                .orElseThrow()
                .getBalance();
            // => Balance may differ from first query result
        });

        return accounts;
    }

    // => REPEATABLE_READ: prevents dirty and non-repeatable reads
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    // => Same SELECT returns same results within transaction
    // => Reads see snapshot at transaction start
    public void calculateTotalZakat(List<String> accountNumbers) {
        BigDecimal total = BigDecimal.ZERO;

        // => All reads within this transaction see consistent snapshot
        for (String accountNumber : accountNumbers) {
            ZakatAccount account = accountRepository.findByAccountNumber(accountNumber).orElseThrow();
            // => Balance remains consistent even if other transactions commit changes
            total = total.add(account.getBalance().multiply(new BigDecimal("0.025")));
        }

        // => Total calculated on consistent snapshot (no phantom reads within loop)
    }

    // => SERIALIZABLE: highest isolation, prevents all anomalies
    @Transactional(isolation = Isolation.SERIALIZABLE)
    // => Transactions execute as if serial (one after another)
    // => Prevents dirty reads, non-repeatable reads, phantom reads
    // => Slowest: uses locking to ensure serializability
    public void rebalanceAccounts() {
        // => Full table lock: no concurrent modifications possible
        List<ZakatAccount> accounts = accountRepository.findAll();

        // => Calculate new balances based on consistent snapshot
        BigDecimal totalBalance = accounts.stream()
            .map(ZakatAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageBalance = totalBalance.divide(
            BigDecimal.valueOf(accounts.size()),
            2,
            RoundingMode.HALF_UP
        );

        // => Update all accounts: no other transaction can interfere
        accounts.forEach(account -> {
            account.setBalance(averageBalance);
            accountRepository.save(account);
        });

        // => Commit: releases locks, other transactions can proceed
    }

    // => Isolation for financial accuracy: REPEATABLE_READ
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    // => Financial calculations require consistent data
    public void transferWithBalanceCheck(String fromAccount, String toAccount, BigDecimal amount) {
        // => Read source balance: snapshot at transaction start
        ZakatAccount from = accountRepository.findByAccountNumber(fromAccount).orElseThrow();
        BigDecimal originalBalance = from.getBalance();

        // => Check sufficient funds
        if (originalBalance.compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds");
        }

        // => Perform transfer
        from.debit(amount);
        accountRepository.save(from);

        ZakatAccount to = accountRepository.findByAccountNumber(toAccount).orElseThrow();
        to.credit(amount);
        accountRepository.save(to);

        // => Re-read source balance: must be consistent with original read
        ZakatAccount fromUpdated = accountRepository.findByAccountNumber(fromAccount).orElseThrow();
        // => Balance matches expected value (originalBalance - amount)
        // => No phantom updates from other transactions
    }
}
```

## Rollback Rules

Control which exceptions trigger rollback:

```java
@Service
public class ZakatPaymentService {

    // => Default: rollback on RuntimeException and Error (unchecked exceptions)
    @Transactional  // => Rolls back on any RuntimeException or Error
    public void processPayment(Payment payment) {
        // => RuntimeException: triggers rollback
        if (payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }

        paymentRepository.save(payment);
        // => Automatic rollback if IllegalArgumentException thrown
    }

    // => Rollback on specific checked exception
    @Transactional(rollbackFor = PaymentProcessingException.class)
    // => Rolls back on PaymentProcessingException (checked exception)
    public void processPaymentWithExternalService(Payment payment) throws PaymentProcessingException {
        paymentRepository.save(payment);

        try {
            // => Call external payment gateway
            externalGateway.charge(payment);
        } catch (GatewayException e) {
            // => Checked exception: normally doesn't trigger rollback
            // => rollbackFor: forces rollback on this checked exception
            throw new PaymentProcessingException("Gateway failed", e);
        }
        // => PaymentProcessingException triggers rollback
    }

    // => No rollback on specific exception
    @Transactional(noRollbackFor = TemporaryNetworkException.class)
    // => Doesn't roll back on TemporaryNetworkException
    public void processPaymentWithRetry(Payment payment) {
        paymentRepository.save(payment);

        try {
            externalGateway.charge(payment);
        } catch (TemporaryNetworkException e) {
            // => Network issue: don't rollback, payment saved for retry
            // => noRollbackFor: commits transaction despite exception
            retryQueue.add(payment);
            // => Transaction commits: payment saved, added to retry queue
        }
    }

    // => Rollback on all exceptions
    @Transactional(rollbackFor = Exception.class)
    // => Rolls back on any exception (checked or unchecked)
    public void processPaymentStrict(Payment payment) throws Exception {
        paymentRepository.save(payment);
        externalGateway.charge(payment);  // => May throw checked exception
        // => Any exception triggers rollback
    }
}
```

## Progression Diagram

```mermaid
graph TD
    accTitle: Progression Diagram
    accDescr: Graph with 12 nodes and 15 connections. Nodes: Manual Transaction commit/rollback, Boilerplate, Error-Prone, No Propagation, @Transactional Declarative, Automatic, Safe Rollback, Composable, Advanced @Transactional Isolation + Rollback, Financial Accuracy, Fine-Grained Control, Independent Commits. Connections: Manual Transaction commit/rollback to Boilerplate (60+ Lines), Manual Transaction commit/rollback to Error-Prone (Manual Boundaries), Manual Transaction commit/rollback to No Propagation (No Composition), Boilerplate to Error-Prone, Error-Prone to No Propagation, @Transactional Declarative to Automatic (10 Lines), @Transactional Declarative to Safe Rollback (Exception-Driven), @Transactional Declarative to Composable (Propagation Modes), Automatic to Safe Rollback, Safe Rollback to Composable, Advanced @Transactional Isolation + Rollback to Financial Accuracy (SERIALIZABLE), Advanced @Transactional Isolation + Rollback to Fine-Grained Control (rollbackFor), and 3 more.
    A[Manual Transaction<br/>commit/rollback] -->|60+ Lines| B[Boilerplate]
    A -->|Manual Boundaries| C[Error-Prone]
    A -->|No Composition| D[No Propagation]
    B --- C
    C --- D

    E[@Transactional<br/>Declarative] -->|10 Lines| F[Automatic]
    E -->|Exception-Driven| G[Safe Rollback]
    E -->|Propagation Modes| H[Composable]
    F --- G
    G --- H

    I[Advanced<br/>@Transactional<br/>Isolation + Rollback] -->|SERIALIZABLE| J[Financial Accuracy]
    I -->|rollbackFor| K[Fine-Grained Control]
    I -->|REQUIRES_NEW| L[Independent Commits]
    J --- K
    K --- L

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class A pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class I pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Production Patterns

### Read-Only Transactions for Performance

```java
@Service
public class ZakatReportService {

    // => @Transactional(readOnly = true): optimization for queries
    // => Database can skip undo log creation
    // => Hibernate skips dirty checking (faster)
    @Transactional(readOnly = true)  // => Read-only optimization
    public List<ZakatAccount> getAccountsReport() {
        return accountRepository.findAll();
    }
}
```

### Timeout for Long-Running Transactions

```java
@Service
public class ZakatBatchService {

    // => timeout: automatic rollback after duration
    @Transactional(timeout = 30)  // => 30 second timeout
    public void processBatch(List<Payment> payments) {
        // => If method takes >30 seconds: automatic rollback
        // => Prevents long-running transactions holding locks
        payments.forEach(paymentRepository::save);
    }
}
```

### Programmatic Transaction Control

```java
@Service
public class ZakatTransferService {

    private final TransactionTemplate transactionTemplate;

    // => TransactionTemplate: programmatic transaction control
    public void transferWithProgrammaticControl(String from, String to, BigDecimal amount) {
        // => execute(): runs callback in transaction
        transactionTemplate.execute(status -> {
            try {
                // => Transaction started

                accountRepository.debit(from, amount);
                accountRepository.credit(to, amount);

                // => Manual rollback decision
                if (amount.compareTo(new BigDecimal("10000")) > 0) {
                    // => setRollbackOnly(): marks transaction for rollback
                    status.setRollbackOnly();
                    return false;
                }

                // => Automatic commit
                return true;

            } catch (Exception e) {
                // => Manual rollback trigger
                status.setRollbackOnly();
                throw e;
            }
        });
    }
}
```

## Trade-offs and When to Use

| Approach                  | Boilerplate | Safety    | Flexibility | Composition | Performance |
| ------------------------- | ----------- | --------- | ----------- | ----------- | ----------- |
| Manual JDBC               | Very High   | Low       | Full        | None        | Fast        |
| @Transactional            | Very Low    | High      | Medium      | Excellent   | Good        |
| @Transactional + Advanced | Low         | Very High | High        | Excellent   | Variable    |
| TransactionTemplate       | Low         | High      | Full        | Good        | Good        |

**When to Use Manual JDBC Transactions:**

- Learning transaction fundamentals
- Single-statement operations (no benefit from transaction framework)
- Debugging transaction issues

**When to Use @Transactional:**

- All production services (default choice)
- Multi-statement operations requiring atomicity
- Composing transactional operations across services
- Standard propagation and isolation requirements

**When to Use Advanced @Transactional:**

- Financial operations requiring SERIALIZABLE isolation
- Audit logging requiring independent commits (REQUIRES_NEW)
- Complex propagation scenarios (NESTED, MANDATORY)
- Fine-grained rollback control (rollbackFor, noRollbackFor)

**When to Use TransactionTemplate:**

- Dynamic transaction decisions based on runtime conditions
- Multiple transaction blocks within single method
- Programmatic rollback control (setRollbackOnly)

## Best Practices

**1. Use @Transactional at Service Layer**

Keep transactions at business logic boundary:

```java
@Service
@Transactional  // => Default for all methods
public class ZakatService {
    // Business logic with transactions
}
```

**2. Use readOnly for Query Methods**

Optimize read-only operations:

```java
@Transactional(readOnly = true)
public List<ZakatAccount> getAccounts() {
    return accountRepository.findAll();
}
```

**3. Set Appropriate Timeouts**

Prevent long-running transactions:

```java
@Transactional(timeout = 30)
public void processBatch(List<Payment> payments) {
    // Auto-rollback after 30 seconds
}
```

**4. Use REQUIRES_NEW for Independent Operations**

Audit logging should always persist:

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void auditLog(String operation) {
    // Commits independently
}
```

**5. Use Appropriate Isolation Levels**

Financial operations need stronger isolation:

```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void transferMoney(String from, String to, BigDecimal amount) {
    // Consistent snapshot
}
```

**6. Handle Rollback Rules for Checked Exceptions**

Force rollback on business exceptions:

```java
@Transactional(rollbackFor = PaymentException.class)
public void processPayment(Payment payment) throws PaymentException {
    // Rolls back on checked exception
}
```

## See Also

- [Spring JDBC](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-jdbc) - JDBC transaction baseline
- [Spring Data JPA](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-data-jpa) - JPA transaction integration
- [Connection Pooling](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/connection-pooling) - Connection management
- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Transaction manager setup
- [Java Concurrency](/en/learn/software-engineering/programming-languages/java/in-the-field/concurrency-and-parallelism) - Thread safety patterns
