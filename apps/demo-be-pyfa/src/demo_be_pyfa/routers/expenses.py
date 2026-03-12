"""Expenses router: CRUD, summary."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from demo_be_pyfa.auth.dependencies import get_current_user
from demo_be_pyfa.dependencies import get_db, get_expense_repo
from demo_be_pyfa.domain.errors import ForbiddenError, NotFoundError
from demo_be_pyfa.domain.expense import validate_amount, validate_currency, validate_unit
from demo_be_pyfa.infrastructure.models import UserModel

router = APIRouter()


class ExpenseRequest(BaseModel):
    """Create/update expense request."""

    amount: str
    currency: str
    category: str
    description: str | None = None
    date: str
    type: str = "expense"
    quantity: float | None = None
    unit: str | None = None


class ExpenseResponse(BaseModel):
    """Expense response model."""

    id: str
    amount: str
    currency: str
    category: str
    description: str | None
    date: str
    type: str
    quantity: float | None
    unit: str | None


class ExpenseListResponse(BaseModel):
    """Paginated expense list response."""

    data: list[ExpenseResponse]
    total: int
    page: int
    size: int


def _validate_expense_data(body: ExpenseRequest) -> None:
    """Validate expense request data."""
    currency = validate_currency(body.currency)
    validate_amount(currency, body.amount)
    if body.unit is not None:
        validate_unit(body.unit)


def _model_to_response(m) -> ExpenseResponse:  # type: ignore[no-untyped-def]
    quantity = None
    if m.quantity is not None:
        try:
            q = float(m.quantity)
            quantity = q
        except (ValueError, TypeError):
            quantity = None
    return ExpenseResponse(
        id=m.id,
        amount=m.amount,
        currency=m.currency,
        category=m.category,
        description=m.description,
        date=m.date,
        type=m.entry_type,
        quantity=quantity,
        unit=m.unit,
    )


@router.post("", status_code=201, response_model=ExpenseResponse)
def create_expense(
    body: ExpenseRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> ExpenseResponse:
    """Create a new expense or income entry."""
    _validate_expense_data(body)
    expense_repo = get_expense_repo(db)
    expense = expense_repo.create(
        user_id=current_user.id,
        data={
            "amount": body.amount,
            "currency": validate_currency(body.currency),
            "category": body.category,
            "description": body.description,
            "date": body.date,
            "type": body.type,
            "quantity": body.quantity,
            "unit": body.unit,
        },
    )
    return _model_to_response(expense)


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict[str, str]:
    """Get expense summary grouped by currency as a flat currency-to-total mapping."""
    expense_repo = get_expense_repo(db)
    summaries = expense_repo.summary_by_currency(current_user.id)
    return {s["currency"]: s["total"] for s in summaries}


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> ExpenseListResponse:
    """List own expense entries (paginated)."""
    expense_repo = get_expense_repo(db)
    items, total = expense_repo.list_by_user(current_user.id, page, size)
    return ExpenseListResponse(
        data=[_model_to_response(e) for e in items],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> ExpenseResponse:
    """Get a specific expense entry by ID."""
    expense_repo = get_expense_repo(db)
    expense = expense_repo.find_by_id(expense_id)
    if expense is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    if expense.user_id != current_user.id:
        raise ForbiddenError("Access denied")
    return _model_to_response(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    body: ExpenseRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> ExpenseResponse:
    """Update an expense entry."""
    expense_repo = get_expense_repo(db)
    expense = expense_repo.find_by_id(expense_id)
    if expense is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    if expense.user_id != current_user.id:
        raise ForbiddenError("Access denied")
    _validate_expense_data(body)
    updated = expense_repo.update(
        expense_id,
        {
            "amount": body.amount,
            "currency": validate_currency(body.currency),
            "category": body.category,
            "description": body.description,
            "date": body.date,
            "type": body.type,
            "quantity": body.quantity,
            "unit": body.unit,
        },
    )
    if updated is None:
        raise NotFoundError(f"Expense {expense_id} not found")
    return _model_to_response(updated)


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
    if expense.user_id != current_user.id:
        raise ForbiddenError("Access denied")
    expense_repo.delete(expense_id)
