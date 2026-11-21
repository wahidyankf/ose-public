Feature: Search

  As a reader visiting AyoKoding
  I want to search for content across the site
  So that I can quickly find the articles and topics I am looking for

  Background:
    Given the app is running

  # Behaviour: AYW-018
  Scenario: Cmd+K keyboard shortcut opens the search dialog
    When a visitor presses Cmd+K on the page
    Then the search dialog should open
    And the search input should have focus

  Scenario: Typing a query shows matching results that update as the query changes
    Given the search dialog is open
    When the visitor types a query into the search input
    Then search results should appear after a debounce delay
    And results should update when the visitor changes the query

  Scenario: Clicking a search result navigates to that page
    Given the search dialog is open
    And the visitor has typed a query that returns at least one result
    When the visitor clicks a search result
    Then the search dialog should close
    And the visitor should be navigated to the page for that result

  Scenario: Escape key closes the search dialog
    Given the search dialog is open
    When the visitor presses Escape
    Then the search dialog should close
    And focus should return to the page behind the dialog

  # Behaviour: AYW-020
  Scenario: Search results show title, section path, and excerpt
    Given the search dialog is open
    When the visitor types a query that returns results
    Then each result should display the page title
    And each result should display the section path indicating where the page lives
    And each result should display a text excerpt showing the matching content

  # USS-001 — Rule-15 swe-usability-tester spec-blind suggestion (paired with UWT-001): the search
  # index used to be built entirely from markdown `content/` files, structurally excluding the
  # Tools section (`/tools/ai-benchmark`, `/tools/cost-of-living-calculator`); a first-time visitor
  # searching "AI Model Benchmark" got zero results. Fixed via `staticSearchDocs()`
  # (`content/core/static-search-docs.ts`), merged into the index alongside the markdown docs.
  # Behaviour: AYW-021
  Scenario: Global search surfaces the Tools pages
    Given the search dialog is open
    When the visitor types a query naming the AI Model Benchmark tool
    Then a result linking to the AI Model Benchmark tool page is shown
