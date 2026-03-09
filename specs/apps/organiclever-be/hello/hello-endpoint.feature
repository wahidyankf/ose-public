Feature: Hello World Endpoint

  As an API consumer
  I want to call the hello endpoint
  So that I can verify the OrganicLever API is reachable and responding

  Scenario: Successful response returns greeting message
    Given the OrganicLever API is running
    When a client sends GET /api/v1/hello
    Then the response status code should be 200
    And the response body should be {"message":"world!"}
    And the response Content-Type should be application/json

  Scenario: Cross-origin request from localhost is permitted
    Given the OrganicLever API is running
    When a client sends GET /api/v1/hello with an Origin header of http://localhost:3200
    Then the response status code should be 200
    And the response should include an Access-Control-Allow-Origin header permitting the request
