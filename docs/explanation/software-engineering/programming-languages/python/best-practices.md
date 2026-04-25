---
title: Python Best Practices
description: Comprehensive guide to Python coding standards including PEP 8 style, PEP 20 philosophy, type hints, code organization, and Sharia-compliant financial domain patterns
category: explanation
subcategory: prog-lang
tags:
  - python
  - best-practices
  - pep-8
  - pep-20
  - code-quality
  - type-hints
  - documentation
related:
  - ./idioms.md
  - ./type-safety.md
  - ./error-handling.md
  - ./linting-and-formatting.md
  - ./test-driven-development.md
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
---

# Python Best Practices

## Quick Reference

**Software Engineering Principles**:

- [Alignment with Software Engineering Principles](#alignment-with-software-engineering-principles)

**Major Topics**:

- [PEP 8 Style Guide](#pep-8-style-guide)
- [PEP 20 Zen of Python](#pep-20-zen-of-python)
- [Type Hints and Annotations](#type-hints-and-annotations)
- [Code Organization](#code-organization)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Practices](#testing-practices)
- [Documentation Standards](#documentation-standards)
- [Security Practices](#security-practices)
- [Anti-Patterns](#anti-patterns)
- [Async/Await Best Practices](#asyncawait-best-practices)
- [Type Hints Advanced Patterns](#type-hints-advanced-patterns)
- [Performance Optimization](#performance-optimization)
- [Domain-Driven Design Patterns](#domain-driven-design-patterns)

**Additional Resources**:

- [References](#references)

## Overview

Python best practices establish coding standards ensuring consistency, maintainability, and production quality across the Open Sharia Enterprise platform. These practices build on Python Enhancement Proposals (PEPs), community conventions, and platform-specific requirements for financial domain applications.

## Alignment with Software Engineering Principles

Python development follows the the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Python Implements**:

- Ruff for automated linting and formatting (replaces Flake8, Black, isort)
- mypy for static type checking
- pytest for automated testing with coverage
- pre-commit hooks for validation
- GitHub Actions CI/CD pipelines
- tox for testing across Python versions

**PASS Example** (Automated Zakat Calculation Validation):

```python
# pyproject.toml - Automated tool configuration
[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "--cov=src --cov-report=term-missing --cov-fail-under=80"

# tests/test_zakat_calculator.py - Automated Zakat validation
from decimal import Decimal

import pytest
from ose_platform.domain.zakat import ZakatCalculator

class TestZakatCalculator:
    """Automated tests for Zakat calculation logic."""

    def test_calculate_returns_2_5_percent_of_wealth(self) -> None:
        """Verify Zakat is exactly 2.5% of wealth amount."""
        calculator = ZakatCalculator()
        wealth = Decimal("100000.00")
        nisab = Decimal("5000.00")
        expected_zakat = Decimal("2500.00")

        result = calculator.calculate(wealth, nisab)

        assert result == expected_zakat

    def test_calculate_with_wealth_below_nisab_returns_zero(self) -> None:
        """Verify zero wealth below nisab threshold."""
        calculator = ZakatCalculator()
        wealth = Decimal("1000.00")
        nisab = Decimal("5000.00")

        result = calculator.calculate(wealth, nisab)

        assert result == Decimal("0")

# .github/workflows/ci.yml - CI/CD automation
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements-dev.txt
      - run: ruff check .
      - run: ruff format --check .
      - run: mypy src/
      - run: pytest
```

**FAIL Example** (Manual Testing):

```python
# Manual testing - prone to human error, not reproducible
class ZakatCalculator:
    """No automated tests, manual verification only."""

    def calculate(self, wealth: float, nisab: float) -> float:
        # Developer manually tests by running:
        # >>> calc = ZakatCalculator()
        # >>> calc.calculate(100000, 5000)
        # 2500.0  # Looks right visually - but no regression tests!
        return wealth * 0.025

# 4. Time-consuming and error-prone
```

**Islamic Finance Application**: Automated Zakat calculation verification ensures consistent nisab threshold checking across all transactions, preventing manual miscalculations that could lead to underpayment (haram). Every code commit triggers pytest with 85% coverage requirement.

**See Also**: [Python Linting and Formatting](./linting-and-formatting.md)

### 2. Explicit Over Implicit

**Principle**: Make behavior, configuration, and dependencies explicit rather than relying on hidden defaults or magic.

**How Python Implements**:

- Explicit type hints (PEP 484)
- No mutable default arguments
- Explicit dependency injection
- Clear configuration files (no magic)
- Pydantic for explicit validation

**PASS Example** (Explicit Murabaha Terms):

```python
from dataclasses import dataclass
from decimal import Decimal

from pydantic import BaseModel, Field

class MurabahaConfig(BaseModel):
    """Explicit Murabaha configuration with no hidden defaults."""

    min_cost_price: Decimal = Field(gt=0, description="Minimum asset cost")
    max_profit_margin_rate: Decimal = Field(ge=0, le=1, description="Maximum profit rate")
    min_installments: int = Field(ge=1, description="Minimum installment count")
    max_installments: int = Field(le=360, description="Maximum installment count")

@dataclass(frozen=True)
class MurabahaContract:
    """Immutable Murabaha contract with explicit terms."""

    contract_id: str
    customer_id: str
    cost_price: Decimal
    profit_margin: Decimal
    total_price: Decimal
    installment_count: int

def create_murabaha_contract(
    customer_id: str,
    cost_price: Decimal,
    profit_margin: Decimal,
    installment_count: int,
    config: MurabahaConfig,
) -> MurabahaContract:
    """
    Create Murabaha contract with explicit parameters.

    All terms are explicitly passed - no hidden defaults.
    Every parameter has clear meaning and validation.
    """
    # Explicit validation against configuration
    if cost_price < config.min_cost_price:
        raise ValueError(f"Cost price must be at least {config.min_cost_price}")

    profit_rate = profit_margin / cost_price
    if profit_rate > config.max_profit_margin_rate:
        raise ValueError(f"Profit rate {profit_rate} exceeds maximum {config.max_profit_margin_rate}")

    if not (config.min_installments <= installment_count <= config.max_installments):
        raise ValueError(f"Installments must be between {config.min_installments} and {config.max_installments}")

    # All calculations explicit - no hidden fees
    total_price = cost_price + profit_margin

    return MurabahaContract(
        contract_id=generate_contract_id(),
        customer_id=customer_id,
        cost_price=cost_price,
        profit_margin=profit_margin,
        total_price=total_price,
        installment_count=installment_count,
    )
```

**FAIL Example** (Implicit Defaults):

```python
def create_murabaha_contract(
    customer_id: str,
    cost_price: Decimal,
    profit_margin: Decimal | None = None,  # Hidden default!
) -> dict:
    """BAD: Hidden defaults violate Shariah transparency."""
    # Where is 15% documented? What if it changes?
    margin = profit_margin or (cost_price * Decimal("0.15"))  # HIDDEN MARKUP!

    # Magic number - not explicit
    installments = 12  # Why 12? Where is this requirement?

    return {
        "contract_id": generate_contract_id(),
        "customer_id": customer_id,
        "cost_price": cost_price,
        "profit_margin": margin,
        "total_price": cost_price + margin,
        "installments": installments,
    }
```

**Islamic Finance Application**: Explicit Murabaha terms ensure no hidden fees (riba), maintaining transparency required by Shariah law. All profit margins must be disclosed upfront with explicit parameters. Pydantic validation catches invalid configurations before contracts are created.

**See Also**: [Python Best Practices](./best-practices.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures to prevent unintended state changes and enable safer concurrent code.

**How Python Implements**:

- `@dataclass(frozen=True)` for immutable data classes
- `NamedTuple` for lightweight immutable types
- Tuples instead of lists where possible
- `frozenset` instead of `set` for immutable collections
- Copy-on-write semantics

**PASS Example** (Immutable Transaction Record):

```python
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

@dataclass(frozen=True)
class ZakatTransaction:
    """
    Immutable Zakat transaction record.

    Once created, cannot be modified - ensuring audit trail integrity.
    """

    transaction_id: str
    payer_id: str
    wealth_amount: Decimal
    zakat_amount: Decimal
    paid_at: datetime
    audit_hash: str

def create_zakat_transaction(
    payer_id: str, wealth_amount: Decimal, zakat_amount: Decimal
) -> ZakatTransaction:
    """Create immutable Zakat transaction."""
    paid_at = datetime.utcnow()

    # Create transaction (frozen=True prevents modification)
    transaction = ZakatTransaction(
        transaction_id=generate_transaction_id(),
        payer_id=payer_id,
        wealth_amount=wealth_amount,
        zakat_amount=zakat_amount,
        paid_at=paid_at,
        audit_hash=calculate_audit_hash(payer_id, wealth_amount, zakat_amount, paid_at),
    )

    return transaction

def correct_zakat_transaction(original: ZakatTransaction, corrected_amount: Decimal) -> ZakatTransaction:
    """
    Create correction transaction.

    Original transaction remains unchanged - audit trail preserved.
    """
    # Cannot modify original - must create new transaction
    return create_zakat_transaction(
        payer_id=original.payer_id, wealth_amount=original.wealth_amount, zakat_amount=corrected_amount
    )

# transaction.zakat_amount = Decimal("500")  # ERROR: dataclass is frozen
```

**FAIL Example** (Mutable State):

```python
class ZakatTransaction:
    """BAD: Mutable transaction allows tampering."""

    def __init__(
        self, payer_id: str, wealth_amount: Decimal, zakat_amount: Decimal
    ):
        self.transaction_id = generate_transaction_id()
        self.payer_id = payer_id
        self.wealth_amount = wealth_amount
        self.zakat_amount = zakat_amount
        self.paid_at = datetime.utcnow()

    def update_amount(self, new_amount: Decimal) -> None:
        """DANGER: Allows modification after creation!"""
        self.zakat_amount = new_amount  # Violates audit trail
        self.paid_at = datetime.utcnow()  # Falsifies timestamp!
```

**Islamic Finance Application**: Immutable transaction records provide tamper-proof audit trails required for Shariah compliance verification. Once a Murabaha payment is recorded, it cannot be altered - ensuring transparency and accountability (Amanah). Corrections create new transactions with references to originals.

**See Also**: [Python Functional Programming](./functional-programming.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free for predictable, testable code.

**How Python Implements**:

- Pure calculation functions
- Functional programming patterns (map, filter, reduce)
- Side effects isolated at boundaries
- No global state in business logic
- Deterministic outputs for same inputs

**PASS Example** (Pure Zakat Calculation):

```python
from decimal import Decimal

def calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal:
    """
    Calculate Zakat obligation (pure function).

    Pure because:
    - No external dependencies
    - No side effects (no I/O, no state changes)
    - Deterministic (same inputs = same output)
    - Easy to test and verify

    Args:
        wealth: Total qualifying wealth
        nisab: Minimum threshold for Zakat

    Returns:
        Zakat amount (2.5% of wealth if above nisab, else 0)
    """
    if wealth < nisab:
        return Decimal("0")

    zakat_rate = Decimal("0.025")  # 2.5%
    return wealth * zakat_rate

def is_zakat_eligible(wealth: Decimal, nisab: Decimal) -> bool:
    """Check if wealth qualifies for Zakat (pure predicate)."""
    return wealth >= nisab

def calculate_nisab_from_gold_price(gold_price_per_gram: Decimal) -> Decimal:
    """Calculate nisab threshold from current gold price (pure)."""
    nisab_gold_grams = Decimal("85")
    return gold_price_per_gram * nisab_gold_grams

# Testing pure functions is trivial - no setup required
def test_calculate_zakat():
    """Test pure Zakat calculation."""
    wealth = Decimal("100000.00")
    nisab = Decimal("5000.00")

    zakat = calculate_zakat(wealth, nisab)

    assert zakat == Decimal("2500.00")
```

**FAIL Example** (Impure with Side Effects):

```python
import logging
from decimal import Decimal

import requests

class ZakatCalculator:
    """BAD: Impure calculator with side effects."""

    def __init__(self, database, notification_service):
        self.database = database
        self.notification_service = notification_service
        self.logger = logging.getLogger(__name__)

    def calculate(self, wealth: Decimal, nisab: Decimal) -> Decimal:
        """
        BAD: Side effects make this unpredictable.

        Problems:
        - Logging (side effect)
        - Database queries during calculation
        - External API calls
        - Notifications
        - Non-deterministic behavior
        """
        # Side effect: logging
        self.logger.info(f"Calculating Zakat for wealth: {wealth}")

        # Side effect: database query
        rate = self.database.query("SELECT rate FROM zakat_rates WHERE is_current = TRUE")

        # Side effect: external API call (network I/O)
        gold_price = self._fetch_gold_price()

        # Calculation mixed with I/O
        zakat = wealth * (rate or Decimal("0.025"))

        # Side effect: notification
        self.notification_service.send(f"Zakat calculated: {zakat}")

        # Side effect: database write
        self.database.insert("zakat_calculations", {"wealth": wealth, "zakat": zakat})

        return zakat

    def _fetch_gold_price(self) -> Decimal:
        """Non-deterministic external call."""
        response = requests.get("https://api.gold-price.com/current")
        return Decimal(response.json()["price"])
```

**Islamic Finance Application**: Pure Zakat calculation functions ensure deterministic, verifiable results. Calculate Zakat on 10,000 SAR wealth with 5,000 SAR nisab - always get 250 SAR (2.5%). Scholars and users can independently verify calculations match Shariah requirements without database access or API keys.

**See Also**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments and time.

**How Python Implements**:

- `requirements.txt` with exact versions (pinned dependencies)
- `pyproject.toml` with version constraints
- Virtual environments (venv, virtualenv)
- Docker containers for environment consistency
- Deterministic builds with locked dependencies

**PASS Example** (Reproducible Environment):

```txt
# requirements.txt - Exact versions pinned
decimal==1.0.1
pydantic==2.10.6
pytest==8.3.4
ruff==0.9.1
mypy==1.14.1

# requirements-dev.txt - Development dependencies
-r requirements.txt
pytest-cov==6.0.0
pre-commit==4.0.1

# pyproject.toml - Project configuration
[project]
name = "ose-zakat-service"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "decimal>=1.0.1",
    "pydantic>=2.10.0,<3.0.0",
]

[build-system]
requires = ["setuptools>=75.0.0"]
build-backend = "setuptools.build_meta"

# Dockerfile - Reproducible container
FROM python:3.11.11-slim

WORKDIR /app

# Install exact versions from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN pip install .

CMD ["python", "-m", "ose_zakat_service"]
```

**FAIL Example** (Non-Reproducible):

```txt
# requirements.txt - Unpinned versions
decimal  # Could be any version!
pydantic>=2.0  # Could be 2.0.0 or 2.10.6
pytest  # Latest version changes over time

# - "Works on my machine" syndrome
```

**Islamic Finance Application**: Reproducible Murabaha markup calculations ensure that profit-sharing ratios remain consistent across all deployment environments. When Islamic scholars audit the system in 2026, they must see the same calculations that ran in 2024 - reproducibility ensures Shariah compliance across time. Exact dependency pinning prevents silent behavior changes.

**See Also**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

---

### Why Best Practices Matter

**Consistency**: Uniform code style reduces cognitive load and review friction.

**Maintainability**: Clear patterns enable easier updates and refactoring.

**Quality**: Automated tools (Ruff, Black, mypy) enforce standards programmatically.

**Safety**: Type hints and validation prevent runtime errors in financial calculations.

**Collaboration**: Shared conventions enable efficient team development.

## PEP 8 Style Guide

[PEP 8](https://peps.python.org/pep-0008/) defines Python's official style guide. The platform enforces PEP 8 via Ruff linter.

### Naming Conventions

```python
# GOOD: Follow PEP 8 naming conventions
from decimal import Decimal
from datetime import date

class ZakatCalculator:
    """PEP 8: Classes use CapWords (PascalCase)."""

    NISAB_GOLD_GRAMS = 85  # PEP 8: Constants use UPPER_CASE_WITH_UNDERSCORES

    def __init__(self, zakat_rate: Decimal = Decimal("0.025")) -> None:
        # PEP 8: Functions and variables use snake_case
        self._zakat_rate = zakat_rate  # PEP 8: Private attributes start with single underscore

    def calculate_obligation(self, wealth_amount: Decimal) -> Decimal:
        """PEP 8: Methods use snake_case with descriptive names."""
        return wealth_amount * self._zakat_rate

# BAD: Violates PEP 8 naming conventions
class zakatCalculator:  # BAD: Class name should be CapWords
    nisabGoldGrams = 85  # BAD: Constant should be UPPER_CASE

    def CalculateObligation(self, WealthAmount):  # BAD: Method should be snake_case
        return WealthAmount * 0.025
```

**Why this matters**: Consistent naming enables developers to recognize types at a glance. Classes use CapWords, functions use snake_case, constants use UPPER_CASE. The naming convention itself documents intent.

### Indentation and Whitespace

```python
# GOOD: PEP 8 indentation (4 spaces)
from pydantic import BaseModel, Field
from typing import Optional

class DonationCampaign(BaseModel):
    """PEP 8: Use 4 spaces for indentation."""

    campaign_id: str
    target_amount: Decimal
    current_amount: Decimal = Field(default=Decimal("0"))

    def add_donation(self, amount: Decimal) -> None:
        """PEP 8: Blank line after method docstring."""
        if amount <= 0:
            raise ValueError("Donation must be positive")

        self.current_amount += amount  # PEP 8: No whitespace before operators

    def is_target_met(self) -> bool:
        """Check if campaign reached target."""
        return self.current_amount >= self.target_amount

# BAD: Inconsistent indentation and whitespace
class DonationCampaign:
   def add_donation(self,amount):  # BAD: 3-space indent, missing spaces after comma
       if amount<=0:  # BAD: No spaces around operators
           raise ValueError("Donation must be positive")
       self.current_amount+=amount  # BAD: No spaces around +=
```

**Why this matters**: Consistent indentation (4 spaces) aligns with Python community standards. Spaces around operators improve readability. Blank lines separate logical sections.

### Line Length and Breaking

```python
# GOOD: PEP 8 line length (≤88 characters for Black compatibility)
from typing import Protocol

class PaymentProcessor(Protocol):
    """Process various payment types for Islamic finance transactions."""

    def process_zakat_payment(
        self,
        payer_id: str,
        amount: Decimal,
        payment_method: str,
    ) -> str:
        """Process Zakat payment and return transaction ID.

        Args:
            payer_id: Unique identifier for the payer
            amount: Zakat amount in base currency
            payment_method: Payment method (card, bank, cash)

        Returns:
            Transaction ID for the processed payment
        """
        ...

# GOOD: Break long expressions naturally
total_zakat = (
    calculate_wealth_zakat(gold_holdings, gold_nisab)
    + calculate_wealth_zakat(silver_holdings, silver_nisab)
    + calculate_business_zakat(business_assets, business_liabilities)
)

# BAD: Overly long line (exceeds 88 characters)
total_zakat = calculate_wealth_zakat(gold_holdings, gold_nisab) + calculate_wealth_zakat(silver_holdings, silver_nisab) + calculate_business_zakat(business_assets, business_liabilities)
```

**Why this matters**: Line length limits (79-88 characters) enable side-by-side code review. Black formatter standardizes at 88 characters. Natural breaks at operators and commas improve readability.

### Import Organization

```python

# 1. Standard library imports
import sys
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Protocol

# 2. Third-party imports
from pydantic import BaseModel, Field, field_validator
import httpx

# 3. Local application imports
from ose_platform.domain.zakat import ZakatCalculator
from ose_platform.domain.donation import DonationCampaign

# BAD: Disorganized imports
from ose_platform.domain.zakat import ZakatCalculator  # BAD: Mix of orders
from decimal import Decimal
import httpx
from datetime import date
import sys
from pydantic import BaseModel
```

**Why this matters**: Organized imports (standard library → third-party → local) improve navigation. isort automates this ordering. Alphabetical sorting within groups aids findability.

## PEP 20 Zen of Python

[PEP 20](https://peps.python.org/pep-0020/) defines Python's guiding philosophy (`import this`):

### Explicit Over Implicit

```python
# GOOD: Explicit type hints and clear intent
from decimal import Decimal
from typing import Optional

def calculate_murabaha_profit(
    asset_cost: Decimal,
    profit_margin_rate: Decimal,
) -> Decimal:
    """Calculate Murabaha profit explicitly.

    Args:
        asset_cost: Original cost of the asset
        profit_margin_rate: Profit margin as decimal (0.15 = 15%)

    Returns:
        Calculated profit amount
    """
    return asset_cost * profit_margin_rate

# BAD: Implicit types and unclear intent
def calc_profit(cost, rate):  # BAD: No type hints, unclear what rate represents
    return cost * rate  # BAD: Is this profit, markup, or something else?
```

**Why this matters**: Explicit type hints document expectations. Clear names prevent ambiguity. Docstrings explain business context. Readers understand intent without guessing.

### Simple Over Complex

```python
# GOOD: Simple, direct implementation
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class QardHasanLoan:
    """Simple interest-free loan model."""

    loan_id: str
    principal: Decimal
    repaid: Decimal = Decimal("0")

    @property
    def remaining(self) -> Decimal:
        """Calculate remaining balance."""
        return self.principal - self.repaid

# BAD: Unnecessary complexity
class QardHasanLoanComplex:
    """Over-engineered loan model."""

    def __init__(self, loan_id: str, principal: Decimal):
        self._data = {"id": loan_id, "principal": principal, "repaid": Decimal("0")}
        self._calculator = lambda: self._data["principal"] - self._data["repaid"]

    def get_remaining(self):  # BAD: Complex for no benefit
        return self._calculator()
```

**Why this matters**: Simple solutions reduce bugs and maintenance. Dataclasses eliminate boilerplate. Direct calculation beats indirection. Complexity should solve actual problems, not create elegance.

### Readability Counts

```python
# GOOD: Readable comprehension with clear filtering
from typing import List

def calculate_total_zakat(wealth_items: List[Decimal], nisab: Decimal) -> Decimal:
    """Calculate total Zakat for wealth items exceeding nisab."""
    qualifying_wealth = [
        amount for amount in wealth_items if amount >= nisab
    ]
    return sum(qualifying_wealth) * Decimal("0.025")

# BAD: Unreadable one-liner
def calculate_total_zakat(w: List[Decimal], n: Decimal) -> Decimal:
    return sum([a for a in w if a >= n]) * Decimal("0.025")  # BAD: Cryptic names
```

**Why this matters**: Descriptive names document purpose. Multi-line comprehensions with clear filtering improve comprehension. Saving keystrokes costs understanding.

## Type Hints and Annotations

Type hints (PEP 484) provide static analysis and documentation. The platform requires type hints for all public APIs.

### Function Signatures

```python
# GOOD: Complete type hints with Pydantic validation
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator

class WaqfEndowment(BaseModel):
    """Waqf (Islamic endowment) with validation."""

    endowment_id: str
    principal_amount: Decimal = Field(gt=0, description="Initial endowment")
    annual_return_rate: Decimal = Field(ge=0, le=1, description="Expected return rate")

    @field_validator("endowment_id")
    @classmethod
    def validate_id_format(cls, v: str) -> str:
        """Ensure endowment ID follows format."""
        if not v.startswith("WQF-"):
            raise ValueError("Endowment ID must start with WQF-")
        return v

    def calculate_annual_return(self) -> Decimal:
        """Calculate expected annual return from endowment."""
        return self.principal_amount * self.annual_return_rate

# BAD: Missing type hints
def calculate_annual_return(endowment):  # BAD: No type hints
    return endowment["principal"] * endowment["rate"]  # BAD: Dictionary-based, no validation
```

**Why this matters**: Type hints enable mypy static analysis. Pydantic validates at runtime. Field constraints (`gt=0`, `ge=0`, `le=1`) enforce business rules. Validators ensure data integrity.

### Generic Types

```python
# GOOD: Use generics for collection types
from typing import List, Dict, Optional, TypeVar
from decimal import Decimal

T = TypeVar("T")

def find_by_id(items: List[T], item_id: str, get_id: callable) -> Optional[T]:
    """Find item by ID in a list.

    Args:
        items: List of items to search
        item_id: ID to search for
        get_id: Function to extract ID from item

    Returns:
        Found item or None
    """
    for item in items:
        if get_id(item) == item_id:
            return item
    return None

# Example usage with donation campaigns
campaigns: List[DonationCampaign] = get_all_campaigns()
target_campaign = find_by_id(
    campaigns,
    "CAMP-2025-001",
    lambda c: c.campaign_id
)

# BAD: No generics, any type accepted
def find_by_id(items, item_id):  # BAD: No type information
    for item in items:
        if item["id"] == item_id:  # BAD: Assumes dict structure
            return item
    return None
```

**Why this matters**: Generic types (`TypeVar`, `List[T]`) preserve type information. Type checkers verify correct usage. Explicit types prevent runtime errors.

### Protocol Types (Structural Subtyping)

```python
# GOOD: Protocol for structural subtyping (duck typing with types)
from typing import Protocol
from decimal import Decimal

class FinancialCalculator(Protocol):
    """Protocol for financial calculation services."""

    def calculate_obligation(self, base_amount: Decimal) -> Decimal:
        """Calculate financial obligation from base amount."""
        ...

class ZakatCalculator:
    """Calculate Zakat obligation (2.5% of qualifying wealth)."""

    def calculate_obligation(self, wealth_amount: Decimal) -> Decimal:
        """Calculate Zakat owed."""
        return wealth_amount * Decimal("0.025")

class TaxCalculator:
    """Calculate tax obligation (variable rate)."""

    def __init__(self, tax_rate: Decimal):
        self.tax_rate = tax_rate

    def calculate_obligation(self, income_amount: Decimal) -> Decimal:
        """Calculate tax owed."""
        return income_amount * self.tax_rate

def process_obligations(
    calculator: FinancialCalculator,
    amounts: List[Decimal]
) -> Decimal:
    """Process obligations using any compatible calculator."""
    return sum(calculator.calculate_obligation(amount) for amount in amounts)

# Usage: Both calculators satisfy Protocol without explicit inheritance
zakat_calc = ZakatCalculator()
tax_calc = TaxCalculator(Decimal("0.20"))

zakat_total = process_obligations(zakat_calc, wealth_amounts)
tax_total = process_obligations(tax_calc, income_amounts)

# BAD: Abstract base class with explicit inheritance requirement
from abc import ABC, abstractmethod

class FinancialCalculatorABC(ABC):  # BAD: Requires explicit inheritance
    @abstractmethod
    def calculate_obligation(self, amount: Decimal) -> Decimal:
        pass

class ZakatCalculator(FinancialCalculatorABC):  # BAD: Forced to inherit
    def calculate_obligation(self, wealth_amount: Decimal) -> Decimal:
        return wealth_amount * Decimal("0.025")
```

**Why this matters**: Protocols enable structural subtyping (duck typing with type checking). Classes satisfy protocols without explicit inheritance. Looser coupling, stronger typing.

### Module Structure

```python

# File: ose_platform/domain/zakat/calculator.py

"""Zakat calculation services for wealth-based obligations.

This module provides calculation services for various types of Zakat
including wealth-based (gold, silver, cash) and business asset Zakat.
"""

from decimal import Decimal
from typing import Protocol

# Constants at module level
ZAKAT_RATE = Decimal("0.025")  # 2.5%
GOLD_NISAB_GRAMS = 85
SILVER_NISAB_GRAMS = 595

class ZakatCalculationStrategy(Protocol):
    """Protocol for different Zakat calculation strategies."""

    def calculate(self, base_amount: Decimal) -> Decimal:
        """Calculate Zakat for given amount."""
        ...

class StandardZakatCalculator:
    """Standard 2.5% Zakat calculation."""

    def calculate(self, wealth_amount: Decimal) -> Decimal:
        """Calculate standard Zakat obligation."""
        return wealth_amount * ZAKAT_RATE

class GoldZakatCalculator:
    """Zakat calculation for gold holdings."""

    def __init__(self, gold_price_per_gram: Decimal):
        self.gold_price_per_gram = gold_price_per_gram
        self.nisab_value = gold_price_per_gram * GOLD_NISAB_GRAMS

    def calculate(self, gold_grams: Decimal) -> Decimal:
        """Calculate Zakat for gold holdings if exceeding nisab."""
        gold_value = gold_grams * self.gold_price_per_gram
        if gold_value >= self.nisab_value:
            return gold_value * ZAKAT_RATE
        return Decimal("0")

# File: calc.py

def calc_zakat(amt):  # BAD: Unclear function name, no docstring
    return amt * 0.025

RATE = 0.025  # BAD: Constant after function
gn = 85  # BAD: Cryptic name

class Z:  # BAD: Non-descriptive class name
    def c(self, a):  # BAD: Single-letter method and parameter
        return a * RATE
```

**Why this matters**: Module docstrings explain purpose. Constants defined at top. Clear class names document intent. Protocols separate interface from implementation.

### Package Organization

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0173B2', 'primaryTextColor': '#000', 'primaryBorderColor': '#0173B2', 'lineColor': '#DE8F05', 'secondaryColor': '#029E73', 'tertiaryColor': '#CC78BC', 'background': '#fff', 'mainBkg': '#fff'}}}%%
graph LR
    A[ose_platform/] --> B[domain/]
    A --> C[application/]
    A --> D[infrastructure/]

    B --> B1[zakat/]
    B --> B2[donation/]
    B --> B3[qard_hasan/]

    B1 --> B1A["__init__.py<br/>models.py<br/>calculator.py<br/>repository.py"]

    C --> C1[services/]
    C --> C2[commands/]
    C --> C3[queries/]

    D --> D1[database/]
    D --> D2[api/]
    D --> D3[messaging/]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
```

**Package structure follows domain-driven design**:

- **domain/**: Core business logic (entities, value objects, domain services)
- **application/**: Use cases and application services
- **infrastructure/**: Technical implementations (database, API, messaging)

### Dependency Direction

```python

# domain/zakat/models.py (no external dependencies)
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class ZakatObligation:
    """Domain model with no infrastructure dependencies."""

    payer_id: str
    wealth_amount: Decimal
    zakat_amount: Decimal

# application/services/zakat_service.py (depends on domain)
from domain.zakat.models import ZakatObligation
from domain.zakat.calculator import StandardZakatCalculator

class ZakatService:
    """Application service orchestrating Zakat calculation."""

    def __init__(self, calculator: StandardZakatCalculator):
        self._calculator = calculator

    def calculate_obligation(self, payer_id: str, wealth: Decimal) -> ZakatObligation:
        """Calculate Zakat obligation for payer."""
        zakat_amount = self._calculator.calculate(wealth)
        return ZakatObligation(payer_id, wealth, zakat_amount)

# infrastructure/api/zakat_controller.py (depends on application)
from fastapi import APIRouter
from application.services.zakat_service import ZakatService

router = APIRouter()

@router.post("/zakat/calculate")
async def calculate_zakat(payer_id: str, wealth: Decimal):
    """API endpoint for Zakat calculation."""
    service = ZakatService(StandardZakatCalculator())
    obligation = service.calculate_obligation(payer_id, wealth)
    return {"zakat_amount": str(obligation.zakat_amount)}

# domain/zakat/models.py
from infrastructure.database import db  # BAD: Domain depends on infrastructure

class ZakatObligation:
    def save(self):  # BAD: Persistence logic in domain
        db.save(self)
```

**Why this matters**: Inward dependency direction (infrastructure → application → domain) keeps domain pure. Domain models contain business logic without technical concerns. Easier testing and portability.

### Explicit Exception Handling

```python
# GOOD: Explicit exception handling with context
from decimal import Decimal, InvalidOperation

class InvalidZakatAmount(ValueError):
    """Raised when Zakat amount calculation is invalid."""

    pass

def calculate_zakat_obligation(wealth_amount: Decimal, nisab: Decimal) -> Decimal:
    """Calculate Zakat obligation with explicit error handling.

    Args:
        wealth_amount: Total wealth subject to Zakat
        nisab: Minimum threshold for Zakat obligation

    Returns:
        Calculated Zakat amount (0 if below nisab)

    Raises:
        InvalidZakatAmount: If wealth_amount or nisab is negative
    """
    try:
        if wealth_amount < 0 or nisab < 0:
            raise InvalidZakatAmount("Wealth and nisab must be non-negative")

        if wealth_amount >= nisab:
            return wealth_amount * Decimal("0.025")
        return Decimal("0")

    except InvalidOperation as e:
        raise InvalidZakatAmount(f"Invalid decimal operation: {e}") from e

# BAD: Silent failure
def calculate_zakat_obligation(wealth_amount, nisab):
    try:
        if wealth_amount >= nisab:
            return wealth_amount * 0.025
    except:  # BAD: Bare except catches everything
        pass  # BAD: Silent failure hides errors
    return 0
```

**Why this matters**: Explicit exceptions document failure modes. Custom exceptions provide context. Chaining exceptions (`from e`) preserves stack traces. Silent failures hide bugs.

#### Error Handling Flow

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph LR
    A["Function Call<br/>with try/except"]:::blue --> B{"Raises<br/>Exception?"}:::orange

    B -->|"No"| C["✅ Return<br/>Success Value"]:::teal
    B -->|"Yes"| D{"Specific<br/>Exception?"}:::orange

    D -->|"Known Type"| E["Handle with<br/>except Type"]:::purple
    D -->|"Unknown"| F["Propagate Up<br/>Call Stack"]:::brown

    E --> G{"Need More<br/>Context?"}:::orange

    G -->|"Yes"| H["Chain Exception<br/>raise from e"]:::purple
    G -->|"No"| I["Handle<br/>Gracefully"]:::teal

    H --> J["Log Error<br/>with Context"]:::teal
    I --> J

    J --> K["Return Error<br/>or Raise"]:::brown

    F --> L["Caught by<br/>Higher Level"]:::brown

    classDef blue fill:#0173B2,stroke:#000,color:#fff
    classDef orange fill:#DE8F05,stroke:#000,color:#000
    classDef teal fill:#029E73,stroke:#000,color:#fff
    classDef purple fill:#CC78BC,stroke:#000,color:#000
    classDef brown fill:#CA9161,stroke:#000,color:#000
```

### Validation at Boundaries

```python
# GOOD: Validate at system boundaries using Pydantic
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal

class ZakatCalculationRequest(BaseModel):
    """Validate Zakat calculation requests at API boundary."""

    payer_id: str = Field(min_length=1, description="Unique payer identifier")
    wealth_amount: Decimal = Field(gt=0, description="Total qualifying wealth")
    nisab_threshold: Decimal = Field(gt=0, description="Nisab threshold")

    @field_validator("payer_id")
    @classmethod
    def validate_payer_id_format(cls, v: str) -> str:
        """Ensure payer ID follows expected format."""
        if not v.startswith("PAYER-"):
            raise ValueError("Payer ID must start with PAYER-")
        return v

# Usage in API endpoint
from fastapi import APIRouter

router = APIRouter()

@router.post("/zakat/calculate")
async def calculate_zakat(request: ZakatCalculationRequest):
    """Pydantic validates request automatically at boundary."""
    # Internal code trusts validated data
    zakat_amount = request.wealth_amount * Decimal("0.025")
    return {"payer_id": request.payer_id, "zakat_amount": str(zakat_amount)}

# BAD: No validation or validation scattered throughout
@router.post("/zakat/calculate")
async def calculate_zakat(payer_id: str, wealth_amount: float):  # BAD: No validation
    # BAD: Validation scattered in business logic
    if not payer_id:
        return {"error": "Invalid payer"}
    if wealth_amount <= 0:
        return {"error": "Invalid amount"}
    # More code...
```

**Why this matters**: Validate at boundaries (API, database, external services). Internal code trusts validated data. Pydantic centralizes validation. Reduces defensive programming clutter.

### Test Pyramid Strategy

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TB
    subgraph Pyramid[" "]
        E2E["🌐 End-to-End Tests<br/>Few, Slow, Expensive<br/>Full system integration"]:::purple
        Integration["🔗 Integration Tests<br/>Moderate quantity<br/>Component interactions"]:::orange
        Unit["⚡ Unit Tests<br/>Many, Fast, Cheap<br/>Individual functions"]:::teal
    end

    E2E --> Integration
    Integration --> Unit

    note1["70-80% Unit Tests<br/>Fast feedback,<br/>isolated failures"]:::teal
    note2["15-25% Integration Tests<br/>Verify component<br/>interactions"]:::orange
    note3["5-10% E2E Tests<br/>Critical user<br/>journeys"]:::purple

    Unit -.-> note1
    Integration -.-> note2
    E2E -.-> note3

    classDef blue fill:#0173B2,stroke:#000,color:#fff
    classDef orange fill:#DE8F05,stroke:#000,color:#000
    classDef teal fill:#029E73,stroke:#000,color:#fff
    classDef purple fill:#CC78BC,stroke:#000,color:#000
```

**Key Principles**:

- **Unit Tests (Base)**: Test individual functions and methods in isolation. Fast, deterministic, easy to debug.
- **Integration Tests (Middle)**: Test component interactions (database, API calls, message queues).
- **E2E Tests (Top)**: Test complete user workflows through the entire system. Slow but catch integration issues.

### Test Organization

```python

# tests/domain/zakat/test_calculator.py

import pytest
from decimal import Decimal
from ose_platform.domain.zakat.calculator import StandardZakatCalculator

class TestStandardZakatCalculator:
    """Test suite for standard Zakat calculation."""

    @pytest.fixture
    def calculator(self) -> StandardZakatCalculator:
        """Provide calculator instance for tests."""
        return StandardZakatCalculator()

    def test_calculate_returns_2_5_percent_of_wealth(
        self, calculator: StandardZakatCalculator
    ):
        """Verify Zakat is exactly 2.5% of wealth amount."""
        wealth = Decimal("100000.00")
        expected_zakat = Decimal("2500.00")

        result = calculator.calculate(wealth)

        assert result == expected_zakat

    def test_calculate_with_zero_wealth_returns_zero(
        self, calculator: StandardZakatCalculator
    ):
        """Verify zero wealth produces zero Zakat."""
        result = calculator.calculate(Decimal("0"))
        assert result == Decimal("0")

    @pytest.mark.parametrize(
        "wealth,expected_zakat",
        [
            (Decimal("100000.00"), Decimal("2500.00")),
            (Decimal("50000.00"), Decimal("1250.00")),
            (Decimal("1000.00"), Decimal("25.00")),
        ],
    )
    def test_calculate_with_various_amounts(
        self,
        calculator: StandardZakatCalculator,
        wealth: Decimal,
        expected_zakat: Decimal,
    ):
        """Verify Zakat calculation across various wealth amounts."""
        assert calculator.calculate(wealth) == expected_zakat

# BAD: Disorganized tests
def test1():  # BAD: Unclear test name
    c = StandardZakatCalculator()
    assert c.calculate(Decimal("100000")) == Decimal("2500")  # BAD: Magic numbers

def test2():  # BAD: Non-descriptive
    assert StandardZakatCalculator().calculate(Decimal("0")) == 0  # BAD: Mixed types
```

**Why this matters**: Organized test classes group related tests. Fixtures reduce duplication. Descriptive names document intent. Parameterized tests cover multiple cases concisely.

### Docstring Format

```python
# GOOD: Complete docstrings with Google style
from decimal import Decimal
from typing import Optional

def calculate_murabaha_total(
    asset_cost: Decimal,
    profit_margin_rate: Decimal,
    down_payment: Optional[Decimal] = None,
) -> Decimal:
    """Calculate total Murabaha cost-plus financing amount.

    Murabaha is Islamic financing where the seller discloses the cost of
    the asset and adds a profit margin agreed upon by both parties.

    Args:
        asset_cost: Original acquisition cost of the asset
        profit_margin_rate: Profit margin as decimal (0.15 = 15%)
        down_payment: Optional initial down payment to subtract from total

    Returns:
        Total amount to be financed (cost + profit - down payment)

    Raises:
        ValueError: If asset_cost or profit_margin_rate is negative
        ValueError: If down_payment exceeds total selling price

    Examples:
        >>> calculate_murabaha_total(Decimal("200000"), Decimal("0.15"))
        Decimal('230000.00')

        >>> calculate_murabaha_total(
        ...     Decimal("200000"),
        ...     Decimal("0.15"),
        ...     Decimal("50000")
        ... )
        Decimal('180000.00')
    """
    if asset_cost < 0:
        raise ValueError("Asset cost must be non-negative")
    if profit_margin_rate < 0:
        raise ValueError("Profit margin must be non-negative")

    total_selling_price = asset_cost + (asset_cost * profit_margin_rate)

    if down_payment is not None:
        if down_payment > total_selling_price:
            raise ValueError("Down payment exceeds total selling price")
        return total_selling_price - down_payment

    return total_selling_price

# BAD: Minimal or missing docstring
def calc_murabaha(c, r, d=None):  # BAD: No docstring, unclear parameters
    return c + (c * r) - (d or 0)
```

**Why this matters**: Complete docstrings document parameters, returns, exceptions, and usage. Examples demonstrate correct usage. Docstrings enable auto-generated documentation (Sphinx, MkDocs).

### Input Validation

```python
# GOOD: Validate and sanitize inputs
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
import re

class DonationPayment(BaseModel):
    """Donation payment with strict validation."""

    donor_id: str = Field(min_length=5, max_length=50)
    amount: Decimal = Field(gt=0, le=Decimal("1000000"))
    payment_reference: str = Field(min_length=1, max_length=100)

    @field_validator("donor_id")
    @classmethod
    def validate_donor_id_format(cls, v: str) -> str:
        """Ensure donor ID contains only alphanumeric and hyphens."""
        if not re.match(r"^[A-Z0-9-]+$", v):
            raise ValueError("Donor ID must be alphanumeric with hyphens")
        return v

    @field_validator("payment_reference")
    @classmethod
    def validate_payment_reference(cls, v: str) -> str:
        """Sanitize payment reference to prevent injection."""
        # Remove potentially dangerous characters
        sanitized = re.sub(r"[^\w\s-]", "", v)
        if not sanitized:
            raise ValueError("Payment reference invalid after sanitization")
        return sanitized

# BAD: No validation, SQL injection risk
def record_donation(donor_id: str, amount: float):
    query = f"INSERT INTO donations VALUES ('{donor_id}', {amount})"  # BAD: SQL injection
    db.execute(query)
```

**Why this matters**: Input validation prevents injection attacks. Pydantic validates types and constraints. Regular expressions sanitize strings. Never trust user input.

### Secrets Management

```python
# GOOD: Use environment variables and secrets management
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment."""

    database_url: str
    api_key: str
    jwt_secret: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Usage
settings = Settings()

# BAD: Hardcoded secrets
DATABASE_URL = "postgresql://user:password@localhost/db"  # BAD: Hardcoded credentials
API_KEY = "sk-1234567890abcdef"  # BAD: Exposed secret
```

**Why this matters**: Environment variables separate configuration from code. Never commit secrets to version control. Use `.env` files (excluded from git) for local development. Production uses secret managers (AWS Secrets Manager, HashiCorp Vault).

### Avoid Mutable Default Arguments

```python
# GOOD: Use None as default, create mutable in function
from typing import List, Optional

def process_donations(
    donations: Optional[List[Decimal]] = None,
) -> Decimal:
    """Process list of donations and return total."""
    if donations is None:
        donations = []  # Create new list each call

    return sum(donations)

# BAD: Mutable default argument
def process_donations(donations: List[Decimal] = []) -> Decimal:  # BAD: Mutable default
    """BAD: Default list is shared across calls!"""
    donations.append(Decimal("10.00"))  # BAD: Modifies shared default
    return sum(donations)

# Decimal('20.00')
```

**Why this matters**: Mutable defaults (`[]`, `{}`) are evaluated once at function definition. All calls share the same instance. Use `None` as default and create new instances in function body.

### Avoid Bare Except

```python
# GOOD: Catch specific exceptions
from decimal import Decimal, InvalidOperation

def parse_zakat_amount(amount_str: str) -> Decimal:
    """Parse Zakat amount from string with specific exception handling."""
    try:
        return Decimal(amount_str)
    except InvalidOperation as e:
        raise ValueError(f"Invalid Zakat amount format: {amount_str}") from e

# BAD: Bare except catches everything
def parse_zakat_amount(amount_str: str) -> Decimal:
    try:
        return Decimal(amount_str)
    except:  # BAD: Catches KeyboardInterrupt, SystemExit, etc.
        return Decimal("0")  # BAD: Silent failure
```

**Why this matters**: Bare `except:` catches all exceptions including system exits. Specific exceptions document expected failures. Exception chaining preserves debugging information.

## Async/Await Best Practices

Python's async/await syntax (PEP 492) enables concurrent I/O-bound operations without threads. Async code is crucial for scalable web services and database operations.

### When to Use Async

**Use async for**:

- I/O-bound operations (API calls, database queries, file operations)
- Concurrent HTTP requests
- WebSocket connections
- Event-driven systems
- Real-time data streaming

**Do NOT use async for**:

- CPU-bound operations (use multiprocessing instead)
- Simple scripts with no I/O
- Legacy code with synchronous dependencies

### Async Context Managers

```python
# GOOD: Proper async context manager
import aiohttp
from decimal import Decimal

async def fetch_gold_price(api_url: str) -> Decimal:
    """Fetch current gold price using async HTTP."""
    async with aiohttp.ClientSession() as session:
        async with session.get(api_url) as response:
            data = await response.json()
            return Decimal(str(data["price_per_gram"]))

# GOOD: Multiple concurrent requests
async def fetch_all_commodity_prices(urls: dict[str, str]) -> dict[str, Decimal]:
    """Fetch multiple commodity prices concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for commodity, url in urls.items():
            task = _fetch_price(session, url)
            tasks.append(task)

        results = await asyncio.gather(*tasks)
        return dict(zip(urls.keys(), results))

async def _fetch_price(session: aiohttp.ClientSession, url: str) -> Decimal:
    """Helper to fetch single price."""
    async with session.get(url) as response:
        data = await response.json()
        return Decimal(str(data["price"]))

# FAIL: Blocking in async context
async def bad_async_fetch() -> Decimal:
    """BAD: Blocks event loop with synchronous sleep."""
    import time

    time.sleep(1)  # BAD: Blocks entire event loop!
    response = requests.get(url)  # BAD: Synchronous HTTP blocks async
    return Decimal(response.json()["price"])
```

### Common Async Pitfalls

```python
# FAIL: Not awaiting coroutines
async def calculate_zakat_portfolio_bad(accounts: list[Account]) -> Decimal:
    """BAD: Creates coroutines but never awaits them."""
    tasks = [calculate_zakat_async(acc) for acc in accounts]
    # BAD: Returns list of coroutines, not results!
    return sum(tasks, Decimal(0))  # TypeError!

# GOOD: Properly await with asyncio.gather
async def calculate_zakat_portfolio(accounts: list[Account]) -> Decimal:
    """Calculate Zakat for multiple accounts concurrently."""
    tasks = [calculate_zakat_async(acc) for acc in accounts]
    results = await asyncio.gather(*tasks)  # Actually await results
    return sum(results, Decimal(0))

# FAIL: Blocking CPU work in async
async def bad_heavy_computation() -> Decimal:
    """BAD: CPU-bound work blocks event loop."""
    # This blocks the event loop for seconds!
    total = Decimal(0)
    for i in range(10_000_000):
        total += Decimal(i) * Decimal("0.025")
    return total

# GOOD: Offload CPU work to thread pool
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def good_heavy_computation() -> Decimal:
    """Offload CPU-bound work to thread pool."""
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        result = await loop.run_in_executor(executor, _heavy_calculation)
    return result

def _heavy_calculation() -> Decimal:
    """Synchronous CPU-intensive calculation."""
    total = Decimal(0)
    for i in range(10_000_000):
        total += Decimal(i) * Decimal("0.025")
    return total
```

### Resource Management

```python
# GOOD: Proper async resource cleanup
from contextlib import asynccontextmanager
import asyncpg

@asynccontextmanager
async def get_database_connection():
    """Async context manager for database connections."""
    conn = await asyncpg.connect("postgresql://...")
    try:
        yield conn
    finally:
        await conn.close()  # Ensure cleanup even on error

async def record_zakat_payment(payer_id: str, amount: Decimal) -> str:
    """Record Zakat payment with proper resource management."""
    async with get_database_connection() as conn:
        query = """
            INSERT INTO zakat_payments (payer_id, amount, paid_at)
            VALUES ($1, $2, NOW())
            RETURNING payment_id
        """
        payment_id = await conn.fetchval(query, payer_id, amount)
        return payment_id

# FAIL: Resource leak
async def record_zakat_payment_bad(payer_id: str, amount: Decimal) -> str:
    """BAD: Connection never closed on error."""
    conn = await asyncpg.connect("postgresql://...")
    query = "INSERT INTO zakat_payments VALUES ($1, $2, NOW()) RETURNING payment_id"
    payment_id = await conn.fetchval(query, payer_id, amount)
    # If error occurs before this line, connection leaks!
    await conn.close()
    return payment_id
```

### Islamic Finance Async Example

```python
# Complete async Zakat calculation service
from dataclasses import dataclass
from decimal import Decimal
import asyncpg
import aiohttp

@dataclass
class ZakatPortfolio:
    """Zakat portfolio with multiple accounts."""

    account_id: str
    cash_balance: Decimal
    gold_grams: Decimal
    silver_grams: Decimal

async def calculate_total_zakat(
    portfolios: list[ZakatPortfolio], nisab_usd: Decimal
) -> dict[str, Decimal]:
    """
    Calculate Zakat for all portfolios concurrently.

    Fetches current commodity prices and calculates obligations in parallel.
    """
    # Fetch commodity prices concurrently
    async with aiohttp.ClientSession() as session:
        gold_price, silver_price = await asyncio.gather(
            _fetch_commodity_price(session, "gold"),
            _fetch_commodity_price(session, "silver"),
        )

    # Calculate Zakat for all portfolios concurrently
    tasks = [
        _calculate_portfolio_zakat(p, gold_price, silver_price, nisab_usd)
        for p in portfolios
    ]
    results = await asyncio.gather(*tasks)

    # Return mapping of account_id to Zakat amount
    return {p.account_id: zakat for p, zakat in zip(portfolios, results)}

async def _fetch_commodity_price(
    session: aiohttp.ClientSession, commodity: str
) -> Decimal:
    """Fetch commodity price from external API."""
    url = f"https://api.commodities.com/{commodity}/price"
    async with session.get(url) as response:
        data = await response.json()
        return Decimal(str(data["usd_per_gram"]))

async def _calculate_portfolio_zakat(
    portfolio: ZakatPortfolio,
    gold_price: Decimal,
    silver_price: Decimal,
    nisab_usd: Decimal,
) -> Decimal:
    """Calculate Zakat for single portfolio."""
    total_wealth = (
        portfolio.cash_balance
        + (portfolio.gold_grams * gold_price)
        + (portfolio.silver_grams * silver_price)
    )

    if total_wealth >= nisab_usd:
        return total_wealth * Decimal("0.025")
    return Decimal("0")
```

**Why async matters**: Islamic finance platforms handle thousands of concurrent Zakat calculations during Ramadan. Async enables processing 1000 portfolios in ~2 seconds (concurrent API calls + DB queries) versus ~30 seconds synchronously. Critical for user experience during peak times.

## Type Hints Advanced Patterns

Beyond basic type hints, Python provides advanced patterns for complex type relationships and domain modeling.

### Generic Types and TypeVars

```python
# GOOD: Generic type for reusable components
from typing import TypeVar, Generic, Protocol
from decimal import Decimal

T = TypeVar("T")

class Repository(Generic[T]):
    """Generic repository pattern for any entity type."""

    def __init__(self, entity_type: type[T]):
        self._entity_type = entity_type
        self._storage: dict[str, T] = {}

    def save(self, entity_id: str, entity: T) -> None:
        """Save entity to repository."""
        self._storage[entity_id] = entity

    def find_by_id(self, entity_id: str) -> T | None:
        """Find entity by ID."""
        return self._storage.get(entity_id)

# Usage: Type safety preserved
@dataclass
class ZakatPayment:
    payment_id: str
    amount: Decimal

payment_repo = RepositoryZakatPayment
payment = ZakatPayment("PAY-001", Decimal("2500"))
payment_repo.save("PAY-001", payment)
found = payment_repo.find_by_id("PAY-001")  # Type: ZakatPayment | None
```

### Protocol vs ABC

```python
# GOOD: Structural typing with Protocol
from typing import Protocol
from decimal import Decimal

class Calculable(Protocol):
    """Protocol for anything that can be calculated."""

    def calculate(self) -> Decimal:
        """Calculate and return result."""
        ...

class ZakatCalculator:
    """Satisfies Calculable without explicit inheritance."""

    def calculate(self) -> Decimal:
        return Decimal("2500")

class TaxCalculator:
    """Also satisfies Calculable without inheritance."""

    def calculate(self) -> Decimal:
        return Decimal("5000")

def process_calculation(calc: Calculable) -> Decimal:
    """Process any object with calculate() method."""
    return calc.calculate()

# Both work without explicit inheritance!
zakat_total = process_calculation(ZakatCalculator())
tax_total = process_calculation(TaxCalculator())

# FAIL: Runtime overhead with ABC
from abc import ABC, abstractmethod

class CalculableABC(ABC):
    """BAD: Requires explicit inheritance."""

    @abstractmethod
    def calculate(self) -> Decimal:
        pass

class ZakatCalculator(CalculableABC):  # FAIL: Forced to inherit
    def calculate(self) -> Decimal:
        return Decimal("2500")
```

**Why Protocols matter**: Protocols enable duck typing with type checking. No runtime overhead. Compatible with existing code without refactoring inheritance hierarchies.

### NewType for Domain Types

```python
# GOOD: NewType for domain-specific semantics
from typing import NewType
from decimal import Decimal

NisabAmount = NewType("NisabAmount", Decimal)
ZakatRate = NewType("ZakatRate", Decimal)
WealthAmount = NewType("WealthAmount", Decimal)

def calculate_zakat(
    wealth: WealthAmount, nisab: NisabAmount, rate: ZakatRate
) -> Decimal:
    """Type-safe Zakat calculation with domain types."""
    if wealth >= nisab:
        return wealth * rate
    return Decimal("0")

# Usage: Type checker enforces correct types
wealth = WealthAmount(Decimal("100000"))
nisab = NisabAmount(Decimal("5000"))
rate = ZakatRate(Decimal("0.025"))

zakat = calculate_zakat(wealth, nisab, rate)  # OK

# FAIL: Plain Decimal loses semantic information
def calculate_zakat_bad(wealth: Decimal, nisab: Decimal, rate: Decimal) -> Decimal:
    """BAD: No protection against argument confusion."""
    return wealth * rate if wealth >= nisab else Decimal("0")

# Easy to make mistakes with plain Decimal
zakat = calculate_zakat_bad(nisab, wealth, rate)  # Oops! Wrong order, no error
```

**Why NewType matters**: NewType creates distinct types at type-check time with zero runtime cost. Prevents argument confusion in financial calculations where mixing up nisab/wealth/rate could cause incorrect Zakat amounts.

### Type Guards

```python
# GOOD: Type guards for runtime type narrowing
from typing import TypeGuard
from decimal import Decimal

def is_valid_nisab(value: Decimal) -> TypeGuard[NisabAmount]:
    """Type guard to validate nisab amount."""
    return value > 0

def is_valid_zakat_rate(value: Decimal) -> TypeGuard[ZakatRate]:
    """Type guard to validate Zakat rate."""
    return Decimal("0") <= value <= Decimal("1")

def process_zakat_input(wealth: Decimal, nisab: Decimal, rate: Decimal) -> Decimal:
    """Process Zakat calculation with type guards."""
    if not is_valid_nisab(nisab):
        raise ValueError("Nisab must be positive")

    if not is_valid_zakat_rate(rate):
        raise ValueError("Zakat rate must be between 0 and 1")

    # After type guards, mypy knows these are valid types
    return calculate_zakat(
        WealthAmount(wealth), nisab, rate  # nisab is NisabAmount, rate is ZakatRate
    )
```

**Why type guards matter**: Type guards combine runtime validation with static type narrowing. After guard check, mypy treats value as narrowed type. Enables safe conversion from general types to domain-specific NewTypes.

## Performance Optimization

Performance optimization requires measurement before action. "Premature optimization is the root of all evil" - Donald Knuth.

### Profiling First

```python
# GOOD: Profile before optimizing
import cProfile
import pstats
from decimal import Decimal

def calculate_zakat_for_users(user_count: int) -> list[Decimal]:
    """Calculate Zakat for many users (to be profiled)."""
    results = []
    for i in range(user_count):
        wealth = Decimal(str(i * 1000))
        nisab = Decimal("5000")
        zakat = calculate_zakat(wealth, nisab)
        results.append(zakat)
    return results

# Profile the code
if __name__ == "__main__":
    profiler = cProfile.Profile()
    profiler.enable()

    calculate_zakat_for_users(10_000)

    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats("cumulative")
    stats.print_stats(10)  # Show top 10 slowest functions

# Memory profiling with memory_profiler
from memory_profiler import profile

@profile
def process_large_dataset():
    """Profile memory usage of large dataset processing."""
    data = [Decimal(str(i)) for i in range(1_000_000)]
    total = sum(data)
    return total
```

### List Comprehensions vs Loops

```python
# GOOD: List comprehension (faster and more Pythonic)
from decimal import Decimal

wealth_list = [Decimal(str(i * 1000)) for i in range(10_000)]
nisab = Decimal("5000")

zakat_amounts = [
    wealth * Decimal("0.025") for wealth in wealth_list if wealth > nisab
]

# FAIL: Explicit loop (slower and more verbose)
zakat_amounts = []
for wealth in wealth_list:
    if wealth > nisab:
        zakat_amounts.append(wealth * Decimal("0.025"))

# Speedup: 1.5x faster
```

### Generator Expressions for Large Data

```python
# GOOD: Generator (memory efficient for large datasets)
from decimal import Decimal

def calculate_total_zakat_stream(wealth_stream: list[Decimal]) -> Decimal:
    """Calculate total Zakat using generator (O(1) memory)."""
    nisab = Decimal("5000")
    # Generator: yields one value at a time
    zakat_gen = (
        wealth * Decimal("0.025") for wealth in wealth_stream if wealth > nisab
    )
    return sum(zakat_gen)

# FAIL: List comprehension (memory hungry for large datasets)
def calculate_total_zakat_list(wealth_stream: list[Decimal]) -> Decimal:
    """Calculate total Zakat using list (O(n) memory)."""
    nisab = Decimal("5000")
    # List: builds entire list in memory first
    zakat_list = [
        wealth * Decimal("0.025") for wealth in wealth_stream if wealth > nisab
    ]
    return sum(zakat_list)

# Memory savings: 9.5x less memory
```

### Caching with lru_cache

```python
# GOOD: Cache expensive calculations
from functools import lru_cache
from decimal import Decimal

@lru_cache(maxsize=128)
def get_nisab_threshold(year: int, region: str) -> Decimal:
    """
    Calculate nisab threshold for given year and region.

    Cached because:
    - Expensive API calls to fetch historical gold prices
    - Result doesn't change for same year/region
    - Frequently called during Zakat calculations
    """
    # Simulate expensive API call
    gold_price = _fetch_historical_gold_price(year, region)
    return gold_price * 85  # 85 grams of gold

# First call: Cache miss, computes result
nisab_2024_mecca = get_nisab_threshold(2024, "mecca")  # ~500ms

# Second call: Cache hit, instant return
nisab_2024_mecca = get_nisab_threshold(2024, "mecca")  # ~0.01ms

# FAIL: No caching, repeated expensive calculations
def get_nisab_threshold_no_cache(year: int, region: str) -> Decimal:
    """BAD: Recomputes same values repeatedly."""
    gold_price = _fetch_historical_gold_price(year, region)  # 500ms every call
    return gold_price * 85
```

### Islamic Finance Performance Example

```python
# GOOD: Optimized Murabaha markup calculation with caching
from functools import lru_cache
from decimal import Decimal

@lru_cache(maxsize=256)
def calculate_murabaha_markup(
    principal: Decimal, annual_rate: Decimal, months: int
) -> Decimal:
    """
    Calculate Murabaha markup with caching.

    Cached because:
    - Common principal amounts (50K, 100K, 200K)
    - Standard rates (10%, 12%, 15%)
    - Standard terms (12, 24, 36, 60 months)
    - Combinatorial explosion: 3 × 3 × 4 = 36 common cases
    """
    return principal * annual_rate * Decimal(months) / Decimal(12)

# Usage in Murabaha contract processing
def create_murabaha_contracts(requests: list[MurabahaRequest]) -> list[Contract]:
    """Process many Murabaha requests efficiently."""
    contracts = []
    for req in requests:
        # Cached for repeated principal/rate/term combinations
        markup = calculate_murabaha_markup(req.principal, req.rate, req.months)
        total = req.principal + markup
        contracts.append(Contract(req.customer_id, total, req.months))
    return contracts

# Speedup: 56x faster
```

**Why performance optimization matters**: During Ramadan, Islamic finance platforms process millions of Zakat calculations. Optimizations reduce API costs (fewer gold price lookups via caching), improve user experience (faster response times), and enable higher throughput with same infrastructure.

## Domain-Driven Design Patterns

Domain-Driven Design (DDD) structures code around business domains. Critical for complex financial applications like Islamic finance.

### Value Objects with Dataclasses

```python
# GOOD: Immutable value object with validation
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Money:
    """Value object representing monetary amount with currency."""

    amount: Decimal
    currency: str

    def __post_init__(self):
        """Validate value object invariants."""
        if self.amount < 0:
            raise ValueError("Money amount cannot be negative")
        if not self.currency:
            raise ValueError("Currency must be specified")
        if self.currency not in ["USD", "SAR", "AED", "MYR"]:
            raise ValueError(f"Unsupported currency: {self.currency}")

    def add(self, other: "Money") -> "Money":
        """Add two Money values (must be same currency)."""
        if self.currency != other.currency:
            raise ValueError(
                f"Cannot add {self.currency} and {other.currency} directly"
            )
        return Money(self.amount + other.amount, self.currency)

    def multiply(self, factor: Decimal) -> "Money":
        """Multiply money by scalar factor."""
        return Money(self.amount * factor, self.currency)

# Usage: Type-safe monetary operations
donation_usd = Money(Decimal("100.00"), "USD")
zakat_usd = Money(Decimal("2500.00"), "USD")
total_usd = donation_usd.add(zakat_usd)  # Money(Decimal('2600.00'), 'USD')

# Prevents errors
donation_sar = Money(Decimal("375.00"), "SAR")

# FAIL: Plain Decimal loses currency information
def add_money_bad(amt1: Decimal, amt2: Decimal) -> Decimal:
    """BAD: No currency tracking, easy to mix currencies."""
    return amt1 + amt2  # Could be adding USD + SAR!

# Easy to make mistakes
total = add_money_bad(Decimal("100.00"), Decimal("375.00"))  # Is this USD? SAR? Mixed?
```

### Entities with Identity

```python
# GOOD: Entity with unique identity and lifecycle
from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime
from decimal import Decimal

@dataclass
class Donation:
    """Entity: Donation with unique identity."""

    # Identity field
    id: UUID = field(default_factory=uuid4)

    # Value object
    amount: Money

    # References to other entities
    donor_id: UUID
    campaign_id: UUID

    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __eq__(self, other: object) -> bool:
        """Entities equal if same ID (not value equality)."""
        if not isinstance(other, Donation):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash based on identity."""
        return hash(self.id)

# Usage: Identity-based equality
donation1 = Donation(
    amount=Money(Decimal("100"), "USD"),
    donor_id=UUID("550e8400-e29b-41d4-a716-446655440001"),
    campaign_id=UUID("550e8400-e29b-41d4-a716-446655440002"),
)

donation2 = Donation(
    id=donation1.id,  # Same ID
    amount=Money(Decimal("200"), "USD"),  # Different amount
    donor_id=donation1.donor_id,
    campaign_id=donation1.campaign_id,
)

# Entities equal if same ID, even if different amounts
assert donation1 == donation2  # True - same entity identity
```

### Aggregates and Aggregate Roots

```python
# GOOD: Aggregate root controlling consistency boundary
from dataclasses import dataclass, field
from uuid import UUID, uuid4

@dataclass
class DonationCampaignCreated:
    """Domain event: Campaign created."""

    campaign_id: UUID
    goal: Money
    created_at: datetime

@dataclass
class GoalReachedEvent:
    """Domain event: Campaign goal reached."""

    campaign_id: UUID
    total_raised: Money
    reached_at: datetime

class DonationCampaign:
    """Aggregate root for donation campaigns."""

    def __init__(self, campaign_id: UUID, goal: Money):
        # Aggregate root identity
        self.id = campaign_id
        self._goal = goal
        self._donations: list[Donation] = []
        self._events: list[DomainEvent] = []

        # Record creation event
        self._events.append(DonationCampaignCreated(campaign_id, goal, datetime.utcnow()))

    @property
    def total_raised(self) -> Money:
        """Calculate total from all donations."""
        if not self._donations:
            return Money(Decimal("0"), self._goal.currency)

        total = self._donations[0].amount
        for donation in self._donations[1:]:
            total = total.add(donation.amount)
        return total

    def add_donation(self, donation: Donation) -> None:
        """
        Add donation to campaign (aggregate root controls this).

        Ensures:
        - Currency matches campaign goal
        - Events emitted when goal reached
        - Consistency within aggregate boundary
        """
        if donation.amount.currency != self._goal.currency:
            raise ValueError(
                f"Donation currency {donation.amount.currency} "
                f"does not match goal currency {self._goal.currency}"
            )

        self._donations.append(donation)

        # Check if goal reached and emit event
        if not self._goal_reached and self.total_raised.amount >= self._goal.amount:
            self._goal_reached = True
            self._events.append(
                GoalReachedEvent(self.id, self.total_raised, datetime.utcnow())
            )

    def get_events(self) -> list[DomainEvent]:
        """Return domain events for publishing."""
        events = self._events.copy()
        self._events.clear()
        return events

# Usage: Aggregate root enforces invariants
campaign = DonationCampaign(
    campaign_id=uuid4(), goal=Money(Decimal("10000"), "USD")
)

donation1 = Donation(
    amount=Money(Decimal("2500"), "USD"),
    donor_id=uuid4(),
    campaign_id=campaign.id,
)
campaign.add_donation(donation1)  # OK

donation2 = Donation(
    amount=Money(Decimal("500"), "SAR"),  # Wrong currency!
    donor_id=uuid4(),
    campaign_id=campaign.id,
)
# campaign.add_donation(donation2)  # ValueError: Currency mismatch!
```

### Repository Pattern

```python
# GOOD: Repository abstracts persistence
from abc import ABC, abstractmethod
from typing import Protocol

class DonationRepository(ABC):
    """Repository interface for Donation aggregate."""

    @abstractmethod
    async def save(self, donation: Donation) -> None:
        """Persist donation."""
        ...

    @abstractmethod
    async def find_by_id(self, donation_id: UUID) -> Donation | None:
        """Find donation by ID."""
        ...

    @abstractmethod
    async def find_by_campaign(self, campaign_id: UUID) -> list[Donation]:
        """Find all donations for campaign."""
        ...

class PostgresDonationRepository(DonationRepository):
    """PostgreSQL implementation of DonationRepository."""

    def __init__(self, connection_pool: asyncpg.Pool):
        self._pool = connection_pool

    async def save(self, donation: Donation) -> None:
        """Save donation to PostgreSQL."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO donations (id, amount, currency, donor_id, campaign_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    amount = EXCLUDED.amount,
                    currency = EXCLUDED.currency
                """,
                donation.id,
                donation.amount.amount,
                donation.amount.currency,
                donation.donor_id,
                donation.campaign_id,
                donation.created_at,
            )

    async def find_by_id(self, donation_id: UUID) -> Donation | None:
        """Find donation by ID from PostgreSQL."""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM donations WHERE id = $1", donation_id
            )
            if row:
                return self._map_to_donation(row)
            return None

    async def find_by_campaign(self, campaign_id: UUID) -> list[Donation]:
        """Find all donations for campaign."""
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM donations WHERE campaign_id = $1", campaign_id
            )
            return [self._map_to_donation(row) for row in rows]

    def _map_to_donation(self, row) -> Donation:
        """Map database row to Donation entity."""
        return Donation(
            id=row["id"],
            amount=Money(row["amount"], row["currency"]),
            donor_id=row["donor_id"],
            campaign_id=row["campaign_id"],
            created_at=row["created_at"],
        )

# Usage: Application code depends on interface, not implementation
async def process_donation_payment(
    donation_id: UUID, repo: DonationRepository
) -> None:
    """Process donation using repository abstraction."""
    donation = await repo.find_by_id(donation_id)
    if donation:
        # Process payment logic
        await repo.save(donation)
```

**Why DDD matters**: Islamic finance involves complex business rules (Shariah compliance, nisab thresholds, profit-sharing ratios). DDD patterns (Value Objects, Entities, Aggregates, Repositories) model these concepts explicitly in code. Money value object prevents currency mixing errors. DonationCampaign aggregate enforces goal-tracking invariants. Repository abstracts persistence for testability.

### Official Documentation

- [PEP 8 - Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [PEP 20 - The Zen of Python](https://peps.python.org/pep-0020/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)
- [PEP 544 - Protocols](https://peps.python.org/pep-0544/)
- [Python Documentation](https://docs.python.org/3/)

## Best Practices Checklist

Use this checklist to ensure your Python code follows best practices:

### Code Quality

- [ ] All code formatted with `ruff format` or `black`
- [ ] Module names are lowercase with underscores (`zakat_calculator.py`)
- [ ] Class names use PascalCase (`ZakatCalculator`)
- [ ] Function/variable names use snake_case (`calculate_zakat`)
- [ ] Constants use UPPER_CASE (`ZAKAT_RATE`)
- [ ] Type hints added to all function signatures
- [ ] Imports organized: standard library → third-party → local

### Software Engineering Principles

- [ ] **Automation**: `pytest` runs on every commit
- [ ] **Automation**: `ruff check` and `mypy` integrated in CI pipeline
- [ ] **Automation**: Code coverage enforced (85% minimum with pytest-cov)
- [ ] **Explicit**: Type hints on all public functions
- [ ] **Explicit**: Pydantic models for validation at boundaries
- [ ] **Explicit**: No mutable default arguments (`None` used instead)
- [ ] **Explicit**: Configuration loaded explicitly (no magic defaults)
- [ ] **Immutability**: `@dataclass(frozen=True)` for immutable data classes
- [ ] **Immutability**: Tuples used instead of lists where data shouldn't change
- [ ] **Immutability**: `frozenset` used instead of `set` for immutable collections
- [ ] **Pure Functions**: Business logic functions have no side effects
- [ ] **Pure Functions**: No global state in calculation modules
- [ ] **Pure Functions**: Deterministic outputs for same inputs
- [ ] **Reproducibility**: `requirements.txt` with exact versions committed
- [ ] **Reproducibility**: Virtual environment used (`venv` or `virtualenv`)
- [ ] **Reproducibility**: Docker images pin Python version (e.g., `python:3.11.11-slim`)

### Type Safety (mypy)

- [ ] All public functions have type hints (parameters and return types)
- [ ] `mypy` runs in strict mode (`strict = true` in `pyproject.toml`)
- [ ] Generic types used for collections (`list[str]`, not just `list`)
- [ ] `Protocol` used for structural subtyping (duck typing with types)
- [ ] `NewType` used for domain-specific types (e.g., `NisabAmount`)
- [ ] Type guards used for runtime type narrowing
- [ ] `TypeVar` used for generic functions and classes

### Error Handling

- [ ] Custom exception classes defined for domain errors
- [ ] Exceptions documented in docstrings (`Raises:` section)
- [ ] Exception chaining used (`raise ... from e`)
- [ ] No bare `except:` clauses (catch specific exceptions)
- [ ] Pydantic validation at system boundaries (API, database)
- [ ] Input validation prevents injection attacks

### Testing

- [ ] Test classes organize related tests (`class TestZakatCalculator`)
- [ ] Test functions named descriptively (`test_calculate_returns_2_5_percent`)
- [ ] `@pytest.fixture` used for test setup/teardown
- [ ] `@pytest.mark.parametrize` used for table-driven tests
- [ ] Mocks created via dependency injection (not monkey patching)
- [ ] Coverage reports generated: `pytest --cov=src --cov-report=html`

### Async/Await

- [ ] `async def` used for I/O-bound operations (API calls, database queries)
- [ ] `await` used with all coroutines (no forgotten awaits)
- [ ] `asyncio.gather()` used for concurrent operations
- [ ] CPU-bound work offloaded to thread pool (`loop.run_in_executor()`)
- [ ] Async context managers used for resource cleanup
- [ ] No blocking calls in async functions (`time.sleep()` → `asyncio.sleep()`)

### Performance

- [ ] Profiling used before optimization (`cProfile`, `memory_profiler`)
- [ ] List comprehensions used instead of explicit loops (when clearer)
- [ ] Generator expressions used for large datasets (memory efficiency)
- [ ] `@lru_cache` used for expensive repeated calculations
- [ ] `Decimal` used for financial calculations (not `float`)

### Documentation

- [ ] Module docstrings explain purpose and usage
- [ ] Public functions have docstrings with Google or NumPy style
- [ ] Docstrings include `Args:`, `Returns:`, `Raises:`, `Examples:` sections
- [ ] Complex algorithms explained with inline comments
- [ ] README updated for new features

### Security

- [ ] Input validation with Pydantic at all boundaries
- [ ] Regular expressions sanitize potentially dangerous input
- [ ] Secrets loaded from environment variables (not hardcoded)
- [ ] Parameterized database queries (no string concatenation)
- [ ] Sensitive data never logged
- [ ] `secrets` module used for cryptographic randomness (not `random`)

### Domain-Driven Design

- [ ] Value objects created with `@dataclass(frozen=True)`
- [ ] Entities have unique identity and `__eq__` based on ID
- [ ] Aggregates enforce consistency boundaries
- [ ] Repository pattern abstracts persistence
- [ ] Domain events emitted for important state changes

### Financial Domain (Islamic Finance)

- [ ] Zakat calculations use `Decimal`, not `float`
- [ ] Murabaha contracts have explicit cost + profit fields
- [ ] Money value object prevents currency mixing errors
- [ ] All financial transactions logged for audit trails
- [ ] Shariah compliance verified for new features

### Version Control

- [ ] Commits follow Conventional Commits format
- [ ] Changes reviewed before merging to `main`
- [ ] No sensitive data in repository (credentials, API keys)
- [ ] `.env` files excluded from version control
- [ ] Pre-commit hooks run `ruff`, `mypy`, and `pytest`

### Related Documentation

- [Python Idioms](./idioms.md) - Pythonic patterns
- [Type Safety](./type-safety.md) - Type hints and mypy
- [Error Handling](./error-handling.md) - Exception patterns
- [Linting and Formatting](./linting-and-formatting.md) - Automated tools
- [Test-Driven Development](./test-driven-development.md) - Testing practices

### Tools

- [Ruff](https://docs.astral.sh/ruff/) - Fast Python linter and formatter
- [Black](https://black.readthedocs.io/) - Opinionated code formatter
- [mypy](https://mypy.readthedocs.io/) - Static type checker
- [pytest](https://docs.pytest.org/) - Testing framework
- [Pydantic](https://docs.pydantic.dev/) - Data validation

---

**Python Version**: 3.11+ (baseline), 3.12+ (stable maintenance), 3.14.x (latest stable)
**Maintainers**: OSE Platform Documentation Team

## Python Code Organization

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#fff','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart LR
    A[Python Project] --> B[src/<br/>Source Code]
    A --> C[tests/<br/>Test Files]
    A --> D[docs/<br/>Documentation]
    A --> E[config/<br/>Configuration]

    B --> B1[domain/<br/>Business Logic]
    B --> B2[infrastructure/<br/>External]
    B --> B3[application/<br/>Use Cases]

    C --> C1[unit/<br/>pytest]
    C --> C2[integration/<br/>fixtures]
    C --> C3[e2e/<br/>selenium]

    D --> D1[Sphinx<br/>API Docs]
    D --> D2[Markdown<br/>README]

    E --> E1[pyproject.toml<br/>Modern Config]
    E --> E2[.env<br/>Secrets]

    B1 --> F[zakat_service.py]
    B1 --> G[donation_service.py]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#CC78BC,color:#fff
    style E fill:#0173B2,color:#fff
    style F fill:#DE8F05,color:#fff
    style G fill:#029E73,color:#fff
```

## Code Quality Pipeline

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#000','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
graph TD
    A[Code] --> B["black → isort<br/>Format + Sort"]
    B --> C["mypy → pylint<br/>Type + Lint"]
    C --> D[pytest<br/>Testing]
    D --> G{Pass?}

    G -->|Yes| H[Coverage Check]
    G -->|No| I[Fix Issues]

    H --> J{">85%?"}
    J -->|Yes| K[Build]
    J -->|No| I

    K --> L[Deploy]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#DE8F05,color:#fff
    style D fill:#029E73,color:#fff
    style H fill:#CC78BC,color:#fff
    style L fill:#0173B2,color:#fff
```
