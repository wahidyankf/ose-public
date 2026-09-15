namespace OrganicleverBe.Contexts.Messaging

open System.Diagnostics.CodeAnalysis
open System.Text
open System.Threading.Tasks
open NATS.Client.Core
open NATS.Client.JetStream
open NATS.Client.JetStream.Models
open OrganicleverBe.Contexts.Messaging.Domain

/// Infrastructure adapter for the messaging bounded context: the JetStream
/// durable publish/consume/ack demo proving at-least-once delivery at startup.
module Infrastructure =

    type JetStreamDemoPorts =
        { EnsureStream: unit -> Task
          EnsureConsumer: unit -> Task
          Publish: unit -> Task
          ReceiveAndAcknowledge: unit -> Task<bool> }

    /// JetStream stream name for the demo.
    [<Literal>]
    let StreamName = "ORGANICLEVER_MESSAGING_DEMO"

    /// NATS subject for demo messages.
    [<Literal>]
    let Subject = "organiclever.messaging.demo"

    /// Durable consumer name for the demo.
    [<Literal>]
    let ConsumerName = "organiclever-messaging-demo"

    /// Runs the JetStream durable demo against a connected NATS client: create or
    /// get the stream and durable consumer, publish one demo message, then fetch
    /// and acknowledge it. Returns the outcome.
    let runDemoWith (ports: JetStreamDemoPorts) : Task<JetStreamDemoOutcome> =
        task {
            try
                do! ports.EnsureStream()
                do! ports.EnsureConsumer()
                do! ports.Publish()
                let! acked = ports.ReceiveAndAcknowledge()

                if acked then
                    return DeliveredAndAcked
                else
                    return Failed "no message delivered"
            with ex ->
                return Failed ex.Message
        }

    [<ExcludeFromCodeCoverage(Justification = "Requires a live NATS JetStream broker; e2e-tested by organiclever-be-e2e")>]
    let runDemo (conn: NatsConnection) : Task<JetStreamDemoOutcome> =
        let js = NatsJSContext(conn :> INatsConnection)
        let mutable consumer: INatsJSConsumer option = None

        let ports =
            { EnsureStream =
                fun () ->
                    task {
                        let config = StreamConfig(name = StreamName, subjects = [| Subject |])
                        let! _ = js.CreateStreamAsync(config)
                        return ()
                    }
              EnsureConsumer =
                fun () ->
                    task {
                        let! created =
                            js.CreateOrUpdateConsumerAsync(StreamName, ConsumerConfig(ConsumerName))

                        consumer <- Some created
                    }
              Publish =
                fun () ->
                    task {
                        let! _ = js.PublishAsync<byte[]>(Subject, Encoding.UTF8.GetBytes("demo message"))
                        return ()
                    }
              ReceiveAndAcknowledge =
                fun () ->
                    task {
                        let messages = consumer.Value.FetchAsync<byte[]>(NatsJSFetchOpts(MaxMsgs = 1))
                        let enumerator = messages.GetAsyncEnumerator()
                        let! hasNext = enumerator.MoveNextAsync()

                        if hasNext then
                            do! enumerator.Current.AckAsync()

                        do! enumerator.DisposeAsync()
                        return hasNext
                    } }

        runDemoWith ports
