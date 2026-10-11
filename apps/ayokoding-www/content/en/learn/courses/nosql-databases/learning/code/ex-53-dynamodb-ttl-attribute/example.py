"""Example 53: DynamoDB TTL Attribute."""  # => co-24: this file's own purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import time  # => co-24: computes real epoch-second timestamps for the TTL attribute below

from typing import Any  # => co-24: boto3's dynamic resource/client factory has no stubs pinned -- Any is the honest, explicit type

import boto3  # => co-24: the official AWS SDK for Python


def get_local_dynamodb_client() -> Any:  # => co-24: connects to amazon/dynamodb-local, the official local-testing Docker image
    """Return a boto3 DynamoDB client pointed at a local dynamodb-local instance."""  # => documents the contract
    return boto3.client(  # => co-24: same endpoint/credential pattern as prior DynamoDB examples
        "dynamodb",
        endpoint_url="http://localhost:8000",
        region_name="us-east-1",  # => the local dynamodb-local endpoint, no real AWS account needed
        aws_access_key_id="fake",
        aws_secret_access_key="fake",  # => dynamodb-local accepts any credentials
    )  # => closes the boto3.client() call -- returns a low-level DynamoDB client bound to the local endpoint


def setup_ttl_table(client: Any) -> None:  # => co-24: a table with TTL enabled on a Number (epoch-seconds) attribute
    """Create a table and enable TTL on its expires_at Number attribute."""  # => documents the contract, no runtime output
    if "TtlItems" in client.list_tables()["TableNames"]:  # => resets state -- this example is fully self-contained
        client.delete_table(TableName="TtlItems")  # => removes any leftover table from a prior run
        client.get_waiter("table_not_exists").wait(TableName="TtlItems")  # => blocks until the delete genuinely completes
    client.create_table(  # => a minimal, single-partition-key table
        TableName="TtlItems",  # => the table this whole TTL example uses
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],  # => a single partition key, no sort key needed here
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],  # => S == string type, the partition key's type
        ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},  # => local-testing throughput
    )  # => closes the create_table() call -- the table now exists, though not yet necessarily ACTIVE
    client.get_waiter("table_exists").wait(TableName="TtlItems")  # => blocks until the table is genuinely ready
    client.update_time_to_live(  # => co-24: enables TTL, naming WHICH attribute DynamoDB should treat as the expiry epoch
        TableName="TtlItems",
        TimeToLiveSpecification={"Enabled": True, "AttributeName": "expires_at"},  # => co-24: expires_at MUST be a Number, epoch seconds
    )


def main() -> None:  # => entry point -- runs only when this file executes directly, not on import
    client = get_local_dynamodb_client()  # => connects to the local dynamodb-local Docker container
    setup_ttl_table(client)  # => sets up the fresh table with TTL enabled

    ttl_description = client.describe_time_to_live(TableName="TtlItems")["TimeToLiveDescription"]  # => co-24: confirms TTL is genuinely active
    assert ttl_description["TimeToLiveStatus"] == "ENABLED"  # => co-24: the table's TTL configuration itself is confirmed, not assumed
    assert ttl_description["AttributeName"] == "expires_at"  # => confirms the correct attribute is wired up as the expiry clock
    print(f"TTL status: {ttl_description['TimeToLiveStatus']} on attribute '{ttl_description['AttributeName']}'")  # => Output: TTL status: ENABLED on attribute 'expires_at'

    future_epoch = int(time.time()) + 3600  # => co-24: 1 hour in the future -- this item has NOT expired yet
    past_epoch = int(time.time()) - 3600  # => co-24: 1 hour in the PAST -- this item's TTL has already elapsed
    client.put_item(TableName="TtlItems", Item={"id": {"S": "still-fresh"}, "expires_at": {"N": str(future_epoch)}})  # => a NOT-yet-expired item
    client.put_item(TableName="TtlItems", Item={"id": {"S": "already-expired"}, "expires_at": {"N": str(past_epoch)}})  # => an ALREADY-expired item

    still_present = True  # => co-24: polls rather than sleeping a fixed duration -- the background sweep's own cadence is NOT synchronized to this write
    for _ in range(10):  # => co-24: polls for up to 10 seconds -- expiry filtering is a background process, not a synchronous side effect of the write
        expired_check = client.get_item(TableName="TtlItems", Key={"id": {"S": "already-expired"}})  # => re-checks whether the background sweep has caught up yet
        still_present = "Item" in expired_check  # => True until the sweep marks/filters this item
        if not still_present:  # => co-24: the moment the background sweep filters it, stop polling
            break  # => exits the polling loop early -- no need to burn the remaining iterations
        time.sleep(1)  # => co-24: waits one second before re-checking -- the sweep's own cadence, observed empirically, is on this order

    fresh = client.get_item(TableName="TtlItems", Key={"id": {"S": "still-fresh"}})  # => reads the not-yet-expired item
    assert "Item" in fresh  # => co-24: a future expires_at means the item is NOT yet subject to expiry filtering
    assert still_present is False  # => co-24: within the polling window, the past-epoch item was filtered from reads
    print(f"Item with future expires_at: present = {'Item' in fresh}")  # => Output: Item with future expires_at: present = True
    print(f"Item with past expires_at:   present = {still_present} (filtered by the background TTL sweep)")  # => Output: Item with past expires_at:   present = False (filtered by the background TTL sweep)
    # => co-24: on REAL AWS DynamoDB, an item past its expires_at stays fully readable via GetItem
    # => (which has no FilterExpression parameter at all) -- and via Scan/Query unless the caller adds
    # => an explicit FilterExpression -- until the SAME best-effort background process deletes it,
    # => typically within a few days. There is no separate "fast read-filter" tier; this example's
    # => ~10-second background-sweep visibility is DynamoDB Local's own faster, more eager
    # => implementation detail, not a demonstration of the real AWS service's read path (see
    # => overview.md's References)


if __name__ == "__main__":  # => guards against running main() on `import example`
    main()  # => runs everything above when executed as a script
