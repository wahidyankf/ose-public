Feature: RSS Feed
  As a platform follower
  I want to subscribe to an RSS feed of updates
  So that I can receive new posts in my feed reader

  Background:
    Given the API is running

  Scenario: RSS feed contains valid structure
    Given the content repository contains update posts
    When the RSS feed is generated
    Then the feed has a channel with title "OSE Platform Updates"
    And the feed has a channel link to the site URL
    And the feed contains item elements for each update

  Scenario: RSS feed entries contain required fields
    Given the content repository contains an update post with title "Phase 0 End" and date "2026-02-08"
    When the RSS feed is generated
    Then the feed entry has the title "Phase 0 End"
    And the feed entry has a publication date
    And the feed entry has a link to the update page
    And the feed entry has a description
