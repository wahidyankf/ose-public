---
title: Python Security
description: Secure coding practices in Python including SQL injection prevention, XSS defense, authentication patterns, secrets management, and dependency scanning for financial applications
category: explanation
subcategory: prog-lang
tags:
  - python
  - security
  - injection-prevention
  - authentication
  - cryptography
  - secrets-management
related:
  - ./ex-soen-prla-py__web-services.md
  - ./ex-soen-prla-py__best-practices.md
principles:
  - explicit-over-implicit
updated: 2025-01-23
---

# Python Security

**Quick Reference**: [Overview](#overview) | [SQL Injection](#sql-injection-prevention) | [XSS Prevention](#xss-prevention) | [Authentication](#authentication) | [Secrets Management](#secrets-management) | [Dependency Scanning](#dependency-scanning) | [Input Validation](#input-validation) | [Cryptography](#cryptography) | [Financial Domain Security](#financial-domain-security) | [References](#references)

## Overview

Security is critical for financial applications handling sensitive Zakat calculations, donor information, and transaction data. Python provides tools and patterns to prevent common vulnerabilities.

## SQL Injection Prevention

Use parameterized queries, never string concatenation.

### The Problem

```python
# BAD: SQL injection vulnerability
import sqlite3


def get_zakat_records_unsafe(payer_id: str):
    """VULNERABLE: SQL injection risk."""
    conn = sqlite3.connect("zakat.db")
    cursor = conn.cursor()

    # BAD: String interpolation creates injection risk
    query = f"SELECT * FROM zakat_records WHERE payer_id = '{payer_id}'"
    cursor.execute(query)  # Vulnerable!

    # Attacker input: "'; DROP TABLE zakat_records; --"
    # Resulting query: SELECT * FROM zakat_records WHERE payer_id = ''; DROP TABLE zakat_records; --'
```

### The Solution

```python
# GOOD: Parameterized queries prevent injection
import sqlite3
from typing import List, Dict


def get_zakat_records_safe(payer_id: str) -> List[Dict]:
    """SAFE: Parameterized query."""
    conn = sqlite3.connect("zakat.db")
    cursor = conn.cursor()

    # GOOD: Parameterized query
    query = "SELECT * FROM zakat_records WHERE payer_id = ?"
    cursor.execute(query, (payer_id,))  # Safe: parameter binding

    return cursor.fetchall()


# Using ORM (even safer)
from sqlalchemy import select
from models import ZakatRecord


def get_zakat_records_orm(payer_id: str) -> List[ZakatRecord]:
    """SAFE: ORM prevents injection."""
    stmt = select(ZakatRecord).where(ZakatRecord.payer_id == payer_id)
    return session.execute(stmt).scalars().all()
```

**Why this matters**: SQL injection allows attackers to execute arbitrary SQL. Parameterized queries safely escape inputs. ORMs like SQLAlchemy provide additional protection.

### 📊 Input Validation Pipeline

This diagram shows the defense-in-depth validation pipeline using Pydantic:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
  A[User Input]:::blue
  B{Pydantic Validation}:::orange
  C[Type Checking]:::blue
  D[Field Constraints]:::blue
  E[Custom Validators]:::blue
  F{All Valid?}:::orange
  G[Business Logic]:::teal
  H[Database Layer]:::teal
  I[ValidationError]:::purple
  J[Log and Return 422]:::purple

  A --> B
  B --> C
  C --> D
  D --> E
  E --> F
  F -->|Yes| G
  F -->|No| I
  G --> H
  I --> J

  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## XSS Prevention

Escape user input in web responses.

### XSS in FastAPI

```python
# GOOD: FastAPI auto-escapes by default
from fastapi import FastAPI
from pydantic import BaseModel


class DonationResponse(BaseModel):
    """Pydantic model auto-escapes."""

    donor_name: str
    amount: str


app = FastAPI()


@app.get("/donation/{donor_id}")
async def get_donation(donor_id: str) -> DonationResponse:
    """FastAPI + Pydantic auto-escapes output."""
    # Even if donor_id contains <script>, it will be escaped
    return DonationResponse(
        donor_name=get_donor_name(donor_id),
        amount="$5,000"
    )
```

**Why this matters**: FastAPI and Pydantic escape output by default. Use templating engines (Jinja2) with auto-escaping. Never render raw HTML from user input.

## Authentication

Implement secure authentication patterns.

### JWT Authentication

```python
# GOOD: JWT authentication with FastAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel


SECRET_KEY = "your-secret-key-from-env"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()


class TokenData(BaseModel):
    """JWT token payload."""

    user_id: str
    exp: datetime


def create_access_token(user_id: str) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"user_id": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and extract user_id."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


# Protected endpoint
@app.get("/zakat/records")
async def get_zakat_records(user_id: str = Depends(verify_token)):
    """Endpoint requiring authentication."""
    return get_records_for_user(user_id)
```

**Why this matters**: JWT provides stateless authentication. Token expiration limits risk window. Bearer token standard for API authentication.

### 📊 JWT Authentication Flow

This sequence diagram shows the complete JWT authentication workflow:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
sequenceDiagram
  participant Client as Client
  participant API as FastAPI Endpoint
  participant Auth as Auth Service
  participant DB as Database

  Client->>API: POST /login #40;credentials#41;
  API->>DB: Verify credentials
  DB-->>API: User validated

  API->>Auth: create_access_token#40;user_id#41;
  activate Auth
  Note over Auth: Generate JWT<br/>Set expiration<br/>Sign with SECRET_KEY
  Auth-->>API: JWT token
  deactivate Auth

  API-->>Client: Return #123;token: "eyJ..."#125;

  Note over Client: Store token<br/>in memory/storage

  Client->>API: GET /zakat/records<br/>Authorization: Bearer eyJ...
  API->>Auth: verify_token#40;credentials#41;
  activate Auth
  Auth->>Auth: Decode JWT
  Auth->>Auth: Verify signature
  Auth->>Auth: Check expiration
  Auth-->>API: user_id extracted
  deactivate Auth

  API->>DB: get_records#40;user_id#41;
  DB-->>API: Zakat records
  API-->>Client: Return records
```

## Secrets Management

Never hardcode secrets.

### Environment Variables

```python
# GOOD: Load secrets from environment
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment."""

    database_url: str
    secret_key: str
    api_key: str
    jwt_secret: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Usage
settings = Settings()

# .env file (not committed to git)
# DATABASE_URL=postgresql://...
# SECRET_KEY=...
# API_KEY=...
# JWT_SECRET=...


# BAD: Hardcoded secrets
DATABASE_URL = "postgresql://user:password@localhost/db"  # NEVER DO THIS
API_KEY = "sk-1234567890"  # NEVER DO THIS
```

**Why this matters**: Environment variables separate secrets from code. .env files excluded from version control. Production uses secret managers (AWS Secrets Manager, HashiCorp Vault).

## Dependency Scanning

Scan dependencies for vulnerabilities.

### Using pip-audit

```bash
# Install pip-audit
pip install pip-audit

# Scan installed packages
pip-audit

# Generate report
pip-audit --format json > security-report.json

# Fix vulnerabilities
pip-audit --fix
```

### Using Safety

```bash
# Install Safety
pip install safety

# Check dependencies
safety check

# Check requirements file
safety check -r requirements.txt
```

**Why this matters**: Dependencies contain known vulnerabilities. Automated scanning catches issues. Regular updates patch security flaws.

## Input Validation

Validate all inputs with Pydantic.

### Pydantic Validation

```python
# GOOD: Comprehensive input validation
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
import re


class ZakatPaymentRequest(BaseModel):
    """Validated Zakat payment request."""

    payer_id: str = Field(min_length=5, max_length=50)
    amount: Decimal = Field(gt=0, le=Decimal("10000000"))
    payment_method: str = Field(pattern="^(card|bank|cash)$")

    @field_validator("payer_id")
    @classmethod
    def validate_payer_id_format(cls, v: str) -> str:
        """Validate payer ID format (alphanumeric + hyphens only)."""
        if not re.match(r"^[A-Z0-9-]+$", v):
            raise ValueError("Payer ID must be alphanumeric with hyphens")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount_precision(cls, v: Decimal) -> Decimal:
        """Ensure monetary precision (max 2 decimals)."""
        if v.as_tuple().exponent < -2:
            raise ValueError("Amount must have max 2 decimal places")
        return v
```

**Why this matters**: Pydantic validates types and constraints. Field patterns prevent injection. Custom validators enforce business rules.

### 📊 Secure Session Lifecycle

This state diagram shows the lifecycle of a secure session with proper expiration:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
stateDiagram-v2
  [*] --> Created: User login successful
  Created --> Active: Session token issued

  Active --> Refreshed: Token refresh before expiration
  Refreshed --> Active: New token issued

  Active --> Expired: Timeout reached
  Expired --> Destroyed: Token invalidated

  Active --> LoggedOut: User logout
  LoggedOut --> Destroyed: Session terminated

  Active --> Compromised: Security breach detected
  Compromised --> Destroyed: Force invalidation

  Destroyed --> [*]: Session ended

  note right of Created
    JWT created with:
    - user_id
    - exp: 30 minutes
    - iat: issued at
  end note

  note right of Expired
    exp < current_time
    401 Unauthorized
  end note

  note right of Destroyed
    Token blacklisted
    Refresh token revoked
  end note
```

## Cryptography

Use cryptography library for encryption.

### Encrypting Sensitive Data

```python
# GOOD: Encrypt sensitive data
from cryptography.fernet import Fernet
from pydantic_settings import BaseSettings


class CryptoSettings(BaseSettings):
    """Encryption settings."""

    encryption_key: bytes

    class Config:
        env_file = ".env"


# Generate key (once, store securely)
# key = Fernet.generate_key()

settings = CryptoSettings()
cipher = Fernet(settings.encryption_key)


def encrypt_pii(data: str) -> bytes:
    """Encrypt personally identifiable information."""
    return cipher.encrypt(data.encode())


def decrypt_pii(encrypted_data: bytes) -> str:
    """Decrypt PII."""
    return cipher.decrypt(encrypted_data).decode()


# Usage
donor_name = "Ahmad ibn Ali"
encrypted = encrypt_pii(donor_name)  # Store encrypted
decrypted = decrypt_pii(encrypted)   # Decrypt when needed
```

**Why this matters**: Fernet provides authenticated encryption. Symmetric encryption for data at rest. Never store encryption keys in code.

## Financial Domain Security

### Prevent Calculation Tampering

```python
# GOOD: Immutable calculation with audit trail
from dataclasses import dataclass
from decimal import Decimal
from datetime import datetime
import hashlib
import json


@dataclass(frozen=True)
class ZakatCalculationResult:
    """Immutable Zakat calculation with integrity check."""

    payer_id: str
    wealth_amount: Decimal
    nisab_threshold: Decimal
    zakat_amount: Decimal
    calculation_date: datetime
    checksum: str

    @classmethod
    def create(
        cls,
        payer_id: str,
        wealth_amount: Decimal,
        nisab_threshold: Decimal,
        zakat_amount: Decimal,
        calculation_date: datetime,
    ) -> "ZakatCalculationResult":
        """Create calculation with integrity checksum."""
        # Create checksum
        data = {
            "payer_id": payer_id,
            "wealth_amount": str(wealth_amount),
            "nisab_threshold": str(nisab_threshold),
            "zakat_amount": str(zakat_amount),
            "calculation_date": calculation_date.isoformat(),
        }
        checksum = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

        return cls(
            payer_id=payer_id,
            wealth_amount=wealth_amount,
            nisab_threshold=nisab_threshold,
            zakat_amount=zakat_amount,
            calculation_date=calculation_date,
            checksum=checksum,
        )

    def verify_integrity(self) -> bool:
        """Verify calculation hasn't been tampered."""
        expected = ZakatCalculationResult.create(
            self.payer_id,
            self.wealth_amount,
            self.nisab_threshold,
            self.zakat_amount,
            self.calculation_date,
        )
        return self.checksum == expected.checksum
```

**Why this matters**: Immutability prevents tampering. Checksums detect modifications. Audit trail for compliance.

### 📊 Defense in Depth Architecture

This diagram shows the layered security architecture for financial applications:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A[Client Layer]:::blue
  B[API Gateway]:::orange
  C[Authentication]:::teal
  D[Input Validation]:::teal
  E[Business Logic]:::purple
  F[Data Access]:::brown
  G[Database]:::brown

  A -->|HTTPS| B
  B -->|JWT Token| C
  C -->|Pydantic Models| D
  D -->|Sanitized Input| E
  E -->|Parameterized Queries| F
  F -->|Encrypted Connection| G

  H[Layer 1: TLS/SSL]:::blue
  I[Layer 2: Authentication]:::orange
  J[Layer 3: Validation]:::teal
  K[Layer 4: Authorization]:::purple
  L[Layer 5: Encryption at Rest]:::brown

  A -.-> H
  C -.-> I
  D -.-> J
  E -.-> K
  G -.-> L

  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## References

### Official Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Python Security Best Practices](https://python.org/dev/security/)
- [cryptography Documentation](https://cryptography.io/)

### Related Documentation

- [Web Services](./ex-soen-prla-py__web-services.md) - FastAPI security
- [Best Practices](./ex-soen-prla-py__best-practices.md) - Secure coding

---

**Last Updated**: 2025-01-23
**Python Version**: 3.11+ (baseline), 3.12+ (stable maintenance), 3.14.x (latest stable)
**Maintainers**: OSE Platform Documentation Team

## Python Security Tools

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#fff','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart TD
    A[Python Security] --> B[bandit<br/>Security Scanner]
    A --> C[safety<br/>Dependency Check]
    A --> D[pip-audit<br/>Vulnerability Scan]

    B --> E[OWASP Top 10<br/>Common Issues]
    C --> F[CVE Database<br/>Known Vulns]
    D --> G[PyPI Packages<br/>Security Audit]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#CC78BC,color:#fff
```
