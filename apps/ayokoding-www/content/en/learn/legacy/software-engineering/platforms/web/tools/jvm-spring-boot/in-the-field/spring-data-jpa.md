---
title: "Spring Data Jpa"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 1000040
description: "Manual EntityManagerFactory configuration → auto-configured Spring Data JPA with repository interfaces"
tags: ["spring-boot", "in-the-field", "production", "jpa", "spring-data"]
---

## Why Spring Data JPA Matters

Spring Data JPA eliminates manual EntityManager code by generating repository implementations from interfaces. In production systems with 50+ domain entities, manual JPQL queries require 1000+ lines of boilerplate DAO code—Spring Data JPA reduces this to interface declarations with method name query derivation, enabling 90% less code while maintaining type safety.

**Problem**: Manual JPA requires EntityManager injection and JPQL for every database operation.

**Solution**: Spring Data JPA auto-generates repository implementations from interfaces with query derivation.

## Manual JPA Repository

```java
@Repository
public class ZakatDonationRepository {
    @PersistenceContext
    private EntityManager entityManager;  // => Manual injection

    public Optional<ZakatDonation> findById(Long id) {
        // => Manual JPQL query
        ZakatDonation donation = entityManager.find(ZakatDonation.class, id);
        return Optional.ofNullable(donation);
    }

    public List<ZakatDonation> findByDonorName(String name) {
        // => Type-unsafe string query
        return entityManager
            .createQuery("SELECT d FROM ZakatDonation d WHERE d.donorName = :name",
                        ZakatDonation.class)
            .setParameter("name", name)
            .getResultList();
    }

    public ZakatDonation save(ZakatDonation donation) {
        if (donation.getId() == null) {
            entityManager.persist(donation);  // => Insert
            return donation;
        } else {
            return entityManager.merge(donation);  // => Update
        }
    }
}
```

**Limitations**: Boilerplate for CRUD, type-unsafe queries, manual persist/merge logic.

## Spring Data JPA Repository

```java
@Repository
public interface ZakatDonationRepository extends JpaRepository<ZakatDonation, Long> {
    // => Spring Data generates implementation automatically
    // => Inherits: findById, findAll, save, delete, count

    List<ZakatDonation> findByDonorName(String donorName);
    // => Method name parsed: findBy + DonorName → WHERE donorName = ?
    // => Spring Data generates JPQL automatically

    @Query("SELECT d FROM ZakatDonation d WHERE d.amount >= :minAmount")
    // => Custom JPQL query (type-checked at compile time with IDE support)
    List<ZakatDonation> findLargeDonations(@Param("minAmount") BigDecimal minAmount);

    @Query(value = "SELECT * FROM zakat_donations WHERE YEAR(created_at) = ?1",
           nativeQuery = true)
    // => Native SQL when JPQL insufficient
    List<ZakatDonation> findByYear(int year);
}
```

**What Spring Data JPA provides**:

- Auto-generated CRUD methods (save, findById, findAll, delete)
- Query derivation from method names (findBy*, countBy*, existsBy\*)
- Pagination and sorting (Page<T>, Sort)
- Custom queries via @Query annotation
- Specification API for dynamic queries
- Auditing (@CreatedDate, @LastModifiedDate)

## Query Derivation Examples

```java
public interface DonationRepository extends JpaRepository<ZakatDonation, Long> {

    // => WHERE donorName = ? AND amount > ?
    List<ZakatDonation> findByDonorNameAndAmountGreaterThan(
        String name, BigDecimal amount);

    // => WHERE createdAt BETWEEN ? AND ?
    List<ZakatDonation> findByCreatedAtBetween(LocalDate start, LocalDate end);

    // => WHERE status IN (?, ?, ?)
    List<ZakatDonation> findByStatusIn(List<DonationStatus> statuses);

    // => ORDER BY amount DESC
    List<ZakatDonation> findTop10ByOrderByAmountDesc();

    // => EXISTS (SELECT 1 FROM ...)
    boolean existsByDonorEmailAndStatus(String email, DonationStatus status);

    // => COUNT(*) WHERE ...
    long countByStatus(DonationStatus status);
}
```

## Pagination and Sorting

```java
@RestController
@RequestMapping("/api/donations")
public class DonationController {

    @GetMapping
    public Page<DonationResponse> getDonations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {

        // => Parse sort parameter: "createdAt,desc" → Sort.by("createdAt").descending()
        Sort sortObj = Sort.by(
            sort[1].equals("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
            sort[0]
        );

        // => Pageable: page number, size, sort
        Pageable pageable = PageRequest.of(page, size, sortObj);

        // => Spring Data executes: SELECT ... LIMIT ? OFFSET ?
        Page<ZakatDonation> donations = repository.findAll(pageable);

        // => Return: content, totalElements, totalPages, number, size
        return donations.map(this::toResponse);
    }
}
```

**Response structure**:

```json
{
  "content": [{ "id": 1, "amount": 1000 }],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 150,
  "totalPages": 8,
  "last": false,
  "first": true
}
```

## Production Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/zakat_db
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20 # => Connection pool

  jpa:
    hibernate:
      ddl-auto: validate # => Production: validate only (no auto-DDL)
    properties:
      hibernate:
        jdbc:
          batch_size: 20 # => Batch inserts (performance)
        order_inserts: true # => Order for batching
        order_updates: true
    open-in-view: false # => Disable OSIV (anti-pattern in production)
```

**Trade-offs**: Spring Data covers 95% queries. Native SQL + JDBC for complex reports (performance-critical).

## Next Steps

- [Transaction Management](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/transaction-management) - @Transactional patterns
- [Database Initialization](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/database-initialization) - Flyway/Liquibase integration
- [Multiple Datasources](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/multiple-datasources) - Multi-database configuration
