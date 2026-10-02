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

## The Built-In Approach: A Map Cache

Plain Java already caches: a `ConcurrentHashMap` plus `computeIfAbsent` loads a value once and serves it afterwards.

```java
import java.math.BigDecimal; // => exact decimal money values
import java.util.Map; // => the cache's interface type
import java.util.concurrent.ConcurrentHashMap; // => safe under concurrent requests

public class ManualNisabCache { // => plain Java: no framework, no annotations
    // => thread-safe map keyed by currency code; lives as long as this object
    private final Map<String, BigDecimal> cache = new ConcurrentHashMap<>();
    private int lookups = 0; // => counts how often the expensive path runs

    public BigDecimal nisabFor(String currency) { // => the read path callers use
        // => computeIfAbsent runs the loader only when the key is missing
        return cache.computeIfAbsent(currency, this::loadFromSource); // => cached value or fresh load
    }

    // => every write path must remember to call this; nothing does it for you
    public void evictAll() {
        cache.clear(); // => manual invalidation after the source changes
    }

    // => the slow call the cache exists to avoid
    private BigDecimal loadFromSource(String currency) {
        lookups++; // => stands in for a database or HTTP call
        return new BigDecimal("85").multiply(goldPricePerGram(currency)); // => 85 g of gold
    }

    // => demo prices only; a real service reads them from a source
    private BigDecimal goldPricePerGram(String currency) {
        return "USD".equals(currency) ? new BigDecimal("100") : new BigDecimal("1500000"); // => fixed demo prices
    }

    // => runs the cache through load, hit, evict, and reload
    public static void main(String[] args) {
        ManualNisabCache service = new ManualNisabCache(); // => empty cache
        System.out.println(service.nisabFor("USD")); // => 8500 (loaded)
        System.out.println(service.nisabFor("USD")); // => 8500 (cached, no reload)
        System.out.println(service.lookups); // => 1
        service.evictAll(); // => cache emptied
        System.out.println(service.nisabFor("USD")); // => 8500 (loaded again)
        System.out.println(service.lookups); // => 2
    }
}
```

**Limits of the map**: it never expires entries, grows without bound, needs every write path to call `evictAll()`, and
each application instance holds its own copy. Those limits are what the framework approach below addresses.

## The Spring Boot Approach: `@Cacheable`

**Solution**: Spring Boot `@EnableCaching` with Caffeine (local) or Redis (distributed).

```java
@Service // => a Spring bean, so calls pass through the caching proxy
@CacheConfig(cacheNames = "nisab") // => default cache name for every method below
public class NisabService {

    @Cacheable // => caches the return value; key = method parameters
    public BigDecimal getCurrentNisab() { // => no parameters, so one cached entry
        // => expensive calculation or database query
        // => runs only on a cache miss
        return calculateFromGoldPrice(); // => called once, then served from the cache
    }

    @Cacheable(key = "#currency") // => one entry per currency
    public BigDecimal getNisabForCurrency(String currency) { // => cached per argument
        return convertNisab(getCurrentNisab(), currency); // => self-call bypasses the proxy
    }

    @CacheEvict(allEntries = true) // => clears the whole "nisab" cache
    public void updateNisab(BigDecimal newValue) { // => the write path
        // => update the database, then the annotation clears the cache
        nisabRepository.save(newValue); // => source of truth changes first
    }

    @CachePut(key = "#currency") // => always runs, then stores the result
    public BigDecimal refreshNisab(String currency) { // => forced refresh for one key
        return fetchLatestFromSource(currency); // => the new value replaces the cached one
    }
}
```

**Configuration (Caffeine, local)**:

```yaml
spring: # => Spring Boot's own configuration namespace
  cache: # => properties read by the cache auto-configuration
    type: caffeine # => local in-memory cache per instance
    caffeine: # => Caffeine-specific settings
      spec: maximumSize=1000,expireAfterWrite=10m # => bounded size and a TTL the map lacked
      # => 1000 entries, 10 minute TTL
```

**Configuration (Redis, distributed)**:

```yaml
spring: # => Spring Boot's own configuration namespace
  cache: # => cache abstraction settings
    type: redis # => one cache shared by every instance
    redis: # => Redis cache-manager settings
      time-to-live: 10m # => entries expire after 10 minutes
  data: # => Spring Data connection settings
    redis: # => the Redis server the cache talks to
      host: ${REDIS_HOST} # => from the environment, never hardcoded
      port: ${REDIS_PORT:6379} # => defaults to the standard Redis port
```

## Trade-offs

Keep the plain map when one instance serves the data, the key set is small and fixed, and staleness until restart is
acceptable. Move to Caffeine when you need size bounds and expiry, and to Redis when several instances must see the same
cached values or an eviction must reach all of them.

## Next Steps

- [Multiple Datasources](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/multiple-datasources) - Cache + database
