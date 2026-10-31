Brightloop Billing: API Contract
Stack
Backend: Python, FastAPI, SQLAlchemy, SQLite (billing.db, created automatically)
Auth: bcrypt for passwords, PyJWT for tokens, sent as Authorization: Bearer <token>
Frontend: React with Vite, React Router, plain fetch
Ports: backend 8000, frontend 5173. CORS allowed for http://localhost:5173.
Money: floats rounded to 2 decimals
Dates: ISO strings, like 2026-11-01
Field names: snake_case everywhere
Errors: {"detail": "message"} with status 400, 401, 403, or 404
Tax: flat 18% on all invoice lines, TAX_RATE = 0.18
Roles
Role	Can do
admin	Everything, including products, plans, discounts, and staff
staff	Create subscriptions, run billing, edit invoices, record payments, view dashboard
customer	Sign up, log in, view own subscriptions and invoices
Auth
POST /auth/signup with {email, password, name} returns 201 and {id, email, name, role}. Role is always customer.
POST /auth/login with {email, password} returns {token, user_id, role}
GET /auth/me returns the current user
POST /staff (admin only) with {email, password, name} creates a user with role staff

Password rule: more than 8 characters, with at least one uppercase letter, one lowercase letter, and one special character. Duplicate email returns 400.

Products
GET /products returns a list
POST /products (admin) with {name, type, sales_price, cost_price, notes, variants}
json
{"id": 1, "name": "Odoo CRM", "type": "software", "sales_price": 1200.0,
 "cost_price": 400.0, "notes": "", "variants": [{"id": 1, "name": "Odoo brand", "price_delta": 560.0}]}
Plans
GET /plans returns a list
POST /plans (admin) with {product_id, name, price, billing_period, min_quantity, start_date, end_date, end_behavior}
billing_period: daily, weekly, monthly, yearly
end_behavior: auto_close or manual
PATCH /plans/{id}/status (admin) with {status}
status: open, paused, closed. Setting open again renews a plan.
Subscriptions
GET /subscriptions returns all for staff and admin, and only the customer’s own for customers
POST /subscriptions (staff or admin) with {customer_id, plan_id, quantity, start_date, expiry_date, payment_terms_days, variant_id}
variant_id is optional. If given, its price_delta is added to the unit price.
Starts in status draft. Lines are generated from the plan’s product.
PATCH /subscriptions/{id}/status with {status}
Allowed order only: draft → quotation → confirmed → active → closed
Any other move returns 400
json
{"id": 1, "number": "SUB-0001", "customer_id": 3, "plan_id": 2, "quantity": 5,
 "start_date": "2026-11-01", "expiry_date": "2027-10-31", "payment_terms_days": 15,
 "status": "draft", "lines": [{"product_id": 1, "quantity": 5, "unit_price": 1200.0,
 "tax_rate": 0.18, "amount": 6000.0}]}
Billing
POST /billing/run (staff or admin) creates one invoice for each active subscription that doesn’t already have an invoice for the current period. Returns {"created": 12, "skipped": 3, "invoice_ids": [1, 2]}.
Invoices
GET /invoices returns all for staff and admin, and only the customer’s own for customers
GET /invoices/{id}
PATCH /invoices/{id}/status with {status}
Allowed order: draft → confirmed → paid, plus cancelled from draft or confirmed
json
{"id": 1, "number": "INV-0001", "subscription_id": 1, "customer_id": 3,
 "invoice_date": "2026-11-01", "due_date": "2026-11-16", "status": "confirmed",
 "subtotal": 6000.0, "tax_total": 1080.0, "total": 7080.0, "amount_paid": 0.0,
 "lines": [{"product_id": 1, "quantity": 5, "unit_price": 1200.0, "tax_rate": 0.18, "amount": 6000.0}]}
Payments
POST /payments (staff or admin) with {invoice_id, amount, method, paid_on, note}
method: cash, bank, card, upi
When amount_paid reaches total, the invoice status becomes paid
GET /payments returns a list
Dashboard
GET /dashboard (staff or admin)
json
{"active_subscriptions": 42, "revenue_collected": 150000.0, "outstanding": 32000.0,
 "overdue_count": 4, "overdue_invoices": [{"id": 7, "number": "INV-0007", "total": 7080.0, "due_date": "2026-10-20"}]}
Stretch (only if time allows)
POST /discounts (admin) with {type, value, min_amount, product_id, subscription_id, start_date, end_date, usage_limit}
type: fixed or percent
Ownership

Only Person 1 edits models.py after the first 30 minutes. If you need a column or field, message them.