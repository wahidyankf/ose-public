Feature: OSE ID route existence disclosure

  As a security reviewer
  I want a method a registered path does not answer to reveal nothing about that path
  So that no caller can map the OSE ID route table by comparing its rejections

  Rule: A method a path does not answer is answered as an unregistered path

    Scenario Outline: Answer an unanswered method as an unregistered path
      Given OSE ID is serving its whole route table
      When a caller addresses <path> with the unanswered method <method>
      Then OSE ID answers exactly as it answers an unregistered path
      And the answer names no method that path would have answered

      Examples:
        | path                       | method |
        | /health/live               | POST   |
        | /health/ready              | POST   |
        | /connect/authorize         | POST   |
        | /connect/token             | GET    |
        | /external/google/challenge | POST   |
        | /scim/v2/Users             | GET    |
        | /platform/admin/companies  | POST   |
        | /connect/authorize         | DELETE |
