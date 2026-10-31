from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import Product, ProductVariant
from backend.auth import require_role

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class VariantIn(BaseModel):
    name: str
    price_delta: float


class ProductIn(BaseModel):
    name: str
    type: str
    sales_price: float
    cost_price: float
    notes: Optional[str] = ""
    variants: Optional[List[VariantIn]] = []


class VariantOut(BaseModel):
    id: int
    name: str
    price_delta: float

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    name: str
    type: str
    sales_price: float
    cost_price: float
    notes: str
    variants: List[VariantOut]

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    """Return every product with its variants array."""
    return db.query(Product).all()


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductIn,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Admin only: create a product and all its variants in one transaction."""
    try:
        product = Product(
            name=body.name,
            type=body.type,
            sales_price=round(body.sales_price, 2),
            cost_price=round(body.cost_price, 2),
            notes=body.notes or "",
        )
        db.add(product)
        db.flush()  # get product.id without committing

        for v in body.variants:
            variant = ProductVariant(
                product_id=product.id,
                name=v.name,
                price_delta=round(v.price_delta, 2),
            )
            db.add(variant)

        db.commit()
        db.refresh(product)
        return product

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create product. Transaction rolled back.",
        )
