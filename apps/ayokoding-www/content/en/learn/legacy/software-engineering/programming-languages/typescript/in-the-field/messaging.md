---
title: "Messaging"
date: 2026-02-07T00:00:00+07:00
draft: false
description: "Production messaging systems in TypeScript - RabbitMQ (amqplib to amqp-connection-manager), Kafka (kafkajs), Bull (Redis job queues), pub/sub patterns"
weight: 10000021
tags: ["typescript", "messaging", "rabbitmq", "kafka", "bull", "pubsub", "queue", "amqp"]
---

## Why Messaging Systems Matter

Messaging systems enable asynchronous communication between services, decouple producers from consumers, and provide reliable message delivery with persistence, retry, and dead-letter handling. Production messaging requires connection management, graceful shutdown, error handling, and monitoring to prevent message loss and system overload.

**Core Benefits**:

- **Asynchronous processing**: Offload time-consuming tasks (email, image processing)
- **Decoupling**: Producers don't wait for consumers (independent scaling)
- **Load leveling**: Queue absorbs traffic spikes (prevents system overload)
- **Reliability**: Message persistence survives crashes
- **Scalability**: Distribute work across multiple consumers
- **Event-driven architecture**: Services react to events (loosely coupled)

**Problem**: Direct HTTP calls block threads, tight coupling prevents independent deployment, and failures cascade across services.

**Solution**: Use message brokers (RabbitMQ, Kafka) and job queues (Bull) that provide durable message storage, automatic retry, dead-letter queues, and at-least-once delivery guarantees.

## Standard Library First: EventEmitter

Node.js provides EventEmitter for in-process pub/sub without external dependencies.

### Basic Event-Driven Pattern

EventEmitter enables communication between modules via events.

**Pattern**:

```typescript
import { EventEmitter } from "events";
// => Built-in events module
// => In-process event bus

const eventBus = new EventEmitter();
// => Create event emitter instance
// => Central event bus for application

// Event listener (subscriber)
eventBus.on("user.created", (user) => {
  // => Register event listener
  // => Triggered when "user.created" event emitted
  console.log(`User created: ${user.name}`);
  // => Handle event (e.g., send welcome email)
});

eventBus.on("user.created", (user) => {
  // => Multiple listeners for same event
  // => All listeners triggered
  console.log(`Analytics: New user ${user.id}`);
  // => Track user signup in analytics
});

// Event emitter (publisher)
function createUser(name: string, email: string) {
  // => Business logic
  const user = {
    id: Math.random(),
    name,
    email,
    createdAt: new Date(),
  };

  // Save user to database...

  eventBus.emit("user.created", user);
  // => Emit event with user data
  // => All listeners notified immediately
  // => Synchronous execution (blocks until all listeners complete)

  return user;
}

// Usage
const user = createUser("Alice", "alice@example.com");
// => Triggers both listeners
// => Output:
// => User created: Alice
// => Analytics: New user 0.123456

// Error handling
eventBus.on("error", (error) => {
  // => Special "error" event
  // => Catches errors from listeners
  console.error("Event error:", error);
});

eventBus.on("user.created", (user) => {
  // => Listener that throws error
  throw new Error("Listener failed");
});

try {
  createUser("Bob", "bob@example.com");
  // => Error thrown during listener execution
} catch (error) {
  // => Error propagates to caller
  console.error("User creation failed:", error);
}

// Remove listener
const listener = (user: any) => {
  console.log(`User: ${user.name}`);
};

eventBus.on("user.created", listener);
// => Register listener

eventBus.off("user.created", listener);
// => Remove specific listener
// => Must be same function reference

eventBus.removeAllListeners("user.created");
// => Remove all listeners for event

// Once listener (triggered only once)
eventBus.once("app.started", () => {
  // => Listener removed after first trigger
  console.log("Application started");
});

eventBus.emit("app.started");
// => Triggers listener
eventBus.emit("app.started");
// => Does nothing (listener already removed)
```

### Typed EventEmitter

Add TypeScript types for event safety.

**Pattern**:

```typescript
import { EventEmitter } from "events";

// Define event types
interface Events {
  // => Map event names to payload types
  "user.created": { id: number; name: string; email: string };
  "user.updated": { id: number; updates: Partial<{ name: string; email: string }> };
  "user.deleted": { id: number };
  "order.placed": { orderId: string; userId: number; total: number };
}

class TypedEventEmitter extends EventEmitter {
  // => Type-safe EventEmitter wrapper

  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): this {
    // => Type-safe listener registration
    // => K: Event name (must be key of Events)
    // => payload: Type inferred from Events[K]
    return super.on(event, listener);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
    // => Type-safe event emission
    // => Ensures payload matches event type
    return super.emit(event, payload);
  }
}

const eventBus = new TypedEventEmitter();

// Type-safe listener
eventBus.on("user.created", (user) => {
  // => user type inferred as Events["user.created"]
  // => TypeScript knows user has id, name, email
  console.log(user.name);
  // => No type assertion needed
});

// Type-safe emitter
eventBus.emit("user.created", {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
});
// => TypeScript validates payload structure

// Type error caught at compile time
/*
eventBus.emit("user.created", {
  id: 123,
  // name: missing (TypeScript error)
});
*/
```

