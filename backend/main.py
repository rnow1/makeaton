from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import engine, get_db
from backend.models import Base, User
from backend.auth import hash_password, require_role, get_current_user

from backend.routers import auth, products, plans, subscriptions, billing, invoices, payments, dashboard


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Seed admin user if none exists
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            admin_user = User(
                email="admin@brightloop.com",
                password_hash=hash_password("Admin@1234"),
                name="Admin",
                role="admin",
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()

    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Brightloop Billing API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(plans.router, prefix="/plans", tags=["plans"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])


# ---------------------------------------------------------------------------
# POST /staff  (admin only — owned by Person 1)
# ---------------------------------------------------------------------------

class StaffCreateRequest(BaseModel):
    email: str
    password: str
    name: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True


@app.post("/staff", response_model=UserOut, status_code=status.HTTP_201_CREATED, tags=["auth"])
def create_staff(
    body: StaffCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    """Admin-only: create a staff user."""
    from backend.auth import validate_password

    validate_password(body.password)

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role="staff",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/", tags=["health"])
def root():
    return {"message": "Brightloop Billing API is running."}
