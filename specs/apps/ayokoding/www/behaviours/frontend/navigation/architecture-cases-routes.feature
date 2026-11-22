Feature: Architecture Cases Routes

  As a reader visiting AyoKoding
  I want the Architecture Cases pages to be reachable
  So that I can access the In FP, In OOP, and In Procedural production-wiring case content

  Background:
    Given the app is running

  # Behaviour: AYW-046
  Scenario Outline: architecture case pages are reachable
    When a visitor navigates to "/en/<slug>"
    Then the page should respond with HTTP 200
    And the page should contain a heading with text "<heading>"

    Examples:
      | slug                                                                        | heading                                     |
      | learn/software-engineering/software-architecture/by-example/cases/in-fp     | In FP — F# / Clojure / TypeScript / Haskell |
      | learn/software-engineering/software-architecture/by-example/cases/in-oop    | In OOP — Java / Spring Boot                 |
      | learn/software-engineering/software-architecture/by-example/cases/in-procedural | In Procedural — Go / Rust               |
