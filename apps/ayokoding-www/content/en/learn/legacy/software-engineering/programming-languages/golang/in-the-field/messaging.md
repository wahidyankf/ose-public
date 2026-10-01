---
title: "Messaging"
date: 2026-02-04T00:00:00+07:00
draft: false
description: "Asynchronous messaging with NATS (pub/sub), RabbitMQ (work queues), and Kafka (event streaming)"
weight: 1000052
tags: ["golang", "messaging", "nats", "rabbitmq", "kafka", "pubsub", "queue", "production"]
---

## Why Messaging Matters

Messaging systems enable asynchronous communication between services, decoupling producers from consumers. Understanding different messaging patterns (pub/sub, work queues, event streaming) prevents architectural mistakes like using Kafka for simple pub/sub or NATS for durable event logs.

**Core benefits**:

- **Decoupling**: Producers and consumers independent (loose coupling)
- **Asynchronous processing**: Non-blocking operations, better resource utilization
- **Scalability**: Multiple consumers process messages in parallel
- **Resilience**: Messages persisted, retry on failure
- **Event-driven architecture**: React to state changes, build reactive systems

**Problem**: Teams often choose wrong messaging system for use case (Kafka for simple notifications, RabbitMQ for streaming analytics) or misunderstand delivery guarantees (at-most-once vs at-least-once vs exactly-once).

**Solution**: Understand each messaging system's strengths (NATS: lightweight pub/sub, RabbitMQ: work queues and routing, Kafka: durable event logs and streaming), choose based on requirements (latency, durability, ordering).

## Pub/Sub Messaging Pattern

```mermaid
graph LR
    accTitle: Pub/Sub Messaging Pattern
    accDescr: Graph with 11 nodes and 10 connections. Nodes: Publisher (Order Service), Message Broker (NATS/RabbitMQ/ Kafka), Publisher (Payment Service), Subscriber 1 (Email Service), Subscriber 2 (Inventory Service), Subscriber 3 (Analytics Service), Subscriber 4 (Accounting Service), Email System, Inventory DB, Analytics DB, Accounting DB. Connections: Publisher (Order Service) to Message Broker (NATS/RabbitMQ/ Kafka) (Publish: order.created), Publisher (Payment Service) to Message Broker (NATS/RabbitMQ/ Kafka) (Publish: payment.processed), Message Broker (NATS/RabbitMQ/ Kafka) to Subscriber 1 (Email Service) (Subscribe: order.*), Message Broker (NATS/RabbitMQ/ Kafka) to Subscriber 2 (Inventory Service) (Subscribe: order.created), Message Broker (NATS/RabbitMQ/ Kafka) to Subscriber 3 (Analytics Service) (Subscribe: order.*), Message Broker (NATS/RabbitMQ/ Kafka) to Subscriber 4 (Accounting Service) (Subscribe: payment.*), Subscriber 1 (Email Service) to Email System (Send email), Subscriber 2 (Inventory Service) to Inventory DB (Update stock), Subscriber 3 (Analytics Service) to Analytics DB (Track metrics), Subscriber 4 (Accounting Service) to Accounting DB (Record transaction).
    Publisher1["Publisher<br/>(Order Service)"] -->|"Publish:<br/>order.created"| Broker["Message Broker<br/>(NATS/RabbitMQ/<br/>Kafka)"]
    Publisher2["Publisher<br/>(Payment Service)"] -->|"Publish:<br/>payment.processed"| Broker

    Broker -->|"Subscribe:<br/>order.*"| Subscriber1["Subscriber 1<br/>(Email Service)"]
    Broker -->|"Subscribe:<br/>order.created"| Subscriber2["Subscriber 2<br/>(Inventory Service)"]
    Broker -->|"Subscribe:<br/>order.*"| Subscriber3["Subscriber 3<br/>(Analytics Service)"]
    Broker -->|"Subscribe:<br/>payment.*"| Subscriber4["Subscriber 4<br/>(Accounting Service)"]

    Subscriber1 -->|"Send email"| Email["Email System"]
    Subscriber2 -->|"Update stock"| Inventory["Inventory DB"]
    Subscriber3 -->|"Track metrics"| Analytics["Analytics DB"]
    Subscriber4 -->|"Record transaction"| Accounting["Accounting DB"]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Publisher1 pal-0173B2
    class Publisher2 pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class Broker pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Subscriber1 pal-029E73
    class Subscriber2 pal-029E73
    class Subscriber3 pal-029E73
    class Subscriber4 pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class Email pal-CC78BC
    class Inventory pal-CC78BC
    class Analytics pal-CC78BC
    class Accounting pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Pub/Sub pattern**:

- **Publishers**: Produce events without knowing consumers (Order Service, Payment Service)
- **Message Broker**: Routes messages to interested subscribers (subject/topic-based)
- **Subscribers**: Subscribe to patterns (order.\*, payment.\*) and receive matching events
- **Decoupling**: Publishers don't know subscribers, subscribers don't know publishers
- **Fan-out**: Single event delivered to multiple subscribers (Email, Inventory, Analytics)
- **Asynchronous**: Publishers don't wait for subscriber processing (non-blocking)

## NATS: Lightweight Pub/Sub

NATS is high-performance, cloud-native messaging system emphasizing simplicity and speed. Best for fire-and-forget pub/sub, service discovery, and request-reply patterns.

**Installing NATS client**:

```bash
go get github.com/nats-io/nats.go
# => Official NATS Go client
# => Simple, idiomatic Go API
```

**Basic pub/sub pattern**:

```go
package main

