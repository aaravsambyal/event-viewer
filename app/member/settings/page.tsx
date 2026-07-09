"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import { ShieldQuestion, Save, User, Mail, Lock, HelpCircle, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";

const securityQuestions = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was the name of your elementary school?",
  "What is the name of your best childhood friend?",
  "What is your favorite movie?",
  "What was the make and model of your first car?",
  "What is the name of the street you grew up on?",
  "What is your favorite food?",
];

export default function MemberSettingsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const { show, ToastComponent } = useToast();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || (d.user.role !== "member" && d.user.role !== "admin")) router.replace("/login");
      else {
        setName(d.user.name || "");
        setEmail(d.user.email || "");
        setAuthChecked(true);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      show("Passwords do not match", "error");
      return;
    }
    setSaving(true);
    try {
      const profileRes = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const profileData = await profileRes.json();
      if (!profileData.success) {
        show(profileData.error || "Failed to save profile", "error");
        setSaving(false);
        return;
      }

      if (securityQuestion && securityAnswer) {
        const secRes = await fetch("/api/auth/security-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ security_question: securityQuestion, security_answer: securityAnswer }),
        });
        const secData = await secRes.json();
        if (!secData.success) {
          show(secData.error || "Failed to save security question", "error");
          setSaving(false);
          return;
        }
      }

      if (newPassword) {
        const pwdRes = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
        const pwdData = await pwdRes.json();
        if (!pwdData.success) {
          show(pwdData.error || "Failed to change password", "error");
          setSaving(false);
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      show("Settings saved successfully", "success");
    } catch {
      show("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) return null;

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="member" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Settings</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              Manage your profile and security settings
            </p>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginBottom: 20, gridAutoRows: "1fr" }}>
            <div className="gov-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20, color: "white" }}>
                <User size={15} style={{ color: "var(--color-gov-gold)", marginRight: 6, verticalAlign: "middle" }} />
                Profile
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <User size={14} style={{ color: "var(--color-gov-muted)" }} />
                  Name
                </label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Mail size={14} style={{ color: "var(--color-gov-muted)" }} />
                  Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="gov-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20, color: "white" }}>
                <ShieldQuestion size={15} style={{ color: "var(--color-gov-gold)", marginRight: 6, verticalAlign: "middle" }} />
                Security Question
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <HelpCircle size={14} style={{ color: "var(--color-gov-muted)" }} />
                  Question
                </label>
                <select
                  className="form-input"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                >
                  <option value="">Select a question…</option>
                  {securityQuestions.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <KeyRound size={14} style={{ color: "var(--color-gov-muted)" }} />
                  Answer
                </label>
                <input
                  className="form-input"
                  placeholder="Your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                />
              </div>
            </div>

            <div className="gov-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20, color: "white" }}>
                <Lock size={15} style={{ color: "var(--color-gov-gold)", marginRight: 6, verticalAlign: "middle" }} />
                Change Password
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Lock size={14} style={{ color: "var(--color-gov-muted)" }} />
                  Current Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    className="form-input"
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="login-toggle-pwd"
                  >
                    {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <KeyRound size={14} style={{ color: "var(--color-gov-muted)" }} />
                  New Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    className="form-input"
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="login-toggle-pwd"
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={14} style={{ color: "var(--color-gov-muted)" }} />
                  Confirm New Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    className="form-input"
                    type={showNewPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
              </div>

            </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {saving ? <>&nbsp;Saving…</> : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </main>
      </div>
      {ToastComponent}
    </>
  );
}
