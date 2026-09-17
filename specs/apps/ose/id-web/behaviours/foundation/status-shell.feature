Feature: OSE ID service status

  As a local developer using a keyboard and a screen reader
  I want the status shell to state readiness in text at any viewport width
  So that I can tell the process, database, and schema apart without a mouse or color perception

  Rule: Service status is accessible without a mouse or color perception

    Scenario: Read service status without a mouse
      Given the OSE ID web shell is running at a 320 pixel viewport
      When a keyboard and screen-reader user reviews its status
      Then the page has one descriptive heading and named status region
      And status is conveyed by text rather than color alone

  Rule: The status page is a read-only HTML surface that reveals nothing about the stack

    Scenario: Render the service status without identity controls
      Given the local web and backend services are ready
      When an anonymous browser requests the OSE ID web root without user or tenant context
      Then the response is 200 with media type "text/html; charset=utf-8"
      And the response is marked "no-cache" and sets no session cookie
      And the page carries one heading and a named textual status region
      And no sign-in, provider, company, consent, or administration control is rendered
      And repeated and concurrent reads change nothing the service stores

    # Exemption(e2e): the unreadable-status state has no external trigger a black-box http client can pull — the status source is an in-process call with no network, process, or filesystem boundary between the shell and what it reports, so only an injected source can reach this branch; alternative-proof: ose-id-web:test:integration / Sanitize a status-rendering failure
    @e2e-exempt
    Scenario: Sanitize a status-rendering failure
      Given the local web shell is running and the backend status it reports on is unreachable
      When an anonymous browser requests the OSE ID web root
      Then the response is a sanitized 503 status page with media type "text/html; charset=utf-8"
      And the response is marked "no-cache" and sets no session cookie
      And no backend host, secret, stack trace, absolute path, or user detail is returned or logged