import (
    "fmt"
    "github.com/nats-io/nats.go"
    // => NATS Go client
    "log"
    "time"
)

func publishMessages(nc *nats.Conn) {
    // => Publishes messages to subject

    subject := "orders.created"
    // => subject is message topic
    // => Hierarchical: orders.created, orders.updated, users.created
    // => Subscribers use subject patterns

    for i := 1; i <= 5; i++ {
        message := fmt.Sprintf("Order %d created", i)

        if err := nc.Publish(subject, []byte(message)); err != nil {
            // => nc.Publish sends message to subject
            // => subject is destination
            // => []byte(message) is payload (binary)
            // => Fire-and-forget (no acknowledgment by default)
            // => Returns error if connection broken
            log.Printf("Publish failed: %v", err)
            continue
        }

        log.Printf("Published: %s", message)
        time.Sleep(500 * time.Millisecond)
        // => Wait between messages
    }
}

func subscribeMessages(nc *nats.Conn) {
    // => Subscribes to subject and processes messages

    subject := "orders.created"

    sub, err := nc.Subscribe(subject, func(msg *nats.Msg) {
        // => nc.Subscribe registers callback for subject
        // => Callback invoked when message arrives
        // => msg.Data is message payload ([]byte)
        // => Runs in separate goroutine per message

        log.Printf("Received: %s", string(msg.Data))
        // => msg.Data is payload bytes
        // => Convert to string for logging
    })

    if err != nil {
        log.Fatalf("Subscribe failed: %v", err)
    }
    defer sub.Unsubscribe()
    // => Unsubscribe stops receiving messages
    // => Releases resources

    // Keep subscription active
    time.Sleep(10 * time.Second)
}

func main() {
    nc, err := nats.Connect(nats.DefaultURL)
    // => nats.Connect establishes connection to NATS server
    // => nats.DefaultURL is nats://localhost:4222
    // => nc is *nats.Conn (connection handle)
    // => Safe for concurrent use

    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer nc.Close()
    // => Close connection when done

    // Start subscriber in goroutine
    go subscribeMessages(nc)

    // Wait for subscriber to start
    time.Sleep(time.Second)

    // Publish messages
    publishMessages(nc)

    // Wait for messages to be processed
    time.Sleep(2 * time.Second)
}
```

**Queue groups (work queue pattern)**:

```go
func subscribeQueue(nc *nats.Conn, workerID int) {
    // => Queue subscription: only one subscriber in group receives message

    subject := "orders.process"
    queueGroup := "order-workers"
    // => queueGroup is worker group name
    // => NATS distributes messages across group members
    // => Each message delivered to one worker (load balancing)

    sub, err := nc.QueueSubscribe(subject, queueGroup, func(msg *nats.Msg) {
        // => QueueSubscribe joins queue group
        // => Only one subscriber in group receives message
        // => Automatic load balancing

        log.Printf("Worker %d processing: %s", workerID, string(msg.Data))
        time.Sleep(2 * time.Second)
        // => Simulate work
        log.Printf("Worker %d finished", workerID)
    })

    if err != nil {
        log.Fatalf("QueueSubscribe failed: %v", err)
    }
    defer sub.Unsubscribe()

    select {}
    // => Block forever (keep worker running)
}

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    // Start 3 workers
    for i := 1; i <= 3; i++ {
        go subscribeQueue(nc, i)
    }

    time.Sleep(time.Second)

    // Publish 10 messages (distributed across workers)
    for i := 1; i <= 10; i++ {
        msg := fmt.Sprintf("Order %d", i)
        nc.Publish("orders.process", []byte(msg))
    }

    time.Sleep(30 * time.Second)
}
```

**Request-reply pattern**:

```go
func replyServer(nc *nats.Conn) {
    // => Request-reply server: responds to requests

    subject := "user.info"

    sub, err := nc.Subscribe(subject, func(msg *nats.Msg) {
        // => Subscribe to requests

        userID := string(msg.Data)
        // => msg.Data is request payload

        response := fmt.Sprintf("User info for %s: Alice", userID)

        msg.Respond([]byte(response))
        // => msg.Respond sends response back to requester
        // => Response delivered to reply subject
        // => Requester receives response
    })

    if err != nil {
        log.Fatalf("Subscribe failed: %v", err)
    }
    defer sub.Unsubscribe()

    select {}
}

