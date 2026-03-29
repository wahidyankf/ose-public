---
title: "Integration Testing Standards"
description: OSE Platform standards for integration testing — mocked external I/O, in-memory repositories, MSW, and WireMock patterns
category: explanation
subcategory: development
tags:
  - tdd
  - integration-testing
  - msw
  - wiremock
  - in-memory
principles:
  - automation-over-manual
  - reproducibility
created: 2026-02-09
updated: 2026-03-04
---

# Integration Testing Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding TDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/by-example/) before using these standards.

**REQUIRED**: Read [Three-Tier Testing Model](./ex-soen-de-tedrdetd__three-tier-testing.md) first. Integration tests are one of three distinct tiers. Understanding all three tiers before applying these standards is essential.

## Purpose

OSE Platform standards for integration tests — tests that verify multiple internal layers working
together while keeping all external I/O controlled via mocking and in-memory implementations.

## Core Rule

**REQUIRED**: Integration tests MUST mock all external I/O.

**PROHIBITED**: Real network calls, real databases, real external services in integration tests.

Integration tests prove the internal wiring is correct — routing, middleware, use cases, services,
and repositories all behave as specified — without depending on live infrastructure.

```
✅ Integration test boundary:
  [HTTP request] → [Router] → [Middleware] → [Use Case] → [In-Memory Repo]
                                                        ↑
                                           (real code, in-memory state)

❌ NOT this:
  [HTTP request] → [Router] → [Use Case] → [Real PostgreSQL]
                                         ↑
                              (real network = belongs in E2E)
```

## REQUIRED: In-Memory Repository Implementations

**REQUIRED**: Use in-memory repository implementations for integration tests.

**PROHIBITED**: Testcontainers, real databases, ORM connections in integration tests.

In-memory implementations are concrete classes that implement the same repository interface as
production implementations, using an in-memory data structure (Map, List) instead of a real
database. They behave realistically — CRUD operations, queries, relationship resolution — without
touching any infrastructure.

### TypeScript — In-Memory Repository

```typescript
// Production interface
interface MemberRepository {
  findAll(): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  save(member: Member): Promise<void>;
  delete(id: string): Promise<void>;
}

// In-memory implementation for integration tests
export class InMemoryMemberRepository implements MemberRepository {
  private store = new Map<string, Member>();

  async findAll(): Promise<Member[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<Member | null> {
    return this.store.get(id) ?? null;
  }

  async save(member: Member): Promise<void> {
    this.store.set(member.id, member);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

// Integration test usage
describe("MemberService (Integration)", () => {
  let service: MemberService;

  beforeEach(() => {
    const repository = new InMemoryMemberRepository();
    service = new MemberService(repository);
  });

  it("should list all members", async () => {
    await service.addMember({ name: "Alice Johnson", role: "admin" });
    await service.addMember({ name: "Bob Smith", role: "viewer" });

    const members = await service.listMembers();

    expect(members).toHaveLength(2);
    expect(members.map((m) => m.name)).toContain("Alice Johnson");
  });
});
```

### Java — In-Memory Repository

```java
// Production interface
public interface MemberRepository {
    List<Member> findAll();
    Optional<Member> findById(MemberId id);
    void save(Member member);
    void delete(MemberId id);
}

// In-memory implementation for integration tests
public class InMemoryMemberRepository implements MemberRepository {
    private final Map<MemberId, Member> store = new HashMap<>();

    @Override
    public List<Member> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public Optional<Member> findById(MemberId id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public void save(Member member) {
        store.put(member.getId(), member);
    }

    @Override
    public void delete(MemberId id) {
        store.remove(id);
    }
}

// Integration test usage
class MemberServiceIntegrationTest {
    private MemberRepository repository;
    private MemberService service;

    @BeforeEach
    void setUp() {
        repository = new InMemoryMemberRepository();
        service = new MemberService(repository);
    }

    @Test
    void shouldListAllMembers() {
        repository.save(Member.create(MemberId.generate(), "Alice Johnson", Role.ADMIN));
        repository.save(Member.create(MemberId.generate(), "Bob Smith", Role.VIEWER));

        List<Member> members = service.listMembers();

        assertThat(members).hasSize(2);
        assertThat(members).extracting(Member::getName).contains("Alice Johnson");
    }
}
```

