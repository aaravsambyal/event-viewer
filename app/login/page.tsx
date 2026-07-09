"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Eye, EyeOff, Lock, Mail, AlertCircle, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.setupRequired) {
          setSetupRequired(true);
          setSetupMode(true);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const { role } = data.user;
      if (role === "admin") window.location.href = "/admin";
      else if (role === "member") window.location.href = "/member";
      else window.location.href = "/events";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: setupName, email: setupEmail, password: setupPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup failed");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon-box">
              <Calendar size={24} color="var(--color-gov-gold)" />
            </div>
            <h1 className="login-title">
              Staff Portal Sign In
            </h1>
            <p className="login-subtitle">
              Authorized personnel only
            </p>
          </div>

          {checking ? (
            <div className="login-form-spinner">
              <span className="login-checking-spinner" />
            </div>
          ) : setupMode ? (
            <form onSubmit={handleSetup} className="login-form">
              {error && (
                <div className="login-error">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div className="login-setup-banner">
                <UserPlus size={16} />
                No admin account found. Create one to get started.
              </div>

              <div className="login-input-group-compact">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              <div className="login-input-group-compact">
                <label className="form-label">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail size={15} className="login-input-icon login-input-icon-size" />
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="form-input login-input-padded"
                    placeholder="admin@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-input-group-last">
                <label className="form-label">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={15} className="login-input-icon login-input-icon-size" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="form-input login-input-padded-right"
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="login-toggle-pwd"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary login-btn-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="login-spinner-inline">
                    <span className="login-spinner-circle" />
                    Creating admin…
                  </span>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="login-form">
              {error && (
                <div className="login-error">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div className="login-input-group">
                <label className="form-label">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail size={15} className="login-input-icon login-input-icon-size" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input login-input-padded"
                    placeholder="name@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-input-group-last">
                <label className="form-label">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={15} className="login-input-icon login-input-icon-size" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input login-input-padded-right"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="login-toggle-pwd"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <a href="/forgot-password" className="forgot-link">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary login-btn-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="login-spinner-inline">
                    <span className="login-spinner-circle" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In Securely"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="login-footer">
          © Event Viewer
        </p>
      </div>
    </div>
  );
}