func requestClient(nc *nats.Conn) {
    subject := "user.info"
    request := []byte("123")

    msg, err := nc.Request(subject, request, 2*time.Second)
    // => nc.Request sends request and waits for response
    // => request is payload
    // => 2*time.Second is timeout
    // => msg is response message
    // => Returns error if timeout or no response

    if err != nil {
        log.Fatalf("Request failed: %v", err)
    }

    log.Printf("Response: %s", string(msg.Data))
    // => msg.Data is response payload
}
```

## RabbitMQ: Feature-Rich Message Broker

RabbitMQ is message broker with advanced routing, persistence, and delivery guarantees. Best for work queues, task distribution, and complex routing patterns.

**Installing RabbitMQ client**:

```bash
go get github.com/rabbitmq/amqp091-go
# => Official RabbitMQ Go client (AMQP 0.9.1)
```

**Basic queue pattern**:

```go
package main

import (
    "fmt"
    amqp "github.com/rabbitmq/amqp091-go"
    // => RabbitMQ AMQP client
    "log"
    "time"
)

func connectRabbitMQ(url string) (*amqp.Connection, *amqp.Channel, error) {
    // => Establishes connection and creates channel

    conn, err := amqp.Dial(url)
    // => amqp.Dial connects to RabbitMQ
    // => url format: amqp://user:password@host:port/vhost
    // => Default: amqp://guest:guest@localhost:5672/

    if err != nil {
        return nil, nil, fmt.Errorf("dial failed: %w", err)
    }

    ch, err := conn.Channel()
    // => conn.Channel creates channel
    // => Channel is lightweight connection for operations
    // => Multiple channels per connection
    // => Not thread-safe (use one per goroutine or protect with mutex)

    if err != nil {
        conn.Close()
        return nil, nil, fmt.Errorf("channel failed: %w", err)
    }

    return conn, ch, nil
}

func publishToQueue(ch *amqp.Channel, queueName, message string) error {
    // => Publishes message to queue

    _, err := ch.QueueDeclare(
        queueName,
        // => Queue name
        true,
        // => durable: queue survives broker restart
        false,
        // => autoDelete: queue deleted when unused
        false,
        // => exclusive: queue used by only this connection
        false,
        // => noWait: don't wait for confirmation
        nil,
        // => args: additional arguments
    )
    // => QueueDeclare creates queue if not exists
    // => Idempotent: safe to call multiple times

    if err != nil {
        return fmt.Errorf("queue declare failed: %w", err)
    }

    err = ch.Publish(
        "",
        // => exchange: "" for default exchange (direct to queue)
        queueName,
        // => routing key: queue name for default exchange
        false,
        // => mandatory: return message if unroutable
        false,
        // => immediate: return message if no consumers (deprecated)
        amqp.Publishing{
            DeliveryMode: amqp.Persistent,
            // => Persistent: message survives broker restart
            // => Transient: message lost on restart
            ContentType:  "text/plain",
            Body:         []byte(message),
            // => Body is message payload
        },
    )

    if err != nil {
        return fmt.Errorf("publish failed: %w", err)
    }

    log.Printf("Published: %s", message)
    return nil
}

