"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldQuestion,
  ArrowLeft,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "answer" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [userName, setUserName] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleGetQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not find account");
        return;
      }
      setQuestion(data.question);
      setUserName(data.name);
      setStep("answer");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answer, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="forgot-card-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon-box">
              <KeyRound size={24} color="var(--color-gov-gold)" />
            </div>
            <h1 className="login-title">
              {step === "email" && "Forgot Password"}
              {step === "answer" && "Security Question"}
              {step === "reset" && "Reset Password"}
              {step === "done" && "Success!"}
            </h1>
            <p className="login-subtitle">
              {step === "email" && "Enter your email to get started"}
              {step === "answer" && "Answer the security question"}
              {step === "reset" && "Choose a new password"}
              {step === "done" && "Your password has been reset"}
            </p>
          </div>

          <div className="forgot-steps">
            <span className={`forgot-step ${step === "email" || step === "answer" || step === "reset" || step === "done" ? "active" : ""}`} />
            <span className={`forgot-step ${step === "answer" || step === "reset" || step === "done" ? "active" : ""}`} />
            <span className={`forgot-step ${step === "reset" || step === "done" ? "active" : ""}`} />
            <span className={`forgot-step ${step === "done" ? "active" : ""}`} />
          </div>

          <div className="login-form">
            {(step === "email" || step === "answer" || step === "reset") && error && (
              <div className="login-error">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {step === "done" && (
              <div className="forgot-success">
                <CheckCircle2 size={20} />
                Your password has been reset successfully. You can now sign in with your new password.
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleGetQuestion}>
                <div className="login-input-group-last">
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
                <button type="submit" className="btn-primary login-btn-full" disabled={loading}>
                  {loading ? (
                    <span className="login-spinner-inline">
                      <span className="login-spinner-circle" />
                      Checking…
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            )}

            {step === "answer" && (
              <form onSubmit={(e) => { e.preventDefault(); setStep("reset"); }}>
                <div style={{ marginBottom: 12, fontSize: "0.85rem", color: "var(--color-gov-muted)" }}>
                  Account: <strong style={{ color: "var(--color-gov-text)" }}>{userName}</strong>
                </div>
                <div className="forgot-question-box">
                  <ShieldQuestion size={16} />
                  {question}
                </div>
                <div className="login-input-group-last" style={{ marginTop: 20 }}>
                  <label className="form-label">Your Answer</label>
                  <div className="login-input-wrapper">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="form-input login-input-padded"
                      placeholder="Type your answer"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn-outline" onClick={() => { setStep("email"); setError(""); }} style={{ flex: 1, justifyContent: "center" }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={!answer.trim()}>
                    Continue
                  </button>
                </div>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleVerifyAndReset}>
                <div className="login-input-group-last">
                  <label className="form-label">New Password</label>
                  <div className="login-input-wrapper">
                    <Lock size={15} className="login-input-icon login-input-icon-size" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn-outline" onClick={() => { setStep("answer"); setError(""); }} style={{ flex: 1, justifyContent: "center" }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading || newPassword.length < 6}>
                    {loading ? (
                      <span className="login-spinner-inline">
                        <span className="login-spinner-circle" />
                        Resetting…
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === "done" && (
              <button
                className="btn-primary login-btn-full"
                onClick={() => router.push("/login")}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        <p className="login-footer">
          <a href="/login" className="forgot-back-link">
            <ArrowLeft size={12} /> Back to Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