## REQUIRED: Mock External HTTP Services

**REQUIRED**: Intercept and mock all outbound HTTP calls in integration tests.

**PROHIBITED**: Real network calls to external APIs, payment gateways, notification services, or
any external HTTP endpoint.

### TypeScript — MSW (Mock Service Worker)

MSW intercepts HTTP calls at the network layer. Integration tests configure MSW handlers to control
what the application receives when it makes fetch/axios calls.

```typescript
// src/test/server.ts — shared MSW server for integration tests
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// src/test/handlers.ts — default mock responses
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/members", () =>
    HttpResponse.json([
      { id: "1", name: "Alice Johnson", role: "admin" },
      { id: "2", name: "Bob Smith", role: "viewer" },
    ]),
  ),
  http.post("/api/members", async ({ request }) => {
    const body = await request.json() as { name: string; role: string };
    return HttpResponse.json({ id: "3", ...body }, { status: 201 });
  }),
];

// Integration test — MSW intercepts all HTTP in the rendered component
import { server } from "../server";
import { http, HttpResponse } from "msw";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("should show error when API returns 500", async () => {
  server.use(
    http.get("/api/members", () => HttpResponse.json(null, { status: 500 })),
  );

  render(<MemberList />);

  expect(await screen.findByText("Failed to load members")).toBeInTheDocument();
});
```

### Java — WireMock

WireMock stubs external HTTP endpoints. Configure it per-test class to control what the application
receives when it calls external services.

```java
@ExtendWith(WireMockExtension.class)
class NotificationServiceIntegrationTest {

    @RegisterExtension
    static WireMockExtension wireMock = WireMockExtension.newInstance()
        .options(wireMockConfig().dynamicPort())
        .build();

    private NotificationService service;

    @BeforeEach
    void setUp() {
        String baseUrl = wireMock.baseUrl();
        service = new NotificationService(new HttpNotificationClient(baseUrl));
    }

    @Test
    void shouldSendNotificationSuccessfully() {
        wireMock.stubFor(post(urlEqualTo("/notifications"))
            .willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"status\": \"sent\"}")));

        service.notify(MemberId.of("1"), "Welcome to OSE Platform");

        wireMock.verify(postRequestedFor(urlEqualTo("/notifications"))
            .withRequestBody(containing("Welcome to OSE Platform")));
    }

    @Test
    void shouldRetryWhenNotificationFails() {
        wireMock.stubFor(post(urlEqualTo("/notifications"))
            .inScenario("retry")
            .whenScenarioStateIs(STARTED)
            .willReturn(aResponse().withStatus(503))
            .willSetStateTo("second-attempt"));

        wireMock.stubFor(post(urlEqualTo("/notifications"))
            .inScenario("retry")
            .whenScenarioStateIs("second-attempt")
            .willReturn(aResponse().withStatus(200).withBody("{\"status\": \"sent\"}")));

        service.notify(MemberId.of("1"), "Welcome");

        wireMock.verify(2, postRequestedFor(urlEqualTo("/notifications")));
    }
}
```

## REQUIRED: Separate Integration Tests from Unit Tests

**REQUIRED**: Integration tests MUST live in a dedicated directory separate from unit tests.

```
src/
  test/
    unit/
      MemberServiceTest.java          # Pure unit tests — all dependencies mocked
      ZakatCalculatorTest.java
    integration/
      MemberListIntegrationTest.java  # Multiple layers wired + in-memory infra
      UserLoginIntegrationTest.java
```

**TypeScript** (organiclever-fe pattern):

