---
title: "NoSQL Databases"
date: 2026-02-04T00:00:00+07:00
draft: false
description: "Working with NoSQL databases: MongoDB (document store) and Redis (key-value cache) with connection pooling"
weight: 1000048
tags: ["golang", "nosql", "mongodb", "redis", "cache", "document-store", "production"]
---

## Why NoSQL Databases Matter

NoSQL databases solve specific problems where SQL databases struggle: flexible schemas (MongoDB), high-performance caching (Redis), time-series data, or graph relationships. Understanding when and how to use NoSQL databases prevents architectural mistakes like using MongoDB for highly relational data or Redis for durable storage.

**Core benefits**:

- **Flexible schemas**: MongoDB adapts to evolving data models
- **High performance**: Redis provides sub-millisecond reads/writes
- **Horizontal scaling**: Sharding built into design
- **Specialized features**: Document queries, pub/sub, TTL, geospatial

**Problem**: Teams often choose NoSQL for wrong reasons (hype, avoiding SQL), leading to complex queries, data inconsistency, or using Redis as primary database (data loss on restart).

**Solution**: Understand each NoSQL type's strengths, use official Go drivers (mongo-driver, go-redis), and choose based on access patterns and consistency requirements.

## MongoDB: Document Store

MongoDB stores JSON-like documents (BSON) with flexible schemas. Best for evolving data models, hierarchical data, and document-based queries.

**Installing mongo-driver**:

```bash
go get go.mongodb.org/mongo-driver/mongo
# => Official MongoDB Go driver
# => Maintained by MongoDB team
```

**Connection pattern**:

```go
package main

import (
    "context"
    // => Standard library for context
    "fmt"
    "go.mongodb.org/mongo-driver/mongo"
    // => MongoDB driver
    "go.mongodb.org/mongo-driver/mongo/options"
    // => MongoDB client options
    "go.mongodb.org/mongo-driver/mongo/readpref"
    // => Read preference configuration
    "time"
)

func connectMongo(uri string) (*mongo.Client, error) {
    // => Returns MongoDB client and error

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    // => ctx with 10-second timeout
    // => cancel function releases resources
    defer cancel()

    clientOptions := options.Client().ApplyURI(uri)
    // => options.Client() creates client options
    // => ApplyURI parses connection string
    // => URI format: mongodb://<username>:<password>@<host>:<port>/<database>

    clientOptions.SetMaxPoolSize(100)
    // => SetMaxPoolSize limits connection pool
    // => Default: 100 (usually sufficient)
    // => Connections created on demand, pooled for reuse

    clientOptions.SetMinPoolSize(10)
    // => SetMinPoolSize keeps minimum connections ready
    // => Reduces latency for new requests
    // => Balance between readiness and resource usage

    client, err := mongo.Connect(ctx, clientOptions)
    // => mongo.Connect establishes connection
    // => client is *mongo.Client (connection pool)
    // => Safe for concurrent use

    if err != nil {
        return nil, fmt.Errorf("connect failed: %w", err)
    }

    if err := client.Ping(ctx, readpref.Primary()); err != nil {
        // => client.Ping verifies connection
        // => readpref.Primary() reads from primary replica
        // => Returns error if MongoDB unreachable
        return nil, fmt.Errorf("ping failed: %w", err)
    }

    return client, nil
}

func main() {
    client, err := connectMongo("mongodb://localhost:27017")
    if err != nil {
        panic(err)
    }
    defer client.Disconnect(context.Background())
    // => Disconnect closes connection pool
    // => Call when application shuts down

    fmt.Println("Connected to MongoDB")
}
```

**Insert document pattern**:

```go
package main

import (
    "context"
    "fmt"
    "go.mongodb.org/mongo-driver/bson"
    // => BSON encoding/decoding
    // => Binary JSON format MongoDB uses
    "go.mongodb.org/mongo-driver/bson/primitive"
    // => Primitive types (ObjectID, DateTime, etc.)
    "go.mongodb.org/mongo-driver/mongo"
    "time"
)

type User struct {
    ID        primitive.ObjectID `bson:"_id,omitempty"`
    // => _id is MongoDB primary key
    // => primitive.ObjectID is 12-byte unique identifier
    // => omitempty: auto-generated if not provided

    Name      string             `bson:"name"`
    // => bson:"name" maps to BSON field
    // => Similar to json tags

    Email     string             `bson:"email"`
    CreatedAt time.Time          `bson:"created_at"`
    Tags      []string           `bson:"tags"`
    // => Arrays stored natively in MongoDB
}

func insertUser(client *mongo.Client, user User) (primitive.ObjectID, error) {
    collection := client.Database("myapp").Collection("users")
    // => Collection is MongoDB table equivalent
    // => Database creates database handle
    // => Collection creates collection handle
    // => Lazy: database/collection created on first write

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    // => 5-second timeout for insert operation
    defer cancel()

    result, err := collection.InsertOne(ctx, user)
    // => InsertOne inserts single document
    // => user serialized to BSON
    // => ID auto-generated if user.ID empty
    // => result contains inserted ID

    if err != nil {
        return primitive.NilObjectID, fmt.Errorf("insert failed: %w", err)
    }

    id := result.InsertedID.(primitive.ObjectID)
    // => result.InsertedID is interface{}
    // => Type assertion to primitive.ObjectID
    // => Contains generated ID

    return id, nil
}

func main() {
    client, _ := connectMongo("mongodb://localhost:27017")
    defer client.Disconnect(context.Background())

    user := User{
        Name:      "Alice",
        Email:     "alice@example.com",
        CreatedAt: time.Now(),
        Tags:      []string{"admin", "verified"},
    }

    id, err := insertUser(client, user)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Inserted user with ID: %s\n", id.Hex())
    // => id.Hex() converts ObjectID to hex string
    // => Output: Inserted user with ID: 507f1f77bcf86cd799439011
}
```

**Query document pattern**:

```go
package main

import (
    "context"
    "fmt"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "time"
)

func findUserByID(client *mongo.Client, id primitive.ObjectID) (*User, error) {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": id}
    // => bson.M is map[string]interface{} for BSON documents
    // => filter matches documents with _id equal to id
    // => MongoDB query syntax: {"_id": ObjectId("...")}

    var user User
    err := collection.FindOne(ctx, filter).Decode(&user)
    // => FindOne executes query expecting single document
    // => Decode unmarshals BSON into user
    // => Returns mongo.ErrNoDocuments if not found

    if err == mongo.ErrNoDocuments {
        // => mongo.ErrNoDocuments indicates no match
        return nil, fmt.Errorf("user not found")
    } else if err != nil {
        return nil, fmt.Errorf("find failed: %w", err)
    }

    return &user, nil
}

func findUsersByTag(client *mongo.Client, tag string) ([]User, error) {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    filter := bson.M{"tags": tag}
    // => Matches documents where tags array contains tag
    // => MongoDB array query: finds if any element matches

    cursor, err := collection.Find(ctx, filter)
    // => Find executes query returning multiple documents
    // => cursor is *mongo.Cursor (iterator over results)
    // => Must close cursor to release resources

    if err != nil {
        return nil, fmt.Errorf("find failed: %w", err)
    }
    defer cursor.Close(ctx)

    var users []User
    if err := cursor.All(ctx, &users); err != nil {
        // => cursor.All decodes all documents into slice
        // => More concise than manual iteration
        // => Loads entire result set into memory
        return nil, fmt.Errorf("decode failed: %w", err)
    }

    return users, nil
}

func findUsersWithPagination(client *mongo.Client, page, pageSize int64) ([]User, error) {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    skip := (page - 1) * pageSize
    // => skip calculates offset
    // => Page 1: skip 0, Page 2: skip pageSize, etc.

    opts := options.Find().SetSkip(skip).SetLimit(pageSize)
    // => options.Find() creates find options
    // => SetSkip skips first N documents
    // => SetLimit limits result count
    // => Chained configuration

    cursor, err := collection.Find(ctx, bson.M{}, opts)
    // => bson.M{} is empty filter (match all)
    // => opts applied to query

    if err != nil {
        return nil, fmt.Errorf("find failed: %w", err)
    }
    defer cursor.Close(ctx)

    var users []User
    if err := cursor.All(ctx, &users); err != nil {
        return nil, fmt.Errorf("decode failed: %w", err)
    }

    return users, nil
}
```

**Update document pattern**:

