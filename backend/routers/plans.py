from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import Plan, Product
from backend.auth import require_role

router = APIRouter()

VALID_BILLING_PERIODS = {"daily", "weekly", "monthly", "yearly"}
VALID_END_BEHAVIORS = {"auto_close", "manual"}
VALID_STATUSES = {"open", "paused", "closed"}


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class PlanIn(BaseModel):
    product_id: int
    name: str
    price: float
    billing_period: str
    min_quantity: Optional[int] = 1
    start_date: str
    end_date: Optional[str] = None
    end_behavior: str

    @field_validator("billing_period")
    @classmethod
    def validate_billing_period(cls, v: str) -> str:
        if v not in VALID_BILLING_PERIODS:
            raise ValueError(f"billing_period must be one of: {', '.join(sorted(VALID_BILLING_PERIODS))}")
        return v

    @field_validator("end_behavior")
    @classmethod
    def validate_end_behavior(cls, v: str) -> str:
        if v not in VALID_END_BEHAVIORS:
            raise ValueError(f"end_behavior must be one of: {', '.join(sorted(VALID_END_BEHAVIORS))}")
        return v


class PlanStatusIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(VALID_STATUSES))}")
        return v


class PlanOut(BaseModel):
    id: int
    product_id: int
    name: str
    price: float
    billing_period: str
    min_quantity: int
    start_date: str
    end_date: Optional[str]
    end_behavior: str
    status: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=List[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    """Return all plans."""
    return db.query(Plan).all()


@router.post("", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(
    body: PlanIn,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Admin only: create a plan. New plans always start with status open."""
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    plan = Plan(
        product_id=body.product_id,
        name=body.name,
        price=round(body.price, 2),
        billing_period=body.billing_period,
        min_quantity=body.min_quantity if body.min_quantity is not None else 1,
        start_date=body.start_date,
        end_date=body.end_date,
        end_behavior=body.end_behavior,
        status="open",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/{plan_id}/status", response_model=PlanOut)
def update_plan_status(
    plan_id: int,
    body: PlanStatusIn,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Admin only: set plan status to open, paused, or closed. Setting open renews the plan."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    plan.status = body.status
    db.commit()
    db.refresh(plan)
    return plan