**Limitations for production**:

- **In-process only**: Events don't cross process boundaries
- **Synchronous execution**: Listeners block event emission
- **No persistence**: Events lost on application crash
- **No delivery guarantee**: If listener fails, event lost
- **No retry logic**: Failed listeners not retried automatically
- **No distributed messaging**: Cannot send events to other servers
- **Memory-based**: Events held in memory (lost on restart)
- **No message ordering**: Multiple emitters can interleave events

**When standard library suffices**:

- Single-process applications (no microservices)
- Simple event notification (in-app events only)
- Learning event-driven patterns
- Minimal external dependencies required

## Production Framework: RabbitMQ with amqplib

RabbitMQ provides distributed message broker with queues, exchanges, and routing.

### Installation and Setup

```bash
npm install amqplib
# => Install AMQP client for RabbitMQ
# => Low-level library (manual connection management)

# Run RabbitMQ (Docker)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
# => RabbitMQ server on port 5672
# => Management UI on http://localhost:15672 (guest/guest)
```

**Basic queue pattern**:

```typescript
import amqp from "amqplib";
// => Import amqplib library

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
// => Connection string
// => Format: amqp://username:password@host:port

async function publishMessage(queue: string, message: any) {
  // => Publish message to queue
  const connection = await amqp.connect(RABBITMQ_URL);
  // => Connect to RabbitMQ server
  // => Creates TCP connection

  const channel = await connection.createChannel();
  // => Create channel (virtual connection)
  // => Channels are lightweight, multiple per connection

  await channel.assertQueue(queue, {
    // => Ensure queue exists
    // => Creates queue if doesn't exist
    durable: true,
    // => Queue survives broker restart
    // => Messages persisted to disk
  });

  channel.sendToQueue(
    queue,
    // => Queue name
    Buffer.from(JSON.stringify(message)),
    // => Message content (Buffer)
    // => JSON-encode object to string, then Buffer
    {
      persistent: true,
      // => Message survives broker restart
      // => Stored on disk
    },
  );
  // => Send message to queue
  // => Message stored in queue until consumed

  console.log(`Published message to ${queue}:`, message);

  await channel.close();
  // => Close channel
  await connection.close();
  // => Close connection
  // => CRITICAL: Always close connections
}

async function consumeMessages(queue: string, handler: (message: any) => Promise<void>) {
  // => Consume messages from queue
  // => handler: Async function to process message

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, { durable: true });

  await channel.prefetch(1);
  // => Prefetch count: Number of unacknowledged messages
  // => 1 = Process one message at a time
  // => Fair dispatch (load balancing across consumers)

  console.log(`Waiting for messages in ${queue}...`);

  channel.consume(
    queue,
    // => Queue to consume from
    async (msg) => {
      // => Message handler callback
      // => msg: Message object or null

      if (!msg) {
        // => Channel closed by broker
        return;
      }

      const content = JSON.parse(msg.content.toString());
      // => Parse message content
      // => Buffer → string → JSON object
      console.log("Received message:", content);

      try {
        await handler(content);
        // => Process message
        // => Async handler function

        channel.ack(msg);
        // => Acknowledge message
        // => Message removed from queue
        // => If not acked, message redelivered
      } catch (error) {
        console.error("Message processing failed:", error);
        channel.nack(msg, false, true);
        // => Negative acknowledgment
        // => First parameter: message
        // => Second parameter: multiple (false = this message only)
        // => Third parameter: requeue (true = return to queue)
        // => Message redelivered to another consumer
      }
    },
    {
      noAck: false,
      // => Manual acknowledgment required
      // => false = Must call ack() or nack()
      // => true = Auto-acknowledge (no delivery guarantee)
    },
  );
}

// Usage
await publishMessage("email-queue", {
  to: "alice@example.com",
  subject: "Welcome",
  body: "Hello Alice",
});
// => Message sent to queue

await consumeMessages("email-queue", async (message) => {
  // => Process email message
  console.log(`Sending email to ${message.to}`);
  // Send email via SMTP...
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // => Simulate async email sending
  console.log("Email sent");
});
// => Consumer waits for messages
```

### Pub/Sub Pattern with Exchanges

Exchanges route messages to multiple queues (fanout, topic, direct).

**Pattern**:

