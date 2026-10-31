import { useState } from "react";
import { api } from "../api";

export default function Users() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const user = await api("/staff", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });
      setSuccess(`Staff member "${user.name}" (${user.email}) created successfully.`);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <h1>Manage Staff</h1>
      <p className="page-subtitle">Create a new staff member account.</p>

      <div className="card">
        <h2>Add Staff Member</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="staff-name">Full name</label>
            <input
              id="staff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@brightloop.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <small className="form-hint">
              More than 8 chars, one uppercase, one lowercase, one special character.
            </small>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create staff account"}
          </button>
        </form>
      </div>
    </div>
  );
}
