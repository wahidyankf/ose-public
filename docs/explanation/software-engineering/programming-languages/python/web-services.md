---
title: Python Web Services
description: Web service development in Python using FastAPI async framework, Django batteries-included framework, Flask minimalist framework, httpx client, REST API design, JWT authentication, and OpenAPI documentation for financial applications
category: explanation
subcategory: prog-lang
tags:
  - python
  - web-services
  - fastapi
  - django
  - flask
  - httpx
  - rest-api
  - authentication
  - openapi
related:
  - ./security.md
  - ./concurrency-and-parallelism.md
  - ./type-safety.md
principles:
  - explicit-over-implicit
---

# Python Web Services

**Quick Reference**: [Overview](#overview) | [FastAPI](#fastapi-async-framework) | [Django](#django-batteries-included) | [Flask](#flask-minimalist-framework) | [httpx](#httpx-async-http-client) | [REST API Design](#rest-api-design) | [Authentication](#authentication) | [API Versioning](#api-versioning) | [OpenAPI](#openapi-documentation) | [Financial Domain APIs](#financial-domain-api-examples) | [References](#references)

## Overview

Python offers three major web frameworks, each with distinct philosophies. For OSE Platform financial services, framework choice depends on project requirements: FastAPI for modern async APIs, Django for full-featured web apps, Flask for microservices.

```mermaid
graph LR
    A[Project Requirements] --> B{Primary Need?}
    B -->|High Performance API| C[FastAPI]
    B -->|Full Web App| D[Django]
    B -->|Microservice| E[Flask]

    C --> F["FastAPI Features:<br/>Async/Await<br/>Type Safety<br/>Auto Docs"]
    D --> G["Django Features:<br/>Admin Panel<br/>ORM<br/>Auth System"]
    E --> H["Flask Features:<br/>Minimal Core<br/>Extensions<br/>Flexibility"]

    style C fill:#0173B2,color:#fff
    style D fill:#DE8F05,color:#fff
    style E fill:#029E73,color:#fff
```

### Framework Comparison

| Feature            | FastAPI               | Django             | Flask                   |
| ------------------ | --------------------- | ------------------ | ----------------------- |
| **Philosophy**     | Modern async API      | Batteries-included | Minimalist              |
| **Performance**    | Very High             | Medium             | Medium-High             |
| **Type Safety**    | Built-in (Pydantic)   | Optional           | Optional                |
| **Learning Curve** | Medium                | Steep              | Easy                    |
| **Async Support**  | Native                | Limited            | Via extensions          |
| **Admin Panel**    | No                    | Yes                | No                      |
| **ORM**            | None (use SQLAlchemy) | Django ORM         | None (use SQLAlchemy)   |
| **Best For**       | APIs, microservices   | Full web apps      | Simple APIs, prototypes |

## FastAPI (Async Framework)

FastAPI is a modern async web framework with automatic validation and documentation.

### Installing FastAPI

```bash
# Install FastAPI with dependencies
pip install fastapi[all]

# Or minimal install
pip install fastapi uvicorn[standard]
```

### Basic FastAPI Application

```python
# GOOD: FastAPI with Pydantic validation
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional
from datetime import datetime

app = FastAPI(
    title="OSE Platform API",
    description="Sharia-compliant financial services",
    version="1.0.0",
)

class ZakatCalculationRequest(BaseModel):
    """Request model for Zakat calculation."""

    payer_id: str = Field(min_length=5, max_length=50)
    wealth_amount: Decimal = Field(gt=0, description="Total wealth in USD")
    nisab_threshold: Decimal = Field(gt=0, description="Nisab threshold in USD")

class ZakatCalculationResponse(BaseModel):
    """Response model for Zakat calculation."""

    payer_id: str
    wealth_amount: Decimal
    nisab_threshold: Decimal
    zakat_amount: Decimal
    is_obligated: bool
    calculation_date: datetime

@app.post(
    "/api/v1/zakat/calculate",
    response_model=ZakatCalculationResponse,
    status_code=status.HTTP_200_OK,
)
async def calculate_zakat(request: ZakatCalculationRequest) -> ZakatCalculationResponse:
    """Calculate Zakat obligation (2.5% of wealth exceeding nisab)."""
    # Validation automatic via Pydantic
    is_obligated = request.wealth_amount >= request.nisab_threshold

    if is_obligated:
        zakat_amount = request.wealth_amount * Decimal("0.025")
    else:
        zakat_amount = Decimal("0")

    return ZakatCalculationResponse(
        payer_id=request.payer_id,
        wealth_amount=request.wealth_amount,
        nisab_threshold=request.nisab_threshold,
        zakat_amount=zakat_amount,
        is_obligated=is_obligated,
        calculation_date=datetime.utcnow(),
    )
```

**Why this matters**: FastAPI auto-validates requests with Pydantic. Type hints generate OpenAPI docs. Async/await for high concurrency.

### FastAPI Dependency Injection

```python
# GOOD: Dependency injection pattern
from fastapi import Depends
from typing import Annotated
from sqlalchemy.orm import Session
from database import SessionLocal

def get_db() -> Session:
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DbSession = Annotated[Session, Depends(get_db)]

@app.get("/api/v1/donations/{campaign_id}")
async def get_campaign_donations(
    campaign_id: str,
    db: DbSession,
) -> list[DonationResponse]:
    """Get all donations for campaign."""
    donations = db.query(Donation).filter(
        Donation.campaign_id == campaign_id
    ).all()

    return [DonationResponse.from_orm(d) for d in donations]
```

**Why this matters**: Dependencies injected automatically. Database sessions managed correctly. Testable (can mock dependencies).

### FastAPI Background Tasks

```python
# GOOD: Background tasks for async operations
from fastapi import BackgroundTasks

async def send_zakat_receipt(payer_id: str, zakat_amount: Decimal) -> None:
    """Send Zakat receipt email (background task)."""
    # Simulate email sending
    await send_email(
        to=get_payer_email(payer_id),
        subject="Zakat Payment Receipt",
        body=f"Your Zakat payment of ${zakat_amount} has been recorded.",
    )

@app.post("/api/v1/zakat/payment")
async def record_zakat_payment(
    payment: ZakatPaymentRequest,
    background_tasks: BackgroundTasks,
) -> ZakatPaymentResponse:
    """Record Zakat payment and send receipt."""
    # Process payment synchronously
    result = await process_payment(payment)

    # Send receipt in background (non-blocking)
    background_tasks.add_task(
        send_zakat_receipt,
        payment.payer_id,
        payment.amount,
    )

    return result
```

**Why this matters**: Background tasks don't block response. Useful for emails, notifications, logging. Fire-and-forget pattern.

### FastAPI Exception Handling

```python
# GOOD: Custom exception handlers
from fastapi import Request
from fastapi.responses import JSONResponse

class InsufficientFundsError(Exception):
    """Raised when account has insufficient funds."""

    def __init__(self, available: Decimal, required: Decimal):
        self.available = available
        self.required = required
        super().__init__(f"Insufficient funds: {available} < {required}")

@app.exception_handler(InsufficientFundsError)
async def insufficient_funds_handler(
    request: Request,
    exc: InsufficientFundsError,
) -> JSONResponse:
    """Handle insufficient funds error."""
    return JSONResponse(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        content={
            "error": "insufficient_funds",
            "message": str(exc),
            "available_amount": str(exc.available),
            "required_amount": str(exc.required),
        },
    )

@app.post("/api/v1/donations/process")
async def process_donation(donation: DonationRequest) -> DonationResponse:
    """Process donation payment."""
    balance = await get_account_balance(donation.donor_id)

    if balance < donation.amount:
        raise InsufficientFundsError(balance, donation.amount)

    return await charge_donation(donation)
```

**Why this matters**: Custom exception handlers provide consistent error responses. Centralized error handling. Client-friendly error messages.

## Django (Batteries-Included)

Django provides complete web framework with ORM, admin panel, and authentication.

### Django Project Structure

```
zakat_platform/
├── manage.py
├── zakat_platform/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── zakat/
│   ├── __init__.py
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── admin.py
└── requirements.txt
```

### Django Models

```python
# GOOD: Django ORM models
from django.db import models
from decimal import Decimal

class ZakatRecord(models.Model):
    """Zakat calculation and payment record."""

    payer_id = models.CharField(max_length=50, db_index=True)
    wealth_amount = models.DecimalField(max_digits=15, decimal_places=2)
    nisab_threshold = models.DecimalField(max_digits=15, decimal_places=2)
    zakat_amount = models.DecimalField(max_digits=15, decimal_places=2)
    calculation_date = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )

    class Meta:
        ordering = ["-calculation_date"]
        indexes = [
            models.Index(fields=["payer_id", "-calculation_date"]),
        ]

    def __str__(self) -> str:
        return f"Zakat {self.payer_id}: ${self.zakat_amount}"

    @property
    def is_obligated(self) -> bool:
        """Check if Zakat is obligated."""
        return self.wealth_amount >= self.nisab_threshold
```

**Why this matters**: Django ORM handles migrations, relationships, queries. Admin panel auto-generated. Model validation built-in.

### Django REST Framework

```python
# GOOD: DRF serializers and views
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal

class ZakatRecordSerializer(serializers.ModelSerializer):
    """Serializer for Zakat records."""

    is_obligated = serializers.BooleanField(read_only=True)

    class Meta:
        model = ZakatRecord
        fields = [
            "id",
            "payer_id",
            "wealth_amount",
            "nisab_threshold",
            "zakat_amount",
            "is_obligated",
            "calculation_date",
            "payment_status",
        ]
        read_only_fields = ["zakat_amount", "calculation_date"]

    def validate(self, data):
        """Validate wealth and nisab amounts."""
        if data["wealth_amount"] <= 0:
            raise serializers.ValidationError("Wealth must be positive")
        if data["nisab_threshold"] <= 0:
            raise serializers.ValidationError("Nisab must be positive")
        return data

    def create(self, validated_data):
        """Calculate Zakat before creating record."""
        wealth = validated_data["wealth_amount"]
        nisab = validated_data["nisab_threshold"]

        if wealth >= nisab:
            validated_data["zakat_amount"] = wealth * Decimal("0.025")
        else:
            validated_data["zakat_amount"] = Decimal("0")

        return super().create(validated_data)

class ZakatRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for Zakat records."""

    queryset = ZakatRecord.objects.all()
    serializer_class = ZakatRecordSerializer

    @action(detail=False, methods=["post"])
    def calculate(self, request):
        """Calculate Zakat without saving."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        wealth = serializer.validated_data["wealth_amount"]
        nisab = serializer.validated_data["nisab_threshold"]

        if wealth >= nisab:
            zakat = wealth * Decimal("0.025")
        else:
            zakat = Decimal("0")

        return Response({
            "zakat_amount": zakat,
            "is_obligated": wealth >= nisab,
        })
```

**Why this matters**: DRF provides REST API framework on Django. ViewSets reduce boilerplate. Serializers handle validation and transformation.

### Django Admin Panel

```python
# GOOD: Custom admin interface
from django.contrib import admin
from .models import ZakatRecord

@admin.register(ZakatRecord)
class ZakatRecordAdmin(admin.ModelAdmin):
    """Admin interface for Zakat records."""

    list_display = [
        "payer_id",
        "wealth_amount",
        "zakat_amount",
        "payment_status",
        "calculation_date",
    ]
    list_filter = ["payment_status", "calculation_date"]
    search_fields = ["payer_id"]
    readonly_fields = ["zakat_amount", "calculation_date"]

    fieldsets = [
        (
            "Payer Information",
            {
                "fields": ["payer_id"],
            },
        ),
        (
            "Financial Details",
            {
                "fields": [
                    "wealth_amount",
                    "nisab_threshold",
                    "zakat_amount",
                ],
            },
        ),
        (
            "Status",
            {
                "fields": ["payment_status", "calculation_date"],
            },
        ),
    ]
```

**Why this matters**: Admin panel auto-generated from models. Customizable list views and filters. Quick data management interface.

## Flask (Minimalist Framework)

Flask provides minimal core with extensions for features.

### Basic Flask Application

```python
# GOOD: Flask with Blueprint organization
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from pydantic import BaseModel, Field, ValidationError
from decimal import Decimal

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///zakat.db"
db = SQLAlchemy(app)

class ZakatCalculationRequest(BaseModel):
    """Request validation with Pydantic."""

    payer_id: str = Field(min_length=5, max_length=50)
    wealth_amount: Decimal = Field(gt=0)
    nisab_threshold: Decimal = Field(gt=0)

@app.route("/api/v1/zakat/calculate", methods=["POST"])
def calculate_zakat():
    """Calculate Zakat endpoint."""
    try:
        # Validate request with Pydantic
        data = ZakatCalculationRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": "validation_error", "details": e.errors()}), 400

    # Calculate Zakat
    if data.wealth_amount >= data.nisab_threshold:
        zakat_amount = data.wealth_amount * Decimal("0.025")
    else:
        zakat_amount = Decimal("0")

    return jsonify({
        "payer_id": data.payer_id,
        "wealth_amount": str(data.wealth_amount),
        "nisab_threshold": str(data.nisab_threshold),
        "zakat_amount": str(zakat_amount),
        "is_obligated": data.wealth_amount >= data.nisab_threshold,
    })

if __name__ == "__main__":
    app.run(debug=True)
```

**Why this matters**: Flask minimal and flexible. Pydantic adds validation (Flask doesn't have built-in). Explicit routing.

### Flask Blueprints

```python
# GOOD: Flask Blueprints for organization
from flask import Blueprint

zakat_bp = Blueprint("zakat", __name__, url_prefix="/api/v1/zakat")

@zakat_bp.route("/calculate", methods=["POST"])
def calculate():
    """Calculate Zakat."""
    # Implementation here
    pass

@zakat_bp.route("/records", methods=["GET"])
def get_records():
    """Get Zakat records."""
    # Implementation here
    pass

# Register blueprint in main app
app.register_blueprint(zakat_bp)
```

**Why this matters**: Blueprints organize routes into modules. Reusable across apps. Clear URL prefixes.

## httpx (Async HTTP Client)

httpx is async HTTP client for Python (like requests but async).

### Basic httpx Usage

```python
# GOOD: httpx async client
import httpx
from decimal import Decimal
from pydantic import BaseModel

class ExchangeRateResponse(BaseModel):
    """Exchange rate API response."""

    base: str
    date: str
    rates: dict[str, Decimal]

async def get_gold_price_usd() -> Decimal:
    """Fetch current gold price in USD per gram."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.metals.live/v1/spot/gold",
            timeout=10.0,
        )
        response.raise_for_status()

        data = response.json()
        return Decimal(str(data["price"])) / Decimal("31.1035")  # Troy oz to gram

async def calculate_nisab_threshold() -> Decimal:
    """Calculate nisab threshold based on current gold price."""
    gold_price_per_gram = await get_gold_price_usd()
    nisab_grams = Decimal("85")  # 85 grams of gold
    return gold_price_per_gram * nisab_grams
```

**Why this matters**: httpx supports async/await. Timeout configuration prevents hanging. Automatically follows redirects.

### httpx Error Handling

```python
# GOOD: Robust error handling with httpx
from httpx import HTTPStatusError, RequestError, TimeoutException

async def fetch_with_retry(url: str, max_retries: int = 3) -> dict:
    """Fetch URL with retry logic."""
    async with httpx.AsyncClient() as client:
        for attempt in range(max_retries):
            try:
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()
                return response.json()

            except TimeoutException:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff

            except HTTPStatusError as e:
                if e.response.status_code >= 500:
                    # Retry server errors
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(2 ** attempt)
                else:
                    # Don't retry client errors
                    raise

            except RequestError:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
```

**Why this matters**: Exponential backoff for retries. Distinguish server vs client errors. Timeout prevents hanging indefinitely.

## REST API Design

REST API principles for financial services.

### Resource Naming

```python
# GOOD: RESTful resource naming
"""
Correct REST endpoints:

GET    /api/v1/zakat/records           # List all Zakat records
POST   /api/v1/zakat/records           # Create new record
GET    /api/v1/zakat/records/{id}      # Get specific record
PUT    /api/v1/zakat/records/{id}      # Update record
DELETE /api/v1/zakat/records/{id}      # Delete record

GET    /api/v1/campaigns/{id}/donations  # Nested resource
POST   /api/v1/campaigns/{id}/donations  # Create donation

POST   /api/v1/zakat/calculate         # RPC-style action (OK for calculations)
"""

# BAD: Non-RESTful naming
"""
Incorrect endpoints:

GET  /api/v1/getZakatRecords          # BAD: verb in URL
POST /api/v1/createZakat              # BAD: verb in URL
GET  /api/v1/zakat_records            # BAD: snake_case in URL
GET  /api/v1/ZakatRecords             # BAD: PascalCase in URL
"""
```

### HTTP Status Codes

```python
# GOOD: Proper HTTP status codes
from fastapi import status

@app.post(
    "/api/v1/donations",
    status_code=status.HTTP_201_CREATED,  # Created
)
async def create_donation(donation: DonationRequest) -> DonationResponse:
    """Create donation."""
    pass

@app.get(
    "/api/v1/donations/{donation_id}",
    status_code=status.HTTP_200_OK,  # Success
)
async def get_donation(donation_id: str) -> DonationResponse:
    """Get donation."""
    donation = await fetch_donation(donation_id)
    if not donation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return donation

@app.put(
    "/api/v1/donations/{donation_id}",
    status_code=status.HTTP_200_OK,  # Success
)
async def update_donation(
    donation_id: str,
    donation: DonationRequest,
) -> DonationResponse:
    """Update donation."""
    pass

@app.delete(
    "/api/v1/donations/{donation_id}",
    status_code=status.HTTP_204_NO_CONTENT,  # No content
)
async def delete_donation(donation_id: str) -> None:
    """Delete donation."""
    pass
```

**Why this matters**: Correct status codes communicate intent. 2xx for success, 4xx for client errors, 5xx for server errors.

### Pagination

```python
# GOOD: Cursor-based pagination
from fastapi import Query
from typing import Optional

class PaginatedResponse(BaseModel):
    """Paginated response model."""

    items: list[DonationResponse]
    next_cursor: Optional[str] = None
    has_more: bool

@app.get("/api/v1/donations")
async def list_donations(
    limit: int = Query(default=20, le=100),
    cursor: Optional[str] = None,
) -> PaginatedResponse:
    """List donations with cursor pagination."""
    # Fetch limit + 1 to check if more exist
    donations = await fetch_donations(cursor=cursor, limit=limit + 1)

    has_more = len(donations) > limit
    items = donations[:limit]

    next_cursor = None
    if has_more:
        next_cursor = encode_cursor(items[-1].id)

    return PaginatedResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )
```

**Why this matters**: Cursor pagination scales better than offset. Handles inserts/deletes during pagination. More efficient for large datasets.

## Authentication

JWT authentication for stateless APIs.

### JWT Token Generation

```python
# GOOD: JWT authentication
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

SECRET_KEY = "your-secret-key-from-env"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(user_id: str) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    """Hash password with bcrypt."""
    return pwd_context.hash(password)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extract user ID from JWT token."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
```

### Protected Endpoints

```python
# GOOD: Protected endpoints with dependency injection
from typing import Annotated

CurrentUser = Annotated[str, Depends(get_current_user)]

@app.post("/api/v1/auth/login")
async def login(credentials: LoginRequest) -> TokenResponse:
    """Login and get access token."""
    user = await authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(user.id)
    return TokenResponse(access_token=access_token, token_type="bearer")

@app.get("/api/v1/zakat/my-records")
async def get_my_zakat_records(user_id: CurrentUser) -> list[ZakatRecordResponse]:
    """Get authenticated user's Zakat records."""
    records = await fetch_user_zakat_records(user_id)
    return records

@app.post("/api/v1/donations")
async def create_donation(
    donation: DonationRequest,
    user_id: CurrentUser,
) -> DonationResponse:
    """Create donation (authenticated)."""
    return await process_donation(donation, donor_id=user_id)
```

**Why this matters**: JWT enables stateless authentication. No session storage needed. Tokens self-contained. Dependency injection makes testing easy.

## API Versioning

Version APIs for backward compatibility.

### URL Versioning

```python
# GOOD: URL-based versioning (recommended)
from fastapi import APIRouter

# Version 1 API
v1_router = APIRouter(prefix="/api/v1")

@v1_router.post("/zakat/calculate")
async def calculate_zakat_v1(request: ZakatRequestV1) -> ZakatResponseV1:
    """V1: Basic Zakat calculation."""
    # Simplified calculation
    pass

# Version 2 API (with breaking changes)
v2_router = APIRouter(prefix="/api/v2")

@v2_router.post("/zakat/calculate")
async def calculate_zakat_v2(request: ZakatRequestV2) -> ZakatResponseV2:
    """V2: Enhanced Zakat calculation with nisab auto-detection."""
    # Enhanced calculation with gold price lookup
    pass

# Register both versions
app.include_router(v1_router)
app.include_router(v2_router)
```

```mermaid
graph LR
    A[Client] --> B{API Version?}
    B -->|/api/v1/zakat/calculate| C[V1 Handler<br/>Basic Calculation]
    B -->|/api/v2/zakat/calculate| D[V2 Handler<br/>Enhanced Calculation]

    C --> E[V1 Response]
    D --> F[V2 Response]

    style C fill:#0173B2
    style D fill:#DE8F05
```

**Why this matters**: URL versioning explicit and clear. Multiple versions run simultaneously. Clients upgrade at their own pace.

## OpenAPI Documentation

FastAPI auto-generates OpenAPI (Swagger) documentation.

### Customizing OpenAPI

```python
# GOOD: Custom OpenAPI metadata
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    """Customize OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="OSE Platform API",
        version="1.0.0",
        description="""
        ## Sharia-Compliant Financial Services API

        This API provides endpoints for:
        - Zakat calculation and tracking
        - Donation campaign management
        - QardHasan (interest-free) loan processing
        - Murabaha contract management

        ### Authentication
        All endpoints require Bearer token authentication except `/auth/login`.

        ### Rate Limits
        - 100 requests per minute per user
        - 1000 requests per hour per user
        """,
        routes=app.routes,
    )

    # Add custom fields
    openapi_schema["info"]["x-logo"] = {
        "url": "https://oseplatform.com/logo.png"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app = FastAPI()
app.openapi = custom_openapi
```

### Documenting Endpoints

````python
# GOOD: Comprehensive endpoint documentation
@app.post(
    "/api/v1/zakat/calculate",
    response_model=ZakatResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Zakat obligation",
    description="""
    Calculate Zakat (Islamic alms) based on wealth and nisab threshold.

    Zakat is calculated as 2.5% of qualifying wealth that exceeds the nisab.
    The nisab threshold is equivalent to 85 grams of gold or 595 grams of silver.

    **Business Rules:**
    - Wealth must exceed nisab threshold for Zakat to be obligated
    - Zakat rate is fixed at 2.5% (1/40th of wealth)
    - Calculation uses Gregorian calendar year

    **Example Request:**
    ```json
    {
        "payer_id": "PAYER-12345",
        "wealth_amount": 100000.00,
        "nisab_threshold": 85000.00
    }
    ```

    **Example Response:**
    ```json
    {
        "payer_id": "PAYER-12345",
        "wealth_amount": 100000.00,
        "nisab_threshold": 85000.00,
        "zakat_amount": 2500.00,
        "is_obligated": true
    }
    ```
    """,
    response_description="Zakat calculation result with obligation status",
    tags=["Zakat"],
)
async def calculate_zakat(request: ZakatRequest) -> ZakatResponse:
    """Calculate Zakat obligation."""
    pass
````

**Why this matters**: Good documentation reduces support burden. Examples show correct usage. Auto-generated from code (stays in sync).

## Financial Domain API Examples

### Complete Donation Campaign API

```python
# GOOD: Complete donation campaign API
from enum import Enum
from datetime import date

class CampaignStatus(str, Enum):
    """Campaign status enumeration."""

    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CampaignCreateRequest(BaseModel):
    """Request to create campaign."""

    name: str = Field(min_length=5, max_length=200)
    description: str
    target_amount: Decimal = Field(gt=0)
    start_date: date
    end_date: date

class CampaignResponse(BaseModel):
    """Campaign response model."""

    id: str
    name: str
    description: str
    target_amount: Decimal
    current_amount: Decimal
    donor_count: int
    status: CampaignStatus
    start_date: date
    end_date: date
    progress_percentage: Decimal

class DonationCreateRequest(BaseModel):
    """Request to create donation."""

    campaign_id: str
    donor_id: str
    amount: Decimal = Field(gt=0)
    message: Optional[str] = None

# Campaign endpoints
@app.post("/api/v1/campaigns", status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign: CampaignCreateRequest,
    user_id: CurrentUser,
) -> CampaignResponse:
    """Create new donation campaign."""
    if campaign.end_date <= campaign.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )

    # Create campaign
    campaign_record = await save_campaign(campaign, created_by=user_id)
    return campaign_record

@app.get("/api/v1/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str) -> CampaignResponse:
    """Get campaign details."""
    campaign = await fetch_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return campaign

@app.get("/api/v1/campaigns")
async def list_campaigns(
    status: Optional[CampaignStatus] = None,
    limit: int = Query(default=20, le=100),
) -> list[CampaignResponse]:
    """List donation campaigns."""
    return await fetch_campaigns(status=status, limit=limit)

# Donation endpoints
@app.post("/api/v1/donations", status_code=status.HTTP_201_CREATED)
async def create_donation(
    donation: DonationCreateRequest,
    user_id: CurrentUser,
) -> DonationResponse:
    """Create donation to campaign."""
    campaign = await fetch_campaign(donation.campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is not active",
        )

    # Process donation
    donation_record = await process_donation(donation, user_id=user_id)
    return donation_record

@app.get("/api/v1/campaigns/{campaign_id}/donations")
async def get_campaign_donations(
    campaign_id: str,
    limit: int = Query(default=20, le=100),
) -> list[DonationResponse]:
    """Get donations for campaign."""
    return await fetch_campaign_donations(campaign_id, limit=limit)
```

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant DB
    participant PaymentGateway

    Client->>API: POST /api/v1/donations
    API->>Auth: Verify JWT Token
    Auth-->>API: User ID

    API->>DB: Fetch Campaign
    DB-->>API: Campaign Data

    alt Campaign Not Active
        API-->>Client: 400 Bad Request
    else Campaign Active
        API->>PaymentGateway: Process Payment
        PaymentGateway-->>API: Payment Success

        API->>DB: Save Donation
        API->>DB: Update Campaign Total
        DB-->>API: Donation Record

        API-->>Client: 201 Created
    end
```

### QardHasan Loan API

```python
# GOOD: Interest-free loan (QardHasan) API
class LoanStatus(str, Enum):
    """Loan status enumeration."""

    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    FULLY_REPAID = "fully_repaid"
    DEFAULTED = "defaulted"

class QardHasanLoanRequest(BaseModel):
    """Request for QardHasan loan."""

    borrower_id: str
    principal_amount: Decimal = Field(gt=0)
    purpose: str
    repayment_months: int = Field(gt=0, le=60)

class LoanRepaymentRequest(BaseModel):
    """Loan repayment request."""

    loan_id: str
    payment_amount: Decimal = Field(gt=0)

class QardHasanLoanResponse(BaseModel):
    """QardHasan loan response."""

    id: str
    borrower_id: str
    principal_amount: Decimal
    repaid_amount: Decimal
    remaining_balance: Decimal
    status: LoanStatus
    disbursement_date: Optional[date] = None
    repayment_months: int

@app.post("/api/v1/qard-hasan/loans", status_code=status.HTTP_201_CREATED)
async def create_loan_request(
    loan: QardHasanLoanRequest,
    user_id: CurrentUser,
) -> QardHasanLoanResponse:
    """Create QardHasan (interest-free) loan request."""
    # Validate: No interest allowed in QardHasan
    loan_record = await save_loan_request(loan, requester_id=user_id)
    return loan_record

@app.post("/api/v1/qard-hasan/loans/{loan_id}/repayment")
async def record_repayment(
    loan_id: str,
    repayment: LoanRepaymentRequest,
    user_id: CurrentUser,
) -> QardHasanLoanResponse:
    """Record loan repayment (principal only, no interest)."""
    loan = await fetch_loan(loan_id)
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if loan.status != LoanStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan is not active",
        )

    # Record payment (principal only)
    updated_loan = await record_loan_payment(loan_id, repayment.payment_amount)

    # Mark as fully repaid if balance is zero
    if updated_loan.remaining_balance == 0:
        updated_loan = await update_loan_status(loan_id, LoanStatus.FULLY_REPAID)

    return updated_loan

@app.get("/api/v1/qard-hasan/loans/{loan_id}")
async def get_loan(loan_id: str, user_id: CurrentUser) -> QardHasanLoanResponse:
    """Get loan details."""
    loan = await fetch_loan(loan_id)
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    # Authorization: only borrower or admin can view
    if loan.borrower_id != user_id and not await is_admin(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    return loan
```

**Why this matters**: Financial domain APIs require precise validation. Decimal for money (never float). Status enums for type safety. Authorization checks for sensitive data.

## FastAPI Deep Dive: Production Patterns

### FastAPI Advanced Dependency Injection

Complex dependency patterns for production systems.

```python
# GOOD: Layered dependency injection architecture
from fastapi import Depends, HTTPException, status
from typing import Annotated, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/db"
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# Dependency: Database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide database session with automatic cleanup."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

DbSession = Annotated[AsyncSession, Depends(get_db)]

# Dependency: Current authenticated user
async def get_current_user(
    token: str = Header(..., description="Bearer token"),
    db: DbSession
) -> User:
    """Extract and validate current user from token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    # Fetch user from database
    user = await db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

# Dependency: Admin user verification
async def get_current_admin(current_user: CurrentUser) -> User:
    """Verify current user has admin privileges."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

AdminUser = Annotated[User, Depends(get_current_admin)]

# Dependency: Pagination parameters
class PaginationParams:
    """Reusable pagination parameters."""

    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(20, ge=1, le=100, description="Number of items to return")
    ):
        self.skip = skip
        self.limit = limit

Pagination = Annotated[PaginationParams, Depends()]

# Service layer with dependency injection
class ZakatService:
    """Zakat calculation service with database access."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_zakat(self, wealth: Decimal, nisab: Decimal) -> Decimal:
        """Calculate Zakat amount."""
        if wealth >= nisab:
            return wealth * Decimal("0.025")
        return Decimal("0")

    async def save_zakat_record(
        self,
        user_id: str,
        wealth: Decimal,
        zakat_amount: Decimal
    ) -> ZakatRecord:
        """Save Zakat calculation to database."""
        record = ZakatRecord(
            user_id=user_id,
            wealth_amount=wealth,
            zakat_amount=zakat_amount,
            calculation_date=datetime.utcnow()
        )

        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)

        return record

# Dependency: Service factory
async def get_zakat_service(db: DbSession) -> ZakatService:
    """Create ZakatService with database session."""
    return ZakatService(db)

ZakatServiceDep = Annotated[ZakatService, Depends(get_zakat_service)]

# Using layered dependencies in endpoint
@app.post("/api/v1/zakat/calculate")
async def calculate_user_zakat(
    request: ZakatCalculationRequest,
    current_user: CurrentUser,
    zakat_service: ZakatServiceDep
) -> ZakatCalculationResponse:
    """Calculate and save Zakat for authenticated user."""
    # Calculate Zakat
    zakat_amount = await zakat_service.calculate_zakat(
        wealth=request.wealth_amount,
        nisab=request.nisab_threshold
    )

    # Save to database
    record = await zakat_service.save_zakat_record(
        user_id=current_user.id,
        wealth=request.wealth_amount,
        zakat_amount=zakat_amount
    )

    return ZakatCalculationResponse(
        payer_id=current_user.id,
        wealth_amount=record.wealth_amount,
        nisab_threshold=request.nisab_threshold,
        zakat_amount=record.zakat_amount,
        calculation_date=record.calculation_date
    )
```

**Why this matters**: Layered dependencies enable clean architecture. Service layer encapsulates business logic. Type annotations improve IDE support.

### FastAPI Middleware Pipeline

Production middleware for logging, error tracking, and monitoring.

```python
# GOOD: Comprehensive middleware stack
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
import time
import uuid
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

# Request ID middleware
class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add unique request ID to all requests."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response

# Logging middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests and responses."""

    async def dispatch(self, request: Request, call_next):
        request_id = getattr(request.state, "request_id", "unknown")

        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "client_host": request.client.host if request.client else None
            }
        )

        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        logger.info(
            f"Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2)
            }
        )

        return response