```typescript
// Publisher
async function publishEvent(exchange: string, routingKey: string, event: any) {
  // => Publish event to exchange
  // => Exchange routes to queues based on routing key

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchange, "topic", {
    // => Ensure exchange exists
    // => Type: "topic" (route by pattern)
    // => Other types: "fanout" (broadcast), "direct" (exact match)
    durable: true,
  });

  channel.publish(
    exchange,
    // => Exchange name
    routingKey,
    // => Routing key (e.g., "user.created", "order.shipped")
    Buffer.from(JSON.stringify(event)),
    // => Message content
    { persistent: true },
  );

  console.log(`Published event to ${exchange} (${routingKey}):`, event);

  await channel.close();
  await connection.close();
}

// Subscriber
async function subscribeToEvents(exchange: string, pattern: string, handler: (event: any) => Promise<void>) {
  // => Subscribe to events matching pattern
  // => pattern: Routing key pattern (e.g., "user.*", "order.#")

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchange, "topic", { durable: true });

  const { queue } = await channel.assertQueue("", {
    // => Anonymous queue (random name)
    // => Deleted when consumer disconnects
    exclusive: true,
    // => Queue exclusive to this connection
  });

  await channel.bindQueue(queue, exchange, pattern);
  // => Bind queue to exchange with routing pattern
  // => Messages matching pattern routed to queue
  // => pattern: "user.*" matches "user.created", "user.updated"
  // => pattern: "order.#" matches "order.placed", "order.shipped.tracking"

  console.log(`Subscribed to ${exchange} with pattern ${pattern}`);

  channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      const event = JSON.parse(msg.content.toString());
      console.log(`Received event (${msg.fields.routingKey}):`, event);

      try {
        await handler(event);
        channel.ack(msg);
      } catch (error) {
        console.error("Event processing failed:", error);
        channel.nack(msg, false, false);
        // => Don't requeue (event already processed elsewhere)
      }
    },
    { noAck: false },
  );
}

// Usage
await publishEvent("events", "user.created", {
  userId: 123,
  name: "Alice",
});
// => Publish event to "events" exchange with routing key "user.created"

await subscribeToEvents("events", "user.*", async (event) => {
  // => Subscribe to all user events (user.created, user.updated, user.deleted)
  console.log("User event:", event);
});

await subscribeToEvents("events", "user.created", async (event) => {
  // => Subscribe only to user.created events
  console.log("User created:", event);
});
```

**Production benefits**:

- **Distributed messaging**: Cross-process, cross-server communication
- **Message persistence**: Messages survive broker restarts
- **Delivery guarantee**: At-least-once delivery with ack/nack
- **Dead-letter queues**: Failed messages routed to error queue
- **Flexible routing**: Exchange types (fanout, topic, direct, headers)
- **Load balancing**: Multiple consumers share queue workload

**Trade-offs**:

- **Manual connection management**: Must handle connections, channels
- **Reconnection logic**: Must implement retry on connection loss
- **Complexity**: AMQP protocol and RabbitMQ concepts (exchanges, bindings)

**When to use RabbitMQ**:

- Microservices architecture (inter-service communication)
- Asynchronous processing (email, image processing)
- Event-driven systems (pub/sub patterns)
- Workload distribution (multiple consumers)

## Production Framework: amqp-connection-manager

amqp-connection-manager provides automatic reconnection and channel management for RabbitMQ.

### Installation and Setup

```bash
npm install amqp-connection-manager
# => Install connection manager wrapper
# => Automatic reconnection on failure
```

**Connection management**:

```typescript
import amqp from "amqp-connection-manager";
// => Import connection manager
// => Wraps amqplib with automatic reconnection

const connection = amqp.connect([RABBITMQ_URL]);
// => Create managed connection
// => Automatically reconnects on failure
// => Array of URLs for failover

connection.on("connect", () => {
  // => Connection established event
  console.log("Connected to RabbitMQ");
});

connection.on("disconnect", (err) => {
  // => Connection lost event
  console.error("Disconnected from RabbitMQ:", err.err);
});

connection.on("connectFailed", (err) => {
  // => Connection failed event
  console.error("Connection failed:", err.err);
  // => Will retry automatically
});

// Create channel wrapper
const channelWrapper = connection.createChannel({
  // => Create managed channel
  // => Automatically recreated on connection loss
  json: true,
  // => Automatically JSON-encode/decode messages
  // => No manual Buffer conversion
  setup: async (channel) => {
    // => Channel setup function
    // => Called on channel creation and reconnection
    await channel.assertQueue("tasks", { durable: true });
    // => Ensure queue exists
    // => Re-declared after reconnection
  },
});

// Publish message
await channelWrapper.sendToQueue("tasks", {
  // => Send message to queue
  // => Automatically JSON-encoded
  task: "send-email",
  to: "alice@example.com",
});
// => Message sent, automatic retry on failure

// Consume messages
await channelWrapper.addSetup(async (channel) => {
  // => Add setup function (multiple allowed)
  await channel.consume("tasks", async (msg) => {
    if (!msg) return;

    const task = msg.content;
    // => Already parsed (json: true)
    console.log("Processing task:", task);

    try {
      // Process task...
      await new Promise((resolve) => setTimeout(resolve, 1000));

      channel.ack(msg);
      // => Acknowledge message
    } catch (error) {
      console.error("Task failed:", error);
      channel.nack(msg, false, true);
      // => Requeue failed message
    }
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  // => Handle Ctrl+C
  await channelWrapper.close();
  // => Close channel gracefully
  await connection.close();
  // => Close connection
  console.log("Connection closed");
  process.exit(0);
});
```

**Production benefits**:

- **Automatic reconnection**: Handles connection failures automatically
- **Channel recovery**: Re-creates channels after reconnection
- **Queue/exchange re-declaration**: Re-declares on reconnection
- **JSON encoding**: Automatic JSON serialization/deserialization
- **Simpler API**: Less boilerplate than raw amqplib

**Trade-offs**:

- **External dependency**: Additional library (amqplib wrapper)
- **Less control**: Abstracts reconnection logic

**When to use amqp-connection-manager**:

- Production RabbitMQ applications (always - handles reconnection)
- Long-running consumers (workers, services)
- Network unreliability (automatic retry)

## Production Framework: Kafka with kafkajs

Kafka provides distributed event streaming platform for high-throughput messaging.

### Installation and Setup

```bash
npm install kafkajs
# => Install Kafka client for Node.js

# Run Kafka (Docker)
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  confluentinc/cp-kafka
# => Kafka broker on port 9092
# => Requires Zookeeper for coordination
```

**Basic producer/consumer**:

```typescript
import { Kafka } from "kafkajs";
// => Import kafkajs library

const kafka = new Kafka({
  // => Create Kafka client
  clientId: "my-app",
  // => Client identifier
  // => Used for logging and metrics
  brokers: ["localhost:9092"],
  // => Kafka broker addresses
  // => Multiple brokers for failover
});

// Producer
const producer = kafka.producer();
// => Create producer instance

await producer.connect();
// => Connect to Kafka cluster
console.log("Producer connected");

await producer.send({
  // => Send message to topic
  topic: "user-events",
  // => Topic name (created automatically)
  messages: [
    {
      key: "user-123",
      // => Message key (for partitioning)
      // => Same key always goes to same partition
      value: JSON.stringify({
        // => Message value (string or Buffer)
        userId: 123,
        event: "user.created",
        timestamp: Date.now(),
      }),
    },
  ],
});
console.log("Message sent to Kafka");

await producer.disconnect();
// => Disconnect producer

// Consumer
const consumer = kafka.consumer({
  // => Create consumer instance
  groupId: "my-consumer-group",
  // => Consumer group ID
  // => Consumers in same group share partitions
  // => Each message delivered to one consumer per group
});

await consumer.connect();
// => Connect to Kafka cluster
console.log("Consumer connected");

await consumer.subscribe({
  // => Subscribe to topics
  topic: "user-events",
  // => Topic to consume from
  fromBeginning: false,
  // => Start from latest messages
  // => true = Start from beginning of topic
});

await consumer.run({
  // => Start consuming messages
  eachMessage: async ({ topic, partition, message }) => {
    // => Message handler
    // => topic: Topic name
    // => partition: Partition number (0-N)
    // => message: Message object

    const event = JSON.parse(message.value?.toString() || "{}");
    // => Parse message value
    console.log(`Received message from ${topic} partition ${partition}:`, event);

    // Process message...
    // => Consumer automatically commits offset after processing
    // => Can configure manual commit for at-least-once delivery
  },
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await consumer.disconnect();
  console.log("Consumer disconnected");
  process.exit(0);
});
```

### Producer Patterns

Batch sending and partitioning strategies.

**Pattern**:

```typescript
const producer = kafka.producer({
  // => Producer configuration
  allowAutoTopicCreation: true,
  // => Automatically create topics
  // => Production: Create topics manually with partitions/replication
  transactionalId: "my-transactional-producer",
  // => Enable transactions (exactly-once semantics)
  maxInFlightRequests: 5,
  // => Maximum concurrent requests
  idempotent: true,
  // => Enable idempotent producer
  // => Duplicate messages rejected
});

await producer.connect();

// Batch send
await producer.sendBatch({
  // => Send multiple messages efficiently
  topicMessages: [
    {
      topic: "user-events",
      messages: [
        { key: "user-123", value: JSON.stringify({ event: "created" }) },
        { key: "user-124", value: JSON.stringify({ event: "created" }) },
        { key: "user-125", value: JSON.stringify({ event: "created" }) },
      ],
    },
    {
      topic: "order-events",
      messages: [{ key: "order-1", value: JSON.stringify({ event: "placed" }) }],
    },
  ],
});
// => Send to multiple topics in one request

// Partitioning strategy
await producer.send({
  topic: "user-events",
  messages: [
    {
      key: "user-123",
      // => Key determines partition (hash-based)
      // => Same key always to same partition (ordering guarantee)
      value: JSON.stringify({ event: "created" }),
      partition: 0,
      // => Explicit partition (overrides key-based partitioning)
      headers: {
        // => Message headers (metadata)
        "correlation-id": "abc-123",
        "content-type": "application/json",
      },
    },
  ],
});

// Transactional send (exactly-once semantics)
const transaction = await producer.transaction();
// => Start transaction

try {
  await transaction.send({
    topic: "user-events",
    messages: [{ key: "user-123", value: JSON.stringify({ event: "created" }) }],
  });

  await transaction.send({
    topic: "order-events",
    messages: [{ key: "order-1", value: JSON.stringify({ event: "placed" }) }],
  });

  await transaction.commit();
  // => Commit transaction
  // => Both messages delivered atomically
} catch (error) {
  await transaction.abort();
  // => Rollback transaction
  // => No messages delivered
  throw error;
}
```

### Consumer Groups and Rebalancing

Multiple consumers share topic partitions.

**Pattern**:

```typescript
// Consumer 1 (same group)
const consumer1 = kafka.consumer({ groupId: "email-workers" });
await consumer1.connect();
await consumer1.subscribe({ topic: "email-queue" });

await consumer1.run({
  eachMessage: async ({ message }) => {
    console.log("Consumer 1 processing:", message.value?.toString());
    // => Process message on consumer 1
  },
});

// Consumer 2 (same group)
const consumer2 = kafka.consumer({ groupId: "email-workers" });
await consumer2.connect();
await consumer2.subscribe({ topic: "email-queue" });

await consumer2.run({
  eachMessage: async ({ message }) => {
    console.log("Consumer 2 processing:", message.value?.toString());
    // => Process message on consumer 2
  },
});
// => Consumers in same group share partitions
// => Each message delivered to ONE consumer in group
// => Load balancing across consumers

// Consumer with manual commit (at-least-once delivery)
const consumer = kafka.consumer({
  groupId: "manual-commit-group",
  // => Disable auto-commit for manual control
});

await consumer.connect();
await consumer.subscribe({ topic: "important-events" });

await consumer.run({
  autoCommit: false,
  // => Disable automatic offset commit
  // => Must manually commit after processing
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value?.toString() || "{}");

    try {
      // Process message...
      await processEvent(event);

      // Commit offset after successful processing
      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (Number(message.offset) + 1).toString(),
          // => Commit next offset (current + 1)
          // => Mark message as processed
        },
      ]);
    } catch (error) {
      console.error("Processing failed, message will be redelivered:", error);
      // => Don't commit offset
      // => Consumer restart will redeliver from last committed offset
    }
  },
});
```

**Production benefits**:

- **High throughput**: Millions of messages per second
- **Horizontal scalability**: Add partitions and consumers
- **Message persistence**: Messages retained for configurable duration
- **Consumer groups**: Load balancing and failover
- **Offset management**: Resume from last processed message
- **Exactly-once semantics**: Transactional guarantees

**Trade-offs**:

- **Operational complexity**: Requires Zookeeper, topic configuration
- **Ordering guarantee**: Only within partition (not across partitions)
- **Message size limits**: Default 1MB max message size
- **No request/reply**: Designed for event streaming, not RPC

**When to use Kafka**:

- Event streaming (high-throughput event logs)
- Data pipelines (ETL, real-time analytics)
- Change data capture (database replication)
- Microservices messaging (scale to millions of messages)

## Production Framework: Bull (Redis Job Queues)

Bull provides Redis-based job queues with priority, retries, and scheduling.

### Installation and Setup

```bash
npm install bull
# => Install Bull job queue library

npm install @types/bull
# => TypeScript type definitions

# Requires Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
# => Redis server on port 6379
```

**Basic job queue**:

```typescript
import Bull from "bull";
// => Import Bull library

const emailQueue = new Bull("email", {
  // => Create job queue
  // => Queue name: "email"
  redis: {
    host: "localhost",
    port: 6379,
    // => Redis connection
  },
});
// => Jobs stored in Redis
// => Survives application restarts

// Add job to queue
await emailQueue.add({
  // => Add job with data
  to: "alice@example.com",
  subject: "Welcome",
  body: "Hello Alice",
});
// => Job added to queue
console.log("Email job added to queue");

// Process jobs
emailQueue.process(async (job) => {
  // => Job processor function
  // => job: Job object with data and methods
  console.log("Processing email job:", job.data);

  // Send email...
  await sendEmail(job.data.to, job.data.subject, job.data.body);

  return { sent: true };
  // => Return value stored in job result
});
// => Worker processes jobs from queue

// Job completion event
emailQueue.on("completed", (job, result) => {
  // => Job completed successfully
  console.log(`Job ${job.id} completed:`, result);
});

// Job failure event
emailQueue.on("failed", (job, error) => {
  // => Job failed
  console.log(`Job ${job?.id} failed:`, error.message);
});
```

### Job Options and Retries

Configure job priority, delays, and retry behavior.

**Pattern**:

```typescript
// Add job with options
await emailQueue.add(
  {
    to: "bob@example.com",
    subject: "Important",
    body: "Hello Bob",
  },
  {
    // => Job options
    priority: 1,
    // => Higher priority (lower number = higher priority)
    // => Default: 0 (highest priority)
    // => Jobs processed by priority
    delay: 5000,
    // => Delay job execution by 5 seconds
    // => Job not processed until delay elapsed
    attempts: 3,
    // => Retry up to 3 times on failure
    backoff: {
      type: "exponential",
      // => Exponential backoff: 1s, 2s, 4s, 8s
      // => Alternative: "fixed" (constant delay)
      delay: 1000,
      // => Initial delay: 1 second
    },
    removeOnComplete: true,
    // => Remove job from Redis when completed
    // => Saves memory (jobs accumulate otherwise)
    removeOnFail: false,
    // => Keep failed jobs for debugging
    timeout: 30000,
    // => Job timeout: 30 seconds
    // => Job fails if exceeds timeout
  },
);

// Process with concurrency
emailQueue.process(5, async (job) => {
  // => Process up to 5 jobs concurrently
  // => Default: 1 (serial processing)
  console.log(`Processing job ${job.id}`);

  if (job.attemptsMade > 0) {
    // => Retry attempt
    console.log(`Retry attempt ${job.attemptsMade}`);
  }

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return { processed: true };
});

// Scheduled jobs (cron-like)
await emailQueue.add(
  { type: "newsletter" },
  {
    repeat: {
      cron: "0 9 * * *",
      // => Run daily at 9 AM
      // => Cron syntax: minute hour day month weekday
    },
  },
);
// => Repeating job added to queue

// Job progress tracking
emailQueue.process(async (job) => {
  // => Job with progress updates
  await job.progress(10);
  // => Update progress to 10%
  // => Visible in Bull UI

  // Process step 1...
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await job.progress(50);
  // => Update progress to 50%

  // Process step 2...
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await job.progress(100);
  // => Complete

  return { done: true };
});

// Progress event
emailQueue.on("progress", (job, progress) => {
  // => Job progress updated
  console.log(`Job ${job.id} progress: ${progress}%`);
});
```