func consumeFromQueue(ch *amqp.Channel, queueName string) error {
    // => Consumes messages from queue

    _, err := ch.QueueDeclare(queueName, true, false, false, false, nil)
    if err != nil {
        return err
    }

    msgs, err := ch.Consume(
        queueName,
        // => Queue name
        "",
        // => consumer: consumer tag (empty for auto-generated)
        false,
        // => autoAck: false requires manual acknowledgment
        // => true: auto-acknowledge (at-most-once delivery)
        // => false: manual ack (at-least-once delivery)
        false,
        // => exclusive: only this consumer can access queue
        false,
        // => noLocal: don't deliver to same connection
        false,
        // => noWait: don't wait for confirmation
        nil,
        // => args: additional arguments
    )
    // => ch.Consume starts consuming messages
    // => Returns channel of amqp.Delivery
    // => Messages received asynchronously

    if err != nil {
        return fmt.Errorf("consume failed: %w", err)
    }

    go func() {
        for msg := range msgs {
            // => Iterate over message channel
            // => msg is amqp.Delivery

            log.Printf("Received: %s", string(msg.Body))
            // => msg.Body is payload

            // Simulate processing
            time.Sleep(2 * time.Second)

            msg.Ack(false)
            // => msg.Ack acknowledges message
            // => false: acknowledge only this message
            // => true: acknowledge this and all previous messages
            // => CRITICAL: must acknowledge or reject, else memory leak

            log.Println("Processed")
        }
    }()

    return nil
}

func main() {
    conn, ch, err := connectRabbitMQ("amqp://guest:guest@localhost:5672/")
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()
    defer ch.Close()

    queueName := "tasks"

    // Start consumer
    if err := consumeFromQueue(ch, queueName); err != nil {
        log.Fatal(err)
    }

    time.Sleep(time.Second)

    // Publish messages
    for i := 1; i <= 5; i++ {
        message := fmt.Sprintf("Task %d", i)
        publishToQueue(ch, queueName, message)
        time.Sleep(500 * time.Millisecond)
    }

    time.Sleep(15 * time.Second)
}
```

**Pub/sub with exchanges**:

```go
func publishToExchange(ch *amqp.Channel, exchangeName, routingKey, message string) error {
    // => Publishes message to exchange with routing key

    err := ch.ExchangeDeclare(
        exchangeName,
        // => Exchange name
        "fanout",
        // => Exchange type: fanout (broadcast to all queues)
        // => Other types: direct (routing key match), topic (pattern match), headers (header match)
        true,
        // => durable: exchange survives restart
        false,
        // => autoDelete: exchange deleted when unused
        false,
        // => internal: exchange not directly publishable
        false,
        // => noWait: don't wait for confirmation
        nil,
    )

    if err != nil {
        return err
    }

    err = ch.Publish(
        exchangeName,
        // => Exchange name (not empty like queue example)
        routingKey,
        // => Routing key (ignored for fanout exchange)
        false,
        false,
        amqp.Publishing{
            DeliveryMode: amqp.Persistent,
            ContentType:  "text/plain",
            Body:         []byte(message),
        },
    )

    return err
}

func subscribeToExchange(ch *amqp.Channel, exchangeName string, consumerID int) error {
    // => Subscribes to exchange (creates exclusive queue)

    err := ch.ExchangeDeclare(exchangeName, "fanout", true, false, false, false, nil)
    if err != nil {
        return err
    }

    q, err := ch.QueueDeclare(
        "",
        // => Empty name: RabbitMQ generates unique name
        false,
        // => non-durable: queue deleted on restart
        false,
        true,
        // => exclusive: queue deleted when connection closes
        false,
        nil,
    )
    // => Creates temporary exclusive queue for subscriber

    if err != nil {
        return err
    }

    err = ch.QueueBind(
        q.Name,
        // => Queue name
        "",
        // => Routing key (ignored for fanout)
        exchangeName,
        // => Exchange name
        false,
        nil,
    )
    // => QueueBind binds queue to exchange
    // => Messages published to exchange routed to queue

    if err != nil {
        return err
    }

    msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
    // => autoAck: true for simplicity (at-most-once)
    if err != nil {
        return err
    }

    go func() {
        for msg := range msgs {
            log.Printf("Consumer %d received: %s", consumerID, string(msg.Body))
        }
    }()

    return nil
}
```

## Kafka: Distributed Event Streaming

Kafka is distributed streaming platform for building real-time data pipelines and event-driven architectures. Best for event sourcing, log aggregation, and stream processing.

**Installing Kafka client**:

```bash
go get github.com/confluentinc/confluent-kafka-go/v2/kafka
# => Confluent Kafka Go client (wraps librdkafka)
# => Requires librdkafka installed on system
```

**Producer pattern**:

```go
package main

import (
    "fmt"
    "github.com/confluentinc/confluent-kafka-go/v2/kafka"
    // => Kafka Go client
    "log"
)

