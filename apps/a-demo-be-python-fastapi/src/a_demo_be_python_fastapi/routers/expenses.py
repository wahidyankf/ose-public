"""Expenses router: CRUD, summary."""

import math
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from generated_contracts import CreateExpenseRequest, Expense, ExpenseListResponse
from sqlalchemy.orm import Session

from a_demo_be_python_fastapi.auth.dependencies import get_current_user
from a_demo_be_python_fastapi.dependencies import get_db, get_expense_repo
from a_demo_be_python_fastapi.domain.errors import ForbiddenError, NotFoundError
from a_demo_be_python_fastapi.domain.expense import (
    validate_amount,
    validate_currency,
    validate_unit,
)
from a_demo_be_python_fastapi.infrastructure.models import UserModel

router = APIRouter()


_ZERO_DECIMAL_CURRENCIES = {"IDR"}


def _fmt_amount(val: object, currency: str = "USD") -> str:
    """Format amount with currency-aware decimal places.

    USD → 2 decimals ("10.50"), IDR → 0 decimals ("150000").
    Handles Decimal (PostgreSQL) and str (SQLite) values.
    """
    scale = 0 if currency.upper() in _ZERO_DECIMAL_CURRENCIES else 2
    if isinstance(val, Decimal):
        rounded = val.quantize(Decimal(10) ** -scale)
        return format(rounded, "f")
    # String value (SQLite) — return as-is (already formatted by caller)
    return str(val)


def _ensure_utc(dt: datetime) -> datetime:
    """Attach UTC timezone to a naive datetime (SQLite strips timezone info in tests)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def _model_to_contract(m) -> Expense:  # type: ignore[no-untyped-def]
    """Map an ExpenseModel ORM instance to the generated Expense contract type."""
    quantity = None
    if m.quantity is not None:
        try:
            quantity = float(m.quantity)
        except (ValueError, TypeError):
            quantity = None
    # ORM stores date as a date object; ensure it is a date for contract compliance
    expense_date: date
    if isinstance(m.date, str):
        expense_date = date.fromisoformat(m.date)
    else:
        expense_date = m.date
    return Expense(
        id=str(m.id),
        userId=str(m.user_id),
        amount=_fmt_amount(m.amount, m.currency),
        currency=m.currency,
        category=m.category,
        description=m.description or "",
        date=expense_date,
        type=m.type,
        quantity=quantity,
        unit=m.unit,
        createdAt=_ensure_utc(m.created_at),
        updatedAt=_ensure_utc(m.updated_at),
    )


def _validate_expense_data(body: CreateExpenseRequest) -> None:
    """Validate expense request data."""
    currency = validate_currency(body.currency)
    validate_amount(currency, body.amount)
    if body.unit is not None:
        validate_unit(body.unit)


@router.post("", status_code=201, response_model=Expense)
def create_expense(
    body: CreateExpenseRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Expense:
    """Create a new expense or income entry."""
    _validate_expense_data(body)
    expense_repo = get_expense_repo(db)
    expense = expense_repo.create(
        user_id=str(current_user.id),
        data={
            "amount": body.amount,
            "currency": validate_currency(body.currency),
            "category": body.category,
            "description": body.description,
            "date": body.date.isoformat(),
            "type": body.type,
            "quantity": body.quantity,
            "unit": body.unit,
        },
    )
    return _model_to_contract(expense)


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict[str, str]:
    """Get expense summary grouped by currency as a flat currency-to-total mapping."""
    expense_repo = get_expense_repo(db)
    summaries = expense_repo.summary_by_currency(str(current_user.id))
    return {s["currency"]: _fmt_amount(s["total"], s["currency"]) for s in summaries}


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    page: int = Query(default=1, ge=0),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> ExpenseListResponse:
    """List own expense entries (paginated)."""
    expense_repo = get_expense_repo(db)
    page = max(1, page)
    items, total = expense_repo.list_by_user(str(current_user.id), page, size)
    total_pages = math.ceil(total / size) if size > 0 else 0
    return ExpenseListResponse(
        content=[_model_to_contract(e) for e in items],
        totalElements=total,
        totalPages=total_pages,
        page=page,
        size=size,
    )


@router.get("/{expense_id}", response_model=Expense)
def get_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Expense:
    """Get a specific expense entry by ID."""
    expense_repo = get_expense_repo(db)
    expense = expense_repo.find_by_id(expense_id)
    if expense is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    if str(expense.user_id) != str(current_user.id):
        raise ForbiddenError("Access denied")
    return _model_to_contract(expense)


@router.put("/{expense_id}", response_model=Expense)
def update_expense(
    expense_id: str,
    body: CreateExpenseRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Expense:
    """Update an expense entry."""
    expense_repo = get_expense_repo(db)
    expense = expense_repo.find_by_id(expense_id)
    if expense is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    if str(expense.user_id) != str(current_user.id):
        raise ForbiddenError("Access denied")
    _validate_expense_data(body)
    updated = expense_repo.update(
        expense_id,
        {
            "amount": body.amount,
            "currency": validate_currency(body.currency),
            "category": body.category,
            "description": body.description,
            "date": body.date.isoformat(),
            "type": body.type,
            "quantity": body.quantity,
            "unit": body.unit,
        },
    )
    if updated is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    return _model_to_contract(updated)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> None:
    """Delete an expense entry."""
    expense_repo = get_expense_repo(db)
    expense = expense_repo.find_by_id(expense_id)
    if expense is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    if str(expense.user_id) != str(current_user.id):
        raise ForbiddenError("Access denied")
    expense_repo.delete(expense_id)
