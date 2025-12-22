import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { authStore } from "../../app/auth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await client.post("/api/v1/auth/login", { email, password });
      authStore.setToken(response.data.token);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content" style={{ maxWidth: "420px", margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        <p className="muted">Use the seeded account to enter the admin panel.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="input">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <span className="muted">{error}</span>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};
