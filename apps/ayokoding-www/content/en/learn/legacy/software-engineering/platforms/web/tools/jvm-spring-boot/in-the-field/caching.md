---
title: "Caching"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 1000044
description: "Manual Map caching → auto-configured Caffeine/Redis with @Cacheable in Spring Boot"
tags: ["spring-boot", "in-the-field", "production", "caching", "redis"]
---

## Why Caching Matters

Spring Boot's @Cacheable provides declarative caching, eliminating manual cache management code. In production APIs serving repeated queries (nisab values, exchange rates), method-level caching reduces database calls by 90%—improving response time from 50ms (database) to <1ms (cache) without manual get/put logic.

**Solution**: Spring Boot @EnableCaching with Caffeine (local) or Redis (distributed).

```java
@Service
@CacheConfig(cacheNames = "nisab")  // => Default cache name
public class NisabService {

    @Cacheable  // => Caches return value, key = method parameters
    public BigDecimal getCurrentNisab() {
        // => Expensive calculation or database query
        // => Only executed if not in cache
        return calculateFromGoldPrice();  // => Called once, then cached
    }

    @Cacheable(key = "#currency")  // => Custom cache key
    public BigDecimal getNisabForCurrency(String currency) {
        return convertNisab(getCurrentNisab(), currency);
    }

    @CacheEvict(allEntries = true)  // => Clears cache
    public void updateNisab(BigDecimal newValue) {
        // => Update database, then clear cache
        nisabRepository.save(newValue);
    }

    @CachePut(key = "#currency")  // => Always execute, update cache
    public BigDecimal refreshNisab(String currency) {
        return fetchLatestFromSource(currency);
    }
}
```

**Configuration**:

```yaml
spring:
  cache:
    type: caffeine # => Local in-memory cache
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=10m
      # => 1000 entries, 10 minute TTL
```

**Redis for distributed caching**:

```yaml
spring:
  cache:
    type: redis
  redis:
    host: redis.internal.example
    port: 6379
  cache:
    redis:
      time-to-live: 600000  # => 10 minutes in milliseconds
```

## Next Steps

- [Multiple Datasources](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/multiple-datasources) - Cache + database