func createProducer(bootstrapServers string) (*kafka.Producer, error) {
    // => Creates Kafka producer

    producer, err := kafka.NewProducer(&kafka.ConfigMap{
        "bootstrap.servers": bootstrapServers,
        // => Comma-separated list of broker addresses
        // => Example: "localhost:9092,localhost:9093"

        "acks": "all",
        // => acks: acknowledgment level
        // => "all": wait for all replicas (strongest durability)
        // => "1": wait for leader only (balanced)
        // => "0": no acknowledgment (fastest, weakest)

        "compression.type": "snappy",
        // => Compression algorithm: snappy, gzip, lz4, zstd
        // => Reduces network bandwidth
    })

    if err != nil {
        return nil, fmt.Errorf("producer creation failed: %w", err)
    }

    return producer, nil
}

func produceMessages(producer *kafka.Producer, topic string) {
    // => Produces messages to Kafka topic

    deliveryChan := make(chan kafka.Event)
    // => deliveryChan receives delivery reports

    defer close(deliveryChan)

    for i := 1; i <= 5; i++ {
        message := fmt.Sprintf("Message %d", i)

        err := producer.Produce(&kafka.Message{
            TopicPartition: kafka.TopicPartition{
                Topic:     &topic,
                // => Topic name
                Partition: kafka.PartitionAny,
                // => PartitionAny: let Kafka choose partition
                // => Or specify partition number
            },
            Value: []byte(message),
            // => Value is message payload
            Key:   []byte(fmt.Sprintf("key-%d", i)),
            // => Key used for partitioning (same key → same partition)
            // => Ensures ordering within partition
        }, deliveryChan)
        // => Produce sends message asynchronously
        // => deliveryChan receives delivery report

        if err != nil {
            log.Printf("Produce failed: %v", err)
            continue
        }

        // Wait for delivery report
        e := <-deliveryChan
        // => Receive delivery report

        m := e.(*kafka.Message)
        // => Type assertion to *kafka.Message

        if m.TopicPartition.Error != nil {
            log.Printf("Delivery failed: %v", m.TopicPartition.Error)
        } else {
            log.Printf("Delivered message to %v", m.TopicPartition)
            // => m.TopicPartition contains topic, partition, offset
        }
    }

    producer.Flush(5000)
    // => Flush waits for outstanding messages to be delivered
    // => 5000 ms timeout
    // => CRITICAL: ensures messages sent before shutdown
}

func main() {
    producer, err := createProducer("localhost:9092")
    if err != nil {
        log.Fatal(err)
    }
    defer producer.Close()
    // => Close producer when done

    produceMessages(producer, "orders")
}
```

**Consumer pattern**:

```go
func createConsumer(bootstrapServers, groupID string) (*kafka.Consumer, error) {
    // => Creates Kafka consumer

    consumer, err := kafka.NewConsumer(&kafka.ConfigMap{
        "bootstrap.servers": bootstrapServers,
        "group.id":          groupID,
        // => Consumer group ID
        // => Consumers with same group.id form consumer group
        // => Each partition consumed by one consumer in group
        // => Load balancing and failover automatic

        "auto.offset.reset": "earliest",
        // => Where to start consuming if no offset stored
        // => "earliest": from beginning of topic
        // => "latest": from end (only new messages)

        "enable.auto.commit": false,
        // => Manual offset commit (at-least-once delivery)
        // => true: auto-commit (at-most-once delivery)
    })

    if err != nil {
        return nil, fmt.Errorf("consumer creation failed: %w", err)
    }

    return consumer, nil
}

func consumeMessages(consumer *kafka.Consumer, topics []string) {
    // => Consumes messages from Kafka topics

    err := consumer.SubscribeTopics(topics, nil)
    // => Subscribe to topics
    // => Consumer group handles partition assignment

    if err != nil {
        log.Fatalf("Subscribe failed: %v", err)
    }

    for {
        msg, err := consumer.ReadMessage(-1)
        // => ReadMessage reads next message
        // => -1: block indefinitely until message available
        // => Positive value: timeout in milliseconds

        if err != nil {
            log.Printf("Consumer error: %v", err)
            continue
        }

        log.Printf("Consumed message from %s[%d]@%d: %s",
            *msg.TopicPartition.Topic,
            // => Topic name
            msg.TopicPartition.Partition,
            // => Partition number
            msg.TopicPartition.Offset,
            // => Offset within partition
            string(msg.Value),
            // => Message payload
        )

        // Process message here...

        _, err = consumer.CommitMessage(msg)
        // => CommitMessage commits offset for message
        // => Stores offset in Kafka
        // => Next consumer restart resumes from this offset
        // => CRITICAL: commit after processing succeeds

        if err != nil {
            log.Printf("Commit failed: %v", err)
        }
    }
}