```go
package main

import (
    "context"
    "fmt"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "time"
)

func updateUserEmail(client *mongo.Client, id primitive.ObjectID, email string) error {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": id}
    // => Match document by ID

    update := bson.M{
        "$set": bson.M{"email": email},
    }
    // => $set operator updates specific fields
    // => Only modifies email field
    // => Other fields unchanged
    // => MongoDB update operators: $set, $inc, $push, $pull, etc.

    result, err := collection.UpdateOne(ctx, filter, update)
    // => UpdateOne updates single matching document
    // => result contains update metadata
    // => Returns error if operation fails

    if err != nil {
        return fmt.Errorf("update failed: %w", err)
    }

    if result.MatchedCount == 0 {
        // => MatchedCount is number of documents matched by filter
        // => 0 means no document found
        return fmt.Errorf("user not found")
    }

    return nil
}

func addTagToUser(client *mongo.Client, id primitive.ObjectID, tag string) error {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": id}
    update := bson.M{
        "$addToSet": bson.M{"tags": tag},
    }
    // => $addToSet adds element to array if not exists
    // => Prevents duplicates
    // => Alternative: $push (allows duplicates)

    _, err := collection.UpdateOne(ctx, filter, update)
    return err
}
```

**Delete document pattern**:

```go
package main

import (
    "context"
    "fmt"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "time"
)

func deleteUser(client *mongo.Client, id primitive.ObjectID) error {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": id}

    result, err := collection.DeleteOne(ctx, filter)
    // => DeleteOne deletes single matching document
    // => result.DeletedCount contains number deleted

    if err != nil {
        return fmt.Errorf("delete failed: %w", err)
    }

    if result.DeletedCount == 0 {
        return fmt.Errorf("user not found")
    }

    return nil
}
```

**Aggregation pipeline pattern**:

```go
package main

import (
    "context"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "time"
)

func getUserCountByTag(client *mongo.Client) ([]bson.M, error) {
    collection := client.Database("myapp").Collection("users")

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    pipeline := []bson.M{
        {"$unwind": "$tags"},
        // => $unwind deconstructs tags array
        // => Creates document per array element
        // => Input: {tags: ["admin", "verified"]}
        // => Output: {tags: "admin"}, {tags: "verified"}

        {"$group": bson.M{
            "_id":   "$tags",
            "count": bson.M{"$sum": 1},
        }},
        // => $group groups by tag
        // => _id is grouping key (tag value)
        // => count accumulates using $sum: 1 (count per group)

        {"$sort": bson.M{"count": -1}},
        // => $sort orders by count descending (-1)
        // => 1 for ascending
    }

    cursor, err := collection.Aggregate(ctx, pipeline)
    // => Aggregate executes aggregation pipeline
    // => pipeline is slice of stages
    // => Processes documents through stages sequentially

    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var results []bson.M
    if err := cursor.All(ctx, &results); err != nil {
        return nil, err
    }

    return results, nil
    // => Results: [{"_id": "admin", "count": 42}, {"_id": "verified", "count": 38}]
}
```

## Redis: Key-Value Cache

Redis is in-memory data structure store used for caching, session storage, pub/sub, and rate limiting. Data volatile unless persistence configured.

**Installing go-redis**:

```bash
go get github.com/go-redis/redis/v8
# => go-redis v8 (most popular Redis Go client)
```

**Connection pattern**:

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
    // => go-redis client
    "time"
)

func connectRedis(addr string) (*redis.Client, error) {
    client := redis.NewClient(&redis.Options{
        Addr:         addr,
        // => Redis server address (host:port)
        // => Default: localhost:6379

        Password:     "",
        // => Password for authentication
        // => Empty if no password

        DB:           0,
        // => Database number (0-15)
        // => Default: 0

        PoolSize:     100,
        // => Connection pool size
        // => Default: 10 * runtime.NumCPU()

        MinIdleConns: 10,
        // => Minimum idle connections
        // => Keeps connections ready

        MaxRetries:   3,
        // => Maximum retry attempts
        // => Retries on network errors
    })

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := client.Ping(ctx).Err(); err != nil {
        // => Ping verifies connection
        // => Returns error if Redis unreachable
        return nil, fmt.Errorf("ping failed: %w", err)
    }

    return client, nil
}