### Queue Monitoring and Management

Monitor queue health and manage jobs.

**Pattern**:

```typescript
// Queue metrics
const jobCounts = await emailQueue.getJobCounts();
// => Get job counts by state
console.log(jobCounts);
/*
{
  waiting: 5,    // Waiting to be processed
  active: 2,     // Currently processing
  completed: 10, // Completed successfully
  failed: 1,     // Failed after retries
  delayed: 3,    // Scheduled for future
  paused: 0      // Queue paused
}
*/

// Get jobs by state
const waitingJobs = await emailQueue.getWaiting();
// => Get waiting jobs (Job[])
const activeJobs = await emailQueue.getActive();
// => Get active jobs
const failedJobs = await emailQueue.getFailed();
// => Get failed jobs

// Retry failed jobs
for (const job of failedJobs) {
  await job.retry();
  // => Retry failed job
  // => Job moved back to waiting state
}

// Remove jobs
await emailQueue.clean(24 * 60 * 60 * 1000);
// => Remove completed/failed jobs older than 24 hours
// => Saves Redis memory

// Pause/resume queue
await emailQueue.pause();
// => Pause queue (no new jobs processed)
console.log("Queue paused");

await emailQueue.resume();
// => Resume queue
console.log("Queue resumed");

// Drain queue (remove all waiting jobs)
await emailQueue.drain();
// => Remove all waiting jobs
// => Does not affect active jobs

// Close queue
await emailQueue.close();
// => Close queue gracefully
// => Wait for active jobs to complete
```

**Production benefits**:

- **Redis-backed persistence**: Jobs survive application restarts
- **Automatic retries**: Exponential backoff on failure
- **Priority queues**: High-priority jobs processed first
- **Delayed jobs**: Schedule jobs for future execution
- **Concurrency control**: Limit concurrent job processing
- **Job progress**: Track job completion progress
- **Dead-letter queue**: Failed jobs separated for debugging

**Trade-offs**:

- **Redis dependency**: Requires Redis server
- **Limited throughput**: Lower than Kafka (thousands vs millions/second)
- **Memory-based**: Redis memory limits queue size
- **Single Redis**: Not horizontally scalable without Redis Cluster

**When to use Bull**:

- Background job processing (email, image processing)
- Scheduled tasks (cron jobs, recurring tasks)
- Rate-limited API calls (external API quotas)
- Simple message queues (lower throughput requirements)

## Messaging Pattern Comparison

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
%% All colors are color-blind friendly and meet WCAG AA contrast standards

flowchart TD
    accTitle: Messaging Pattern Comparison
    accDescr: Flowchart with 19 nodes and 21 connections. Nodes: Choose Messaging System, Use Case?, EventEmitter, RabbitMQ, Kafka, Bull Redis, EventEmitter Features, RabbitMQ Features, Kafka Features, Bull Features, ✓ Built-in ✓ Synchronous ✓ Simple API ✗ In-process only ✗ No persistence, ✓ Distributed ✓ Flexible routing ✓ Dead-letter queues ✓ RPC support ✗ Operational complexity, and 7 more. Connections: Choose Messaging System to Use Case?, Use Case? to EventEmitter (In-process events No persistence), Use Case? to RabbitMQ (Distributed queues RPC patterns), Use Case? to Kafka (Event streaming High throughput), Use Case? to Bull Redis (Background jobs Scheduling), EventEmitter to EventEmitter Features, RabbitMQ to RabbitMQ Features, Kafka to Kafka Features, Bull Redis to Bull Features, EventEmitter Features to ✓ Built-in ✓ Synchronous ✓ Simple API ✗ In-process only ✗ No persistence, RabbitMQ Features to ✓ Distributed ✓ Flexible routing ✓ Dead-letter queues ✓ RPC support ✗ Operational complexity, Kafka Features to ✓ High throughput ✓ Log retention ✓ Replay events ✓ Partitioning ✗ Complex setup, and 9 more.
    A[Choose Messaging<br/>System] --> B{Use Case?}

    B -->|In-process events<br/>No persistence| C[EventEmitter]
    B -->|Distributed queues<br/>RPC patterns| D[RabbitMQ]
    B -->|Event streaming<br/>High throughput| E[Kafka]
    B -->|Background jobs<br/>Scheduling| F[Bull Redis]

    C --> C1[EventEmitter<br/>Features]
    D --> D1[RabbitMQ Features]
    E --> E1[Kafka Features]
    F --> F1[Bull Features]

    C1 --> C2[✓ Built-in<br/>✓ Synchronous<br/>✓ Simple API<br/>✗ In-process only<br/>✗ No persistence]

    D1 --> D2[✓ Distributed<br/>✓ Flexible routing<br/>✓ Dead-letter queues<br/>✓ RPC support<br/>✗ Operational<br/>complexity]

    E1 --> E2[✓ High throughput<br/>✓ Log retention<br/>✓ Replay events<br/>✓ Partitioning<br/>✗ Complex setup]

    F1 --> F2[✓ Redis-backed<br/>✓ Priority queues<br/>✓ Scheduling<br/>✓ Retries<br/>✗ Single Redis limit]

    C2 --> G[Use Cases]
    D2 --> G
    E2 --> G
    F2 --> G

    G --> G1[EventEmitter: Module<br/>communication<br/>In-app events]
    G --> G2[RabbitMQ:<br/>Microservices<br/>Task distribution<br/>Pub/Sub]
    G --> G3[Kafka: Event<br/>streaming<br/>Data pipelines<br/>Analytics]
    G --> G4[Bull: Background<br/>jobs<br/>Email/image<br/>processing<br/>Cron tasks]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class D pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-029E73
    class F pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Production Best Practices