func main() {
    consumer, err := createConsumer("localhost:9092", "order-consumers")
    if err != nil {
        log.Fatal(err)
    }
    defer consumer.Close()

    consumeMessages(consumer, []string{"orders"})
}
```

## When to Use Each Messaging System

**Use NATS when**:

- **Fire-and-forget pub/sub**: No persistence needed
- **Low latency priority**: Sub-millisecond messaging
- **Simple patterns**: Basic pub/sub, request-reply, queue groups
- **Lightweight deployment**: Minimal infrastructure
- **Service discovery**: Dynamic service communication

**Use RabbitMQ when**:

- **Work queues**: Task distribution, job processing
- **Complex routing**: Fanout, topic, header exchanges
- **Delivery guarantees**: At-least-once, message persistence
- **Traditional messaging**: AMQP protocol, enterprise patterns
- **Moderate throughput**: 10K-100K messages/sec

**Use Kafka when**:

- **Event streaming**: Real-time data pipelines
- **Event sourcing**: Durable event log
- **Log aggregation**: Centralized logging
- **High throughput**: 100K+ messages/sec
- **Stream processing**: Real-time analytics, transformations
- **Data replay**: Re-process historical events

## Trade-offs Comparison

| Aspect                 | NATS                    | RabbitMQ                    | Kafka                           |
| ---------------------- | ----------------------- | --------------------------- | ------------------------------- |
| **Delivery Guarantee** | At-most-once (default)  | At-least-once, exactly-once | At-least-once, exactly-once     |
| **Persistence**        | Optional (JetStream)    | Durable queues              | Always (commit log)             |
| **Throughput**         | Very High (1M+ msg/sec) | Moderate (10K-100K msg/sec) | Very High (100K+ msg/sec)       |
| **Latency**            | Very Low (µs)           | Low (ms)                    | Low-Medium (ms)                 |
| **Ordering**           | No guarantee            | Per-queue                   | Per-partition                   |
| **Routing**            | Subject patterns        | Exchanges (fanout, topic)   | Partition key                   |
| **Replay**             | No (JetStream: yes)     | No                          | Yes (from any offset)           |
| **Complexity**         | Simple                  | Medium                      | High                            |
| **Use Case**           | Lightweight pub/sub     | Work queues, task routing   | Event streaming, event sourcing |

## Best Practices

**NATS best practices**:

1. **Use subject hierarchies**: Organize subjects (orders.created, orders.updated)
2. **Use queue groups**: For load balancing (work queues)
3. **Set connection options**: Reconnect, timeout configurations
4. **Handle disconnections**: Implement reconnect logic
5. **Use JetStream**: For persistence and delivery guarantees
6. **Monitor connection**: Track dropped messages

**RabbitMQ best practices**:

1. **Always acknowledge messages**: Use manual ack for reliability
2. **Set prefetch count**: Limit unacknowledged messages per consumer
3. **Use durable queues**: For message persistence
4. **Handle connection failures**: Implement reconnect logic
5. **Reject bad messages**: Use Nack or Reject to avoid poison messages
6. **Monitor queue depth**: Prevent memory exhaustion
7. **Use dead letter exchanges**: For failed message handling

**Kafka best practices**:

1. **Commit offsets after processing**: Ensure at-least-once delivery
2. **Use consumer groups**: For parallel processing and failover
3. **Set appropriate retention**: Balance storage and data availability
4. **Partition by key**: Ensure ordering within partition
5. **Monitor lag**: Track consumer lag (messages behind)
6. **Handle rebalancing**: Implement graceful shutdown
7. **Use idempotent producers**: Prevent duplicate messages
8. **Tune batch size**: Balance latency and throughput

**General messaging best practices**:

1. **Implement retry logic**: With exponential backoff
2. **Handle poison messages**: Dead letter queues or error topics
3. **Monitor message flow**: Track throughput, latency, errors
4. **Use structured messages**: JSON or Protobuf (not plain strings)
5. **Version message schemas**: Plan for evolution
6. **Test failure scenarios**: Network failures, broker restarts
7. **Document message contracts**: Producer/consumer agreements
8. **Implement graceful shutdown**: Flush pending messages