func main() {
    client, err := connectRedis("localhost:6379")
    if err != nil {
        panic(err)
    }
    defer client.Close()
    // => Close connection pool

    fmt.Println("Connected to Redis")
}
```

**Basic key-value operations**:

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
    "time"
)

func setKey(client *redis.Client, key, value string, ttl time.Duration) error {
    ctx := context.Background()

    err := client.Set(ctx, key, value, ttl).Err()
    // => Set stores key-value pair
    // => ttl is expiration duration (0 for no expiration)
    // => Value expires automatically after ttl
    // => Returns error if operation fails

    return err
}

func getKey(client *redis.Client, key string) (string, error) {
    ctx := context.Background()

    val, err := client.Get(ctx, key).Result()
    // => Get retrieves value by key
    // => Result() returns value and error
    // => Returns redis.Nil if key not found

    if err == redis.Nil {
        // => redis.Nil indicates key doesn't exist
        return "", fmt.Errorf("key not found")
    } else if err != nil {
        return "", fmt.Errorf("get failed: %w", err)
    }

    return val, nil
}

func deleteKey(client *redis.Client, key string) error {
    ctx := context.Background()

    err := client.Del(ctx, key).Err()
    // => Del deletes key
    // => Returns error if operation fails
    // => No error if key doesn't exist

    return err
}

func main() {
    client, _ := connectRedis("localhost:6379")
    defer client.Close()

    // Set with 10-minute expiration
    setKey(client, "user:1:name", "Alice", 10*time.Minute)

    val, _ := getKey(client, "user:1:name")
    fmt.Printf("Value: %s\n", val)
    // => Output: Value: Alice

    deleteKey(client, "user:1:name")
}
```

**Caching pattern with fallback**:

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/go-redis/redis/v8"
    "time"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func getUserWithCache(client *redis.Client, id int, fetchFromDB func(int) (*User, error)) (*User, error) {
    // => Cache-aside pattern
    // => Check cache first, fallback to database

    ctx := context.Background()
    cacheKey := fmt.Sprintf("user:%d", id)
    // => Cache key pattern: resource:id

    cached, err := client.Get(ctx, cacheKey).Result()
    // => Try to get from cache

    if err == redis.Nil {
        // => Cache miss: key not in Redis

        user, err := fetchFromDB(id)
        // => Fetch from database
        if err != nil {
            return nil, err
        }

        userData, err := json.Marshal(user)
        // => Serialize user to JSON
        if err != nil {
            return nil, err
        }

        client.Set(ctx, cacheKey, userData, 5*time.Minute)
        // => Store in cache with 5-minute TTL
        // => Ignoring error (cache write failure non-critical)

        return user, nil

    } else if err != nil {
        // => Redis error (connection lost, etc.)
        // => Fallback to database (cache failure shouldn't break app)
        return fetchFromDB(id)
    }

    // Cache hit
    var user User
    if err := json.Unmarshal([]byte(cached), &user); err != nil {
        // => Deserialize cached JSON
        // => If unmarshal fails, fallback to database
        return fetchFromDB(id)
    }

    return &user, nil
}
```

**Counter operations**:

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

func incrementCounter(client *redis.Client, key string) (int64, error) {
    ctx := context.Background()

    val, err := client.Incr(ctx, key).Result()
    // => Incr increments key value by 1
    // => Atomic operation (thread-safe)
    // => Creates key with value 1 if not exists
    // => Returns new value

    return val, err
}

func getCounter(client *redis.Client, key string) (int64, error) {
    ctx := context.Background()

    val, err := client.Get(ctx, key).Int64()
    // => Get value as int64
    // => Int64() converts string to int64
    // => Returns error if conversion fails

    if err == redis.Nil {
        return 0, nil
        // => Key not found: return 0
    }

    return val, err
}

func main() {
    client, _ := connectRedis("localhost:6379")
    defer client.Close()

    // Increment page views
    views, _ := incrementCounter(client, "page:home:views")
    fmt.Printf("Page views: %d\n", views)
    // => Output: Page views: 1

    views, _ = incrementCounter(client, "page:home:views")
    fmt.Printf("Page views: %d\n", views)
    // => Output: Page views: 2
}
```

**Rate limiting pattern**:

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
    "time"
)

func checkRateLimit(client *redis.Client, userID int, limit int64, window time.Duration) (bool, error) {
    // => Returns true if within rate limit, false if exceeded

    ctx := context.Background()
    key := fmt.Sprintf("ratelimit:user:%d", userID)

    count, err := client.Incr(ctx, key).Result()
    // => Increment request count atomically
    if err != nil {
        return false, err
    }

    if count == 1 {
        // => First request in window
        client.Expire(ctx, key, window)
        // => Set TTL for window duration
        // => Key automatically deleted after window expires
    }

    if count > limit {
        // => Rate limit exceeded
        return false, nil
    }

    return true, nil
}