# Error tracking middleware
class ErrorTrackingMiddleware(BaseHTTPMiddleware):
    """Track and report errors to monitoring service."""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)

            # Track 4xx and 5xx errors
            if response.status_code >= 400:
                request_id = getattr(request.state, "request_id", "unknown")
                logger.error(
                    f"HTTP error {response.status_code}",
                    extra={
                        "request_id": request_id,
                        "method": request.method,
                        "url": str(request.url),
                        "status_code": response.status_code
                    }
                )

            return response

        except Exception as e:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.exception(
                f"Unhandled exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "exception_type": type(e).__name__
                }
            )

            # Re-raise to let FastAPI handle it
            raise

# Performance monitoring middleware
class PerformanceMiddleware(BaseHTTPMiddleware):
    """Monitor endpoint performance."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        # Add performance header
        response.headers["X-Process-Time"] = str(duration)

        # Warn on slow requests
        if duration > 1.0:  # 1 second threshold
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                f"Slow request detected",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "duration_ms": round(duration * 1000, 2)
                }
            )

        return response

# Add middleware to app (order matters - last added runs first)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(PerformanceMiddleware)
app.add_middleware(ErrorTrackingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://oseplatform.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why this matters**: Middleware pipeline provides cross-cutting concerns. Request IDs enable request tracing. Performance monitoring identifies bottlenecks.

### FastAPI Testing Strategies

Comprehensive testing with pytest and TestClient.

```python
# GOOD: FastAPI testing patterns
import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def client():
    """Create test client with test database."""
    # Override database dependency
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Clear overrides after test
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """Create authenticated user and return auth headers."""
    # Create test user
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "name": "Test User"
        }
    )
    assert response.status_code == 201

    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!"
        }
    )
    assert response.status_code == 200

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

class TestZakatAPI:
    """Test Zakat calculation API."""

    def test_calculate_zakat_above_nisab(self, client, auth_headers):
        """Test Zakat calculation for wealth above nisab."""
        response = client.post(
            "/api/v1/zakat/calculate",
            headers=auth_headers,
            json={
                "payer_id": "TEST-001",
                "wealth_amount": "100000.00",
                "nisab_threshold": "5000.00"
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["payer_id"] == "TEST-001"
        assert Decimal(data["zakat_amount"]) == Decimal("2500.00")
        assert data["is_obligated"] is True

    def test_calculate_zakat_below_nisab(self, client, auth_headers):
        """Test Zakat calculation for wealth below nisab."""
        response = client.post(
            "/api/v1/zakat/calculate",
            headers=auth_headers,
            json={
                "payer_id": "TEST-002",
                "wealth_amount": "3000.00",
                "nisab_threshold": "5000.00"
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["payer_id"] == "TEST-002"
        assert Decimal(data["zakat_amount"]) == Decimal("0.00")
        assert data["is_obligated"] is False

    def test_calculate_zakat_validation_error(self, client, auth_headers):
        """Test validation error for negative wealth."""
        response = client.post(
            "/api/v1/zakat/calculate",
            headers=auth_headers,
            json={
                "payer_id": "TEST-003",
                "wealth_amount": "-1000.00",
                "nisab_threshold": "5000.00"
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_calculate_zakat_unauthorized(self, client):
        """Test unauthorized access without token."""
        response = client.post(
            "/api/v1/zakat/calculate",
            json={
                "payer_id": "TEST-004",
                "wealth_amount": "100000.00",
                "nisab_threshold": "5000.00"
            }
        )

        assert response.status_code == 401

class TestDonationCampaignAPI:
    """Test donation campaign API."""

    @pytest.fixture
    def create_campaign(self, client, auth_headers):
        """Create test campaign."""
        response = client.post(
            "/api/v1/campaigns",
            headers=auth_headers,
            json={
                "name": "Test Campaign",
                "description": "Test campaign description",
                "target_amount": "50000.00",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31"
            }
        )
        assert response.status_code == 201
        return response.json()

    def test_list_campaigns(self, client):
        """Test listing campaigns (public endpoint)."""
        response = client.get("/api/v1/campaigns")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_campaign(self, client, auth_headers):
        """Test creating campaign (authenticated)."""
        response = client.post(
            "/api/v1/campaigns",
            headers=auth_headers,
            json={
                "name": "Ramadan Campaign",
                "description": "Support needy families during Ramadan",
                "target_amount": "100000.00",
                "start_date": "2025-03-01",
                "end_date": "2025-04-30"
            }
        )

        assert response.status_code == 201
        data = response.json()

        assert data["name"] == "Ramadan Campaign"
        assert Decimal(data["target_amount"]) == Decimal("100000.00")
        assert data["status"] == "DRAFT"

    def test_create_donation(self, client, auth_headers, create_campaign):
        """Test creating donation to campaign."""
        campaign_id = create_campaign["id"]

        response = client.post(
            "/api/v1/donations",
            headers=auth_headers,
            json={
                "campaign_id": campaign_id,
                "donor_id": "DONOR-001",
                "amount": "1000.00",
                "message": "May Allah accept this donation"
            }
        )

        assert response.status_code == 201
        data = response.json()

        assert data["campaign_id"] == campaign_id
        assert Decimal(data["amount"]) == Decimal("1000.00")

@pytest.mark.asyncio
async def test_async_endpoint(client):
    """Test async endpoint behavior."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

