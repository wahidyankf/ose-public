"""Reports router: P&L report."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from demo_be_python_fastapi.auth.dependencies import get_current_user
from demo_be_python_fastapi.dependencies import get_db, get_expense_repo
from demo_be_python_fastapi.domain.expense import validate_currency
from demo_be_python_fastapi.infrastructure.models import UserModel

router = APIRouter()


class BreakdownItem(BaseModel):
    """Single category breakdown item."""

    category: str
    type: str
    total: str


class PLResponse(BaseModel):
    """Profit and loss report response."""

    totalIncome: str
    totalExpense: str
    net: str
    incomeBreakdown: list[BreakdownItem]
    expenseBreakdown: list[BreakdownItem]


@router.get("/pl", response_model=PLResponse)
def get_pl_report(
    start_date: str = Query(alias="startDate"),
    end_date: str = Query(alias="endDate"),
    currency: str = Query(),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> PLResponse:
    """Generate profit and loss report for a date range."""
    validated_currency = validate_currency(currency)
    expense_repo = get_expense_repo(db)
    report = expense_repo.pl_report(current_user.id, start_date, end_date, validated_currency)
    income_breakdown = [
        BreakdownItem(category=cat, type="income", total=amt)
        for cat, amt in report["income_breakdown"].items()
    ]
    expense_breakdown = [
        BreakdownItem(category=cat, type="expense", total=amt)
        for cat, amt in report["expense_breakdown"].items()
    ]
    return PLResponse(
        totalIncome=report["totalIncome"],
        totalExpense=report["totalExpense"],
        net=report["net"],
        incomeBreakdown=income_breakdown,
        expenseBreakdown=expense_breakdown,
    )