```
src/
  test/
    integration/
      member-list.integration.test.tsx    # vitest-cucumber + MSW
      user-login.integration.test.tsx
    helpers/
      mock-data.ts                        # Shared test data
      auth-mock.ts                        # Auth state helpers
    server.ts                             # MSW server setup
    setup.ts                             # Global test setup
  components/
    Breadcrumb.unit.test.tsx             # Unit test co-located with source
```

## BDD Integration Tests (Gherkin-Driven)

Integration tests at OSE Platform use BDD Gherkin scenarios as the specification. The feature
files in `specs/` drive the integration test implementation.

### TypeScript — vitest-cucumber

```typescript
// src/test/integration/member-list.integration.test.tsx
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen } from "@testing-library/react/pure";
import { BASE_AUTH } from "../helpers/auth-mock";
import { server } from "../server";
import { MOCK_MEMBERS } from "../helpers/mock-data";
import { http, HttpResponse } from "msw";

const feature = await loadFeature("../../specs/apps/organiclever-fe/members/member-list.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("Viewing the member list as a logged-in user", ({ Given, When, Then }) => {
    Given("a user is logged in", () => {
      // Configure auth state — no real HTTP, cookie set in-memory
      document.cookie = `auth=${BASE_AUTH}`;
    });

    When("they navigate to the members page", () => {
      render(<MemberListPage />);
      // MSW intercepts GET /api/members and returns MOCK_MEMBERS
    });

    Then("they see all members in the list", async () => {
      for (const member of MOCK_MEMBERS) {
        expect(await screen.findByText(member.name)).toBeInTheDocument();
      }
    });
  });
});
```

### Java — Cucumber JVM + MockMvc

```java
// Integration test — Spring context loaded, but real DB replaced with in-memory repo
@SpringBootTest
@AutoConfigureMockMvc
class MemberListIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean  // Replaces real PostgreSQL-backed repository with a mock
    private MemberRepository memberRepository;

    @Test
    void shouldReturnMemberList() throws Exception {
        when(memberRepository.findAll()).thenReturn(List.of(
            Member.create(MemberId.generate(), "Alice Johnson", Role.ADMIN),
            Member.create(MemberId.generate(), "Bob Smith", Role.VIEWER)
        ));

        mockMvc.perform(get("/api/members")
                .header("Authorization", "Bearer test-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].name", is("Alice Johnson")));
    }
}
```

## Transaction Management

Integration tests must not leave state between test cases.

**TypeScript**: Reset MSW handlers after each test. Use `beforeEach` to reinitialize in-memory
repositories.

**Java**: Use `@Transactional` on tests that write to in-memory state if using a shared Spring
context, or reinitialize the in-memory repository in `@BeforeEach`.

```java
class MemberRepositoryIntegrationTest {
    private InMemoryMemberRepository repository;

    @BeforeEach
    void setUp() {
        repository = new InMemoryMemberRepository(); // Fresh state per test
    }
}
```

## What Does NOT Belong in Integration Tests

| Concern                               | Correct tier |
| ------------------------------------- | ------------ |
| Testcontainers / real PostgreSQL      | E2E          |
| Real HTTP to external payment gateway | E2E          |
| Real browser automation               | E2E          |
| Slow Docker container startup         | E2E          |
| Single-class business logic           | Unit         |
| Pure function calculation             | Unit         |

## Related Standards

- [Three-Tier Testing Model](./ex-soen-de-tedrdetd__three-tier-testing.md) — authoritative tier definitions and the mocking boundary
- [Test Doubles Standards](./ex-soen-de-tedrdetd__test-doubles-standards.md) — in-memory implementations vs. mocks
- [Java Testing Standards](../../programming-languages/java/ex-soen-prla-ja__testing-standards.md) — Java-specific integration patterns
- [TypeScript Testing](../../programming-languages/typescript/ex-soen-prla-ty__testing.md) — TypeScript-specific integration patterns

---

**Last Updated**: 2026-03-04
