from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Text, Date
)
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="customer")  # admin | staff | customer

    subscriptions = relationship("Subscription", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    sales_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    notes = Column(Text, default="")

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String, nullable=False)
    price_delta = Column(Float, nullable=False, default=0.0)

    product = relationship("Product", back_populates="variants")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    billing_period = Column(String, nullable=False)   # daily | weekly | monthly | yearly
    min_quantity = Column(Integer, nullable=False, default=1)
    start_date = Column(String, nullable=False)        # ISO date string
    end_date = Column(String, nullable=True)
    end_behavior = Column(String, nullable=False)      # auto_close | manual
    status = Column(String, nullable=False, default="open")  # open | paused | closed

    product = relationship("Product", back_populates="plans")
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, nullable=True)             # SUB-0001, set after insert
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    start_date = Column(String, nullable=False)
    expiry_date = Column(String, nullable=True)
    payment_terms_days = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="draft")
    # draft | quotation | confirmed | active | closed

    customer = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    variant = relationship("ProductVariant")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription")


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    tax_rate = Column(Float, nullable=False, default=0.18)
    amount = Column(Float, nullable=False)

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, nullable=True)             # INV-0001, set after insert
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invoice_date = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    period = Column(String, nullable=False)            # e.g. "2026-11"
    status = Column(String, nullable=False, default="draft")
    # draft | confirmed | paid | cancelled
    subtotal = Column(Float, nullable=False, default=0.0)
    tax_total = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    amount_paid = Column(Float, nullable=False, default=0.0)

    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("User", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    tax_rate = Column(Float, nullable=False, default=0.18)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False)   # cash | bank | card | upi
    paid_on = Column(String, nullable=False)  # ISO date string
    note = Column(Text, default="")

    invoice = relationship("Invoice", back_populates="payments")


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)              # fixed | percent
    value = Column(Float, nullable=False)
    min_amount = Column(Float, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    usage_limit = Column(Integer, nullable=True)
    times_used = Column(Integer, nullable=False, default=0)
