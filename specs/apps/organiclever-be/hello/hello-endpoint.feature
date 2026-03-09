Feature: Hello World Endpoint

  As an API consumer
  I want to call the hello endpoint
  So that I can verify the OrganicLever API is reachable and responding

  Background:
    Given the OrganicLever API is running
    And a user "hellouser" is already registered with password "s3cur3Pass!"
    And the client has logged in as "hellouser" and stored the JWT token

  Scenario: Successful response returns greeting message
    When a client sends GET /api/v1/hello with the stored Bearer token
    Then the response status code should be 200
    And the response body should be {"message":"world!"}
    And the response Content-Type should be application/json

  Scenario: Cross-origin request from localhost is permitted
    When a client sends GET /api/v1/hello with the stored Bearer token and Origin header http://localhost:3200
    Then the response status code should be 200
    And the response should include an Access-Control-Allow-Origin header permitting the request
