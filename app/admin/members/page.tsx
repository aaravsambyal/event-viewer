"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import { Plus, Trash2, Users, X, Mail, Lock, User, Eye, EyeOff, Building2, Search, Filter, ShieldQuestion } from "lucide-react";

interface Member {
  id: number;
  name: string;
  email: string;
  department?: string;
  created_at: string;
  created_by_name?: string;
}

export default function AdminMembersPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", security_question: "", security_answer: "" });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const { show, ToastComponent } = useToast();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== "admin") router.replace("/login");
      else setAuthChecked(true);
    });
  }, []);

  const load = async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    if (data.members) setMembers(data.members);
  };

  useEffect(() => { load(); }, []);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = members
      .map((m) => m.department)
      .filter(Boolean) as string[];
    return Array.from(new Set(depts)).sort();
  }, [members]);

  // Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesDept = deptFilter ? m.department === deptFilter : true;
      const matchesSearch = search
        ? m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesDept && matchesSearch;
    });
  }, [members, deptFilter, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { show(data.error || "Failed to add member", "error"); return; }
      show("Member added successfully", "success");
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", department: "", security_question: "", security_answer: "" });
      load();
    } catch { show("Error adding member", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove member "${name}"? Their events and images will remain.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) { show("Member removed", "success"); load(); }
      else { const d = await res.json(); show(d.error || "Delete failed", "error"); }
    } catch { show("Error deleting member", "error"); }
    finally { setDeleting(null); }
  };

  if (!authChecked) return null;

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="admin" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div className="section-header">
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>Manage Members</h1>
              <p style={{ color: "var(--color-gov-muted)", fontSize: "0.875rem" }}>
                {members.length} member{members.length !== 1 ? "s" : ""} registered
                {deptFilter && ` · Filtered: ${filtered.length} in ${deptFilter}`}
              </p>
            </div>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Member
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Filter size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
              <select
                className="form-input"
                style={{ paddingLeft: 36, appearance: "none" }}
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {(deptFilter || search) && (
              <button
                className="btn-outline btn-sm"
                onClick={() => { setDeptFilter(""); setSearch(""); }}
                style={{ alignSelf: "center" }}
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>

          <div className="gov-card">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Users size={32} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                  {members.length === 0 ? "No members yet" : "No members match your filter"}
                </p>
                <p style={{ fontSize: "0.875rem" }}>
                  {members.length === 0 ? "Add a member to get started." : "Try a different filter."}
                </p>
              </div>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Added By</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member, idx) => (
                    <tr key={member.id}>
                      <td style={{ color: "var(--color-gov-muted)", width: 40 }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "var(--color-gov-navy)", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                          }}>
                            {member.name.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{member.email}</td>
                      <td>
                        {member.department ? (
                          <span style={{
                            padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem",
                            background: "rgba(201,168,76,0.1)", color: "var(--color-gov-gold)",
                            border: "1px solid rgba(201,168,76,0.25)", fontWeight: 600,
                          }}>
                            {member.department}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-gov-muted)" }}>—</span>
                        )}
                      </td>
                        <td style={{ color: "var(--color-gov-muted)" }}>
                          {member.created_by_name || "Admin"}
                        </td>
                        <td style={{ color: "var(--color-gov-muted)" }}>
                          {new Date(member.created_at).toLocaleDateString("en-IN")}
                        </td>
                      <td>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(member.id, member.name)}
                          disabled={deleting === member.id}
                        >
                          <Trash2 size={13} />
                          {deleting === member.id ? "Removing…" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Add Member Modal */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-gov-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontWeight: 700 }}>Add New Member</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Full Name *</label>
                <div style={{ position: "relative" }}>
                  <User size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Member's full name"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Email Address *</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
                  <input type="email" className="form-input" style={{ paddingLeft: 36 }} placeholder="member@email.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Department</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} placeholder="e.g. Finance, Health, Education"
                    value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    list="dept-suggestions" />
                  <datalist id="dept-suggestions">
                    {departments.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Initial Password *</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
                  <input type={showPwd ? "text" : "password"} className="form-input" style={{ paddingLeft: 36, paddingRight: 40 }}
                    placeholder="Min. 6 characters" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-gov-muted)" }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Security Question (for password recovery)</label>
                <div style={{ position: "relative" }}>
                  <ShieldQuestion size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)", zIndex: 1 }} />
                  <select
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    value={form.security_question}
                    onChange={(e) => setForm({ ...form, security_question: e.target.value })}
                  >
                    <option value="">Select a question…</option>
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="What city were you born in?">What city were you born in?</option>
                    <option value="What is your favorite book?">What is your favorite book?</option>
                    <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                    <option value="What is the name of your best childhood friend?">What is the name of your best childhood friend?</option>
                    <option value="What is your favorite movie?">What is your favorite movie?</option>
                    <option value="What was the make and model of your first car?">What was the make and model of your first car?</option>
                    <option value="What is the name of the street you grew up on?">What is the name of the street you grew up on?</option>
                    <option value="What is your favorite food?">What is your favorite food?</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Security Answer</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" style={{ paddingLeft: 12 }} placeholder="Answer to the security question"
                    value={form.security_answer} onChange={(e) => setForm({ ...form, security_answer: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Adding…" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ToastComponent}
    </>
  );
}