func main() {
    client, _ := connectRedis("localhost:6379")
    defer client.Close()

    userID := 123
    limit := int64(10)
    window := time.Minute
    // => 10 requests per minute

    for i := 0; i < 12; i++ {
        allowed, _ := checkRateLimit(client, userID, limit, window)
        if allowed {
            fmt.Printf("Request %d: Allowed\n", i+1)
        } else {
            fmt.Printf("Request %d: Rate limit exceeded\n", i+1)
        }
    }
}
```

**Pipeline for batch operations**:

```go
package main

import (
    "context"
    "github.com/go-redis/redis/v8"
)

func batchSet(client *redis.Client, data map[string]string) error {
    ctx := context.Background()

    pipe := client.Pipeline()
    // => Pipeline batches commands
    // => Sends all commands in single network roundtrip
    // => Reduces latency for multiple operations

    for key, value := range data {
        pipe.Set(ctx, key, value, 0)
        // => Queue Set command
        // => Not executed yet
    }

    _, err := pipe.Exec(ctx)
    // => Exec sends all commands to Redis
    // => Executes commands on server
    // => Returns all results

    return err
}
```

## When to Use Each NoSQL Type

**Use MongoDB when**:

- Flexible schema needed (evolving data models)
- Hierarchical/nested data (JSON-like documents)
- Document-based queries (filter, project, aggregate)
- Horizontal scaling needed (sharding built-in)

**Don't use MongoDB when**:

- Highly relational data (many JOINs)
- ACID transactions across collections required
- Complex aggregations across normalized data
- Fixed schema with strong consistency

**Use Redis when**:

- High-performance caching (sub-millisecond reads)
- Session storage (web applications)
- Rate limiting (counters with TTL)
- Pub/sub messaging (real-time notifications)
- Leaderboards (sorted sets)
- Temporary data (TTL expiration)

**Don't use Redis when**:

- Primary data store (data volatile)
- Large datasets (in-memory limitation)
- Complex queries (key-value only)
- Durable storage required (unless persistence configured)

## Trade-offs Comparison

| Aspect                 | MongoDB                           | Redis                                    |
| ---------------------- | --------------------------------- | ---------------------------------------- |
| **Data Model**         | Document (JSON-like)              | Key-value (strings, hashes, lists, sets) |
| **Persistence**        | Disk-based (durable)              | In-memory (volatile by default)          |
| **Query Language**     | Rich (filter, aggregate, index)   | Simple (key-based)                       |
| **Consistency**        | Eventual (configurable)           | Eventual (single-instance: strong)       |
| **Horizontal Scaling** | Sharding built-in                 | Redis Cluster                            |
| **Performance**        | Fast (disk I/O bound)             | Very Fast (memory-bound)                 |
| **Use Cases**          | Primary database, flexible schema | Caching, sessions, counters              |
| **Data Size**          | Large datasets (TB+)              | Limited by memory (GB)                   |
| **Transactions**       | Multi-document (limited)          | Multi-command (MULTI/EXEC)               |

## Best Practices

**MongoDB best practices**:

1. **Index frequently queried fields**: Create indexes on filter/sort fields
2. **Use projections**: Select only needed fields (reduce network transfer)
3. **Avoid $where queries**: Use native operators (much faster)
4. **Design for access patterns**: Structure documents for common queries
5. **Use aggregation pipeline**: For complex transformations
6. **Set appropriate timeout**: Prevent hanging queries
7. **Monitor slow queries**: Log queries >100ms
8. **Use connection pooling**: Configure MinPoolSize/MaxPoolSize

**Redis best practices**:

1. **Use connection pooling**: Reuse connections
2. **Set TTL on keys**: Prevent memory exhaustion
3. **Use pipelines**: Batch multiple operations
4. **Avoid large values**: Keep values <1MB
5. **Use appropriate data structures**: Choose based on access pattern
6. **Monitor memory usage**: Configure maxmemory and eviction policy
7. **Handle cache misses**: Always fallback to primary data store
8. **Use Redis as cache**: Not primary data store (unless persistence enabled)

**General NoSQL best practices**:

1. **Choose based on access patterns**: Not hype or popularity
2. **Use SQL for relational data**: NoSQL not replacement for SQL
3. **Implement proper error handling**: Network failures common
4. **Monitor performance**: Track latency and throughput
5. **Use context for timeouts**: Prevent hanging operations
6. **Test connection failures**: Ensure graceful degradation
7. **Document schema**: Even with flexible schemas
8. **Version data models**: Handle schema evolution