@pytest.mark.parametrize("wealth,nisab,expected_zakat", [
    ("10000", "5000", "250.00"),
    ("5000", "5000", "125.00"),
    ("4999", "5000", "0.00"),
    ("100000", "5000", "2500.00"),
])
def test_zakat_calculation_parametrized(
    client,
    auth_headers,
    wealth,
    nisab,
    expected_zakat
):
    """Parametrized test for various Zakat calculations."""
    response = client.post(
        "/api/v1/zakat/calculate",
        headers=auth_headers,
        json={
            "payer_id": "TEST-PARAM",
            "wealth_amount": wealth,
            "nisab_threshold": nisab
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert Decimal(data["zakat_amount"]) == Decimal(expected_zakat)
```

**Why this matters**: TestClient enables comprehensive API testing. Fixtures provide test isolation. Parametrized tests cover edge cases efficiently.

### FastAPI WebSocket Support

Real-time communication for donation updates.

```python
# GOOD: WebSocket for real-time donation tracking
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio

class ConnectionManager:
    """Manage WebSocket connections for donation campaigns."""

    def __init__(self):
        # Map campaign_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, campaign_id: str):
        """Accept WebSocket connection and add to campaign room."""
        await websocket.accept()

        if campaign_id not in self.active_connections:
            self.active_connections[campaign_id] = []

        self.active_connections[campaign_id].append(websocket)

    def disconnect(self, websocket: WebSocket, campaign_id: str):
        """Remove WebSocket connection from campaign room."""
        if campaign_id in self.active_connections:
            self.active_connections[campaign_id].remove(websocket)

            if not self.active_connections[campaign_id]:
                del self.active_connections[campaign_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific websocket."""
        await websocket.send_text(message)

    async def broadcast_to_campaign(self, message: dict, campaign_id: str):
        """Broadcast message to all connections in campaign room."""
        if campaign_id in self.active_connections:
            for connection in self.active_connections[campaign_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/campaigns/{campaign_id}")
async def websocket_campaign_updates(
    websocket: WebSocket,
    campaign_id: str
):
    """WebSocket endpoint for real-time campaign updates."""
    await manager.connect(websocket, campaign_id)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "campaign_id": campaign_id,
            "message": "Connected to campaign updates"
        })

        # Keep connection alive and handle messages
        while True:
            # Receive client messages (if any)
            data = await websocket.receive_text()

            # Echo back (or process as needed)
            await websocket.send_json({
                "type": "echo",
                "data": data
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket, campaign_id)

        # Notify other connections about disconnect
        await manager.broadcast_to_campaign(
            {
                "type": "user_disconnected",
                "campaign_id": campaign_id
            },
            campaign_id
        )

# Background task to broadcast donation updates
async def broadcast_donation_update(campaign_id: str, donation: Dict):
    """Broadcast new donation to all campaign subscribers."""
    await manager.broadcast_to_campaign(
        {
            "type": "new_donation",
            "campaign_id": campaign_id,
            "donation": {
                "amount": str(donation["amount"]),
                "donor_name": donation.get("donor_name", "Anonymous"),
                "message": donation.get("message", ""),
                "timestamp": donation["created_at"].isoformat()
            }
        },
        campaign_id
    )

# Modified donation creation endpoint to broadcast updates
@app.post("/api/v1/donations", status_code=status.HTTP_201_CREATED)
async def create_donation_with_broadcast(
    donation: DonationCreateRequest,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
) -> DonationResponse:
    """Create donation and broadcast to WebSocket subscribers."""
    # Process donation
    donation_record = await process_donation(donation, user_id=current_user.id)

    # Broadcast to WebSocket subscribers in background
    background_tasks.add_task(
        broadcast_donation_update,
        donation.campaign_id,
        donation_record
    )

    return donation_record
```

**Why this matters**: WebSockets enable real-time updates. Connection manager handles multiple clients. Background tasks decouple processing from broadcasting.

## References

### Official Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [httpx Documentation](https://www.python-httpx.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)

### Related Documentation

- [Security](./security.md) - Authentication and security
- [Concurrency and Parallelism](./concurrency-and-parallelism.md) - Async patterns
- [Type Safety](./type-safety.md) - Type hints and validation

---

**Python Version**: 3.11+ (baseline), 3.12+ (stable maintenance), 3.14.x (latest stable)
**Maintainers**: OSE Platform Documentation Team

## FastAPI Architecture

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#fff','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart TD
    A[FastAPI App] --> B[Dependency Injection<br/>DB Session / Auth / Config]
    A --> C["Routers<br/>/api/zakat, /donations, /auth"]
    A --> D[Middleware<br/>CORS/Auth]

    B --> E[Endpoint Functions]
    C --> E

    E --> F[Pydantic<br/>Validation]
    F --> G[Business Logic<br/>Services]
    G --> H[Repository<br/>Database]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style E fill:#CC78BC,color:#fff
    style F fill:#0173B2,color:#fff
```

## Request Lifecycle

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#000','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant R as Router
    participant P as Pydantic
    participant S as Service
    participant DB

    C->>M: POST /api/calculate-zakat
    M->>M: CORS Check
    M->>M: Auth Verify
    M->>R: Route Match
    R->>P: Validate Request Body

    alt Validation Error
        P-->>C: 422 Unprocessable
    else Valid
        P->>S: Business Logic
        S->>DB: Query Assets
        DB-->>S: Asset Data
        S->>S: Calculate Zakat
        S-->>C: 200 OK + Result
    end
```
