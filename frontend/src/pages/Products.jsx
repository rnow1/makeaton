import { useState, useEffect } from "react";
import { api } from "../api";

// ─── flip to false once backend is live and your token is in localStorage ───
const USE_MOCK = false;

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Odoo CRM",
    type: "software",
    sales_price: 1200.0,
    cost_price: 400.0,
    notes: "Enterprise CRM solution",
    variants: [
      { id: 1, name: "Odoo Brand", price_delta: 560.0 },
      { id: 2, name: "White Label", price_delta: 0.0 },
    ],
  },
  {
    id: 2,
    name: "Support Pack",
    type: "service",
    sales_price: 300.0,
    cost_price: 80.0,
    notes: "",
    variants: [],
  },
];

const EMPTY_VARIANT = { name: "", price_delta: "" };
const EMPTY_FORM = {
  name: "",
  type: "",
  sales_price: "",
  cost_price: "",
  notes: "",
  variants: [],
};

// ─── helper ─────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function VariantBadges({ variants }) {
  if (!variants || variants.length === 0) {
    return <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No variants</span>;
  }
  return (
    <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
      {variants.map((v) => (
        <li
          key={v.id}
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "0.2rem 0.6rem",
            fontSize: "0.8rem",
            display: "flex",
            gap: "0.4rem",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600 }}>{v.name}</span>
          <span style={{ color: v.price_delta >= 0 ? "var(--success)" : "var(--error)" }}>
            {v.price_delta >= 0 ? "+" : ""}₹{fmt(v.price_delta)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }) {
  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>{product.name}</span>
          <span
            style={{
              marginLeft: "0.6rem",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0.15rem 0.55rem",
              fontSize: "0.75rem",
              color: "var(--accent)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {product.type}
          </span>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.875rem" }}>
          <span>
            <span style={{ color: "var(--text-muted)" }}>Sales </span>
            <strong style={{ color: "var(--success)" }}>₹{fmt(product.sales_price)}</strong>
          </span>
          <span>
            <span style={{ color: "var(--text-muted)" }}>Cost </span>
            <strong>₹{fmt(product.cost_price)}</strong>
          </span>
        </div>
      </div>

      {/* Notes */}
      {product.notes && (
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{product.notes}</p>
      )}

      {/* Variants */}
      <div>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Variants ({product.variants.length})
        </span>
        <VariantBadges variants={product.variants} />
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // ── load products ──────────────────────────────────────────────────────────
  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        setProducts(MOCK_PRODUCTS);
      } else {
        const data = await api("/products");
        setProducts(data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // ── form helpers ───────────────────────────────────────────────────────────
  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addVariant() {
    setForm((f) => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }));
  }

  function removeVariant(idx) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
  }

  function setVariantField(idx, field, value) {
    setForm((f) => {
      const variants = f.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v));
      return { ...f, variants };
    });
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // basic client-side validation
    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.type.trim()) return setFormError("Type is required.");
    if (form.sales_price === "" || isNaN(Number(form.sales_price)))
      return setFormError("Sales price must be a number.");
    if (form.cost_price === "" || isNaN(Number(form.cost_price)))
      return setFormError("Cost price must be a number.");
    for (const [i, v] of form.variants.entries()) {
      if (!v.name.trim()) return setFormError(`Variant ${i + 1}: name is required.`);
      if (v.price_delta === "" || isNaN(Number(v.price_delta)))
        return setFormError(`Variant ${i + 1}: price delta must be a number.`);
    }

    const payload = {
      name: form.name.trim(),
      type: form.type.trim(),
      sales_price: Number(form.sales_price),
      cost_price: Number(form.cost_price),
      notes: form.notes.trim(),
      variants: form.variants.map((v) => ({
        name: v.name.trim(),
        price_delta: Number(v.price_delta),
      })),
    };

    setSubmitting(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        const newProd = {
          ...payload,
          id: Date.now(),
          variants: payload.variants.map((v, i) => ({ ...v, id: i + 100 })),
        };
        setProducts((prev) => [newProd, ...prev]);
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await loadProducts();
      }
      setForm(EMPTY_FORM);
      setFormSuccess("Product created successfully!");
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div>
        <h1>Products</h1>
        <p className="page-subtitle">
          Manage your product catalogue and variants.
          {USE_MOCK && (
            <span style={{ marginLeft: "0.5rem", color: "var(--accent)", fontWeight: 600 }}>
              [MOCK DATA]
            </span>
          )}
        </p>
      </div>

      {/* ── Create product form ── */}
      <div className="card">
        <h2>Add New Product</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Row: name + type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                placeholder="e.g. Odoo CRM"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <input
                type="text"
                placeholder="e.g. software, service"
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
              />
            </div>
          </div>

          {/* Row: sales_price + cost_price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Sales Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.sales_price}
                onChange={(e) => setField("sales_price", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cost Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.cost_price}
                onChange={(e) => setField("cost_price", e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={2}
              placeholder="Optional notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Variants */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Variants
              </span>
              <button
                type="button"
                onClick={addVariant}
                style={{
                  background: "transparent",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  borderRadius: "6px",
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Variant
              </button>
            </div>

            {form.variants.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                No variants — click "Add Variant" to add one.
              </p>
            )}

            {form.variants.map((v, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px auto",
                  gap: "0.75rem",
                  alignItems: "end",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Variant Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Odoo Brand"
                    value={v.name}
                    onChange={(e) => setVariantField(idx, "name", e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Price Delta (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={v.price_delta}
                    onChange={(e) => setVariantField(idx, "price_delta", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--error)",
                    color: "var(--error)",
                    borderRadius: "6px",
                    padding: "0.45rem 0.7rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "0.35rem",
                  }}
                  title="Remove variant"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {formError && <div className="auth-error">{formError}</div>}
          {formSuccess && <div className="auth-success">{formSuccess}</div>}

          <button className="btn-primary" type="submit" disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {submitting ? "Creating…" : "Create Product"}
          </button>
        </form>
      </div>

      {/* ── Product list ── */}
      <div className="card">
        <h2>All Products ({loading ? "…" : products.length})</h2>

        {loading && (
          <p style={{ color: "var(--text-muted)" }}>Loading products…</p>
        )}

        {!loading && error && (
          <div className="auth-error">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No products yet. Create one above.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