### Dead-Letter Queue Pattern

Route failed messages to error queue for debugging.

**Pattern**:

```typescript
// RabbitMQ dead-letter queue
async function setupDeadLetterQueue() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Create dead-letter exchange and queue
  await channel.assertExchange("dlx", "direct", { durable: true });
  // => Dead-letter exchange (DLX)

  await channel.assertQueue("dead-letter-queue", { durable: true });
  // => Dead-letter queue (stores failed messages)

  await channel.bindQueue("dead-letter-queue", "dlx", "");
  // => Bind queue to exchange

  // Create main queue with DLX
  await channel.assertQueue("tasks", {
    durable: true,
    deadLetterExchange: "dlx",
    // => Route rejected messages to DLX
    // => Messages sent to DLX when:
    // => - Message rejected (nack with requeue=false)
    // => - Message TTL expired
    // => - Queue length exceeded
  });

  // Process main queue
  channel.consume("tasks", async (msg) => {
    if (!msg) return;

    const task = JSON.parse(msg.content.toString());

    try {
      await processTask(task);
      channel.ack(msg);
      // => Success, acknowledge
    } catch (error) {
      console.error("Task failed:", error);
      channel.nack(msg, false, false);
      // => Reject without requeue
      // => Message sent to dead-letter queue
    }
  });

  // Monitor dead-letter queue
  channel.consume("dead-letter-queue", async (msg) => {
    if (!msg) return;

    console.error("Dead letter message:", JSON.parse(msg.content.toString()));
    // => Log failed message for debugging
    // => Alert monitoring system
    channel.ack(msg);
  });
}
```

### Graceful Shutdown

Close connections cleanly on application shutdown.

**Pattern**:

```typescript
import { Kafka } from "kafkajs";

const kafka = new Kafka({ clientId: "my-app", brokers: ["localhost:9092"] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "my-group" });

let isShuttingDown = false;

async function gracefulShutdown() {
  // => Graceful shutdown handler
  if (isShuttingDown) {
    // => Already shutting down
    return;
  }
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  // Stop accepting new messages
  await consumer.stop();
  // => Stop consuming (finish processing current message)

  // Wait for in-flight messages
  await new Promise((resolve) => setTimeout(resolve, 5000));
  // => Allow time for message processing to complete

  // Disconnect clients
  await consumer.disconnect();
  // => Disconnect consumer
  await producer.disconnect();
  // => Disconnect producer

  console.log("Shutdown complete");
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGINT", gracefulShutdown);
// => Ctrl+C
process.on("SIGTERM", gracefulShutdown);
// => Kill signal from container orchestrator
```

### Message Idempotency

Ensure message processing is idempotent (safe to process multiple times).

**Pattern**:

```typescript
import { Redis } from "ioredis";

const redis = new Redis();

async function processMessageIdempotent(messageId: string, message: any) {
  // => Process message with idempotency check

  const lockKey = `processing:${messageId}`;
  // => Lock key for this message

  const acquired = await redis.set(lockKey, "locked", "NX", "EX", 300);
  // => Try to acquire lock
  // => NX: Set only if not exists
  // => EX 300: Expire after 5 minutes
  // => Returns "OK" if acquired, null if already locked

  if (!acquired) {
    // => Message already being processed
    console.log(`Message ${messageId} already processed, skipping`);
    return;
  }

  try {
    // Process message...
    await processMessage(message);

    // Mark as processed
    await redis.set(`processed:${messageId}`, "true", "EX", 86400);
    // => Mark processed (24 hour TTL)
  } finally {
    await redis.del(lockKey);
    // => Release lock
  }
}

// Usage with RabbitMQ
channel.consume("tasks", async (msg) => {
  if (!msg) return;

  const messageId = msg.properties.messageId;
  // => Message ID from properties
  // => Set when publishing: { messageId: uuid() }

  const task = JSON.parse(msg.content.toString());

  try {
    await processMessageIdempotent(messageId, task);
    channel.ack(msg);
  } catch (error) {
    console.error("Processing failed:", error);
    channel.nack(msg, false, true);
    // => Requeue for retry
  }
});
```

## Trade-offs and When to Use Each

### EventEmitter

**Use when**:

- Single-process applications (no microservices)
- In-app event notification (module communication)
- Learning event-driven patterns
- Minimal dependencies required

**Avoid when**:

- Multi-process or distributed systems
- Message persistence required
- Network failures need handling

### RabbitMQ

**Use when**:

- Microservices architecture (inter-service messaging)
- Flexible routing (topic exchanges, fanout)
- Request/reply patterns (RPC)
- Dead-letter queues needed

**Avoid when**:

- High throughput required (>100k messages/second)
- Event streaming use case (use Kafka)
- Simple background jobs (use Bull)

### Kafka

**Use when**:

- Event streaming (millions of messages/second)
- Data pipelines (ETL, analytics)
- Event sourcing (replay events)
- High throughput required

**Avoid when**:

- Simple task queues (overkill)
- Request/reply patterns (not designed for RPC)
- Small message volume (<1000/second)

### Bull

**Use when**:

- Background job processing (email, image processing)
- Scheduled tasks (cron jobs)
- Priority queues (high-priority jobs first)
- Simple message queues (moderate throughput)

**Avoid when**:

- Distributed messaging (cross-server)
- High throughput (>10k messages/second)
- Need for complex routing (use RabbitMQ)

## Common Pitfalls

### Pitfall 1: No Message Acknowledgment

**Problem**: Messages lost on consumer failure.

**Solution**: Use manual acknowledgment.

```typescript
// ❌ BAD: Auto-acknowledge
channel.consume(
  "tasks",
  async (msg) => {
    await processTask(msg);
    // => If processing fails, message lost
  },
  { noAck: true },
);

// ✅ GOOD: Manual acknowledgment
channel.consume(
  "tasks",
  async (msg) => {
    try {
      await processTask(msg);
      channel.ack(msg);
      // => Acknowledge after successful processing
    } catch (error) {
      channel.nack(msg, false, true);
      // => Negative acknowledge, requeue
    }
  },
  { noAck: false },
);
```

### Pitfall 2: No Connection Error Handling

**Problem**: Application crashes on connection loss.

**Solution**: Use connection manager with automatic reconnection.

```typescript
// ❌ BAD: No error handling
const connection = await amqp.connect(RABBITMQ_URL);
// => Crashes if connection lost

// ✅ GOOD: Connection manager with reconnection
const connection = amqp.connect([RABBITMQ_URL]);
connection.on("disconnect", (err) => {
  console.error("Disconnected:", err);
  // => Will reconnect automatically
});
```

### Pitfall 3: Processing Non-Idempotent Operations

**Problem**: Duplicate message processing causes issues (double charge, duplicate email).

**Solution**: Implement idempotency checks.

```typescript
// ❌ BAD: Not idempotent
async function processPayment(orderId: string, amount: number) {
  await chargeCard(amount);
  // => If message redelivered, charges card twice
}

// ✅ GOOD: Idempotent with deduplication
async function processPayment(orderId: string, amount: number) {
  const processed = await redis.get(`payment:${orderId}`);
  if (processed) {
    // => Already processed, skip
    return;
  }

  await chargeCard(amount);
  await redis.set(`payment:${orderId}`, "true", "EX", 86400);
  // => Mark as processed
}
```

### Pitfall 4: No Dead-Letter Queue

**Problem**: Failed messages lost or stuck in queue forever.

**Solution**: Configure dead-letter queue for failed messages.

```typescript
// ❌ BAD: No dead-letter queue
await channel.assertQueue("tasks", { durable: true });
// => Failed messages requeued infinitely

// ✅ GOOD: Dead-letter queue configured
await channel.assertQueue("tasks", {
  durable: true,
  deadLetterExchange: "dlx",
  // => Failed messages routed to DLX
});
```

## Summary

Messaging systems enable asynchronous, distributed communication between services. EventEmitter provides in-process events, RabbitMQ offers flexible routing with queues and exchanges, Kafka provides high-throughput event streaming, and Bull manages background jobs with Redis-backed persistence.

**Progression path**:

1. **Learn with EventEmitter**: Understand event-driven patterns
2. **Queue with RabbitMQ**: Distributed task queues and pub/sub
3. **Stream with Kafka**: High-throughput event streaming (advanced)
4. **Schedule with Bull**: Background jobs and cron tasks

**Production checklist**:

- ✅ Manual message acknowledgment (prevent message loss)
- ✅ Automatic reconnection (connection manager)
- ✅ Dead-letter queues (failed message handling)
- ✅ Graceful shutdown (finish processing before exit)
- ✅ Idempotent message processing (deduplication)
- ✅ Message persistence (durable queues)
- ✅ Error handling and retry logic (transient failures)
- ✅ Monitoring and alerting (queue depth, consumer lag)

**Recommended approach**:

- **Microservices messaging**: RabbitMQ with amqp-connection-manager
- **Background jobs**: Bull with Redis
- **Event streaming**: Kafka (high throughput)
- **In-app events**: EventEmitter (simple cases)

Choose messaging system based on use case: RabbitMQ for flexible routing and RPC, Kafka for event streaming and high throughput, Bull for background job processing with scheduling.
