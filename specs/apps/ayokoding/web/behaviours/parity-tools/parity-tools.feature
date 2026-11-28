Feature: Parity tools for the old site's URL inventory

  As the repository owner checking that the new app serves every URL the old site serves
  I want a generated inventory of old URLs and a gap report against the new app
  So that every missing or redirected address is visible and nothing is dropped silently

  Scenario: The URL inventory lists each page once, sorted, with no host
    Given the old site's sitemap has three entries, one of them a repeat of another
    When the URL inventory command runs over the sitemap
    Then the inventory lists each page address once, in sorted order
    And no inventory entry names a host

  Scenario: The gap report classifies each URL by its status and follows no redirect
    Given an inventory lists a page that answers 200 and a page that answers 404
    When the gap report runs against the base address
    Then the page that answers 200 is classified as passing
    And the page that answers 404 is classified as failing and grouped under its cause
    And no redirect is followed
