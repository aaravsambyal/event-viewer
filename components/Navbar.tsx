"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const roleBadge: Record<string, string> = {
    admin: "badge-admin",
    member: "badge-member",
  };

  return (
    <header
      suppressHydrationWarning
      style={{
        background: "rgba(33, 37, 43, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-gov-border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="mobile-only">
            <button 
              onClick={() => {
                if (pathname.startsWith('/admin') || pathname.startsWith('/member')) {
                  window.dispatchEvent(new Event("toggle-sidebar"));
                } else {
                  setMenuOpen(!menuOpen);
                }
              }}
              style={{ 
                background: "none", border: "none", cursor: "pointer", 
                color: "white", padding: 4, display: "flex", alignItems: "center" 
              }}
            >
              <Menu size={24} color="white" />
            </button>
          </div>
          
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "rgba(201,168,76,0.15)",
                border: "1px solid var(--color-gov-gold)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={18} color="var(--color-gov-gold)" />
            </div>
            <div className="desktop-only">
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
                Event Viewer
              </div>
            </div>

          </Link>
        </div>

        {/* Nav links */}
        <div className="desktop-only">
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NavLink href="/events" label="Events" current={pathname} />
            {user?.role === "admin" && <NavLink href="/admin" label="Admin" current={pathname} />}
            {user?.role === "member" && <NavLink href="/member" label="Dashboard" current={pathname} />}
          </nav>
        </div>

        {/* Mobile Dropdown Nav */}
        {menuOpen && (!pathname.startsWith('/admin') && !pathname.startsWith('/member')) && (
          <div className="mobile-only" style={{
            position: "absolute",
            top: 64,
            left: 0,
            right: 0,
            background: "var(--color-gov-surface)",
            borderBottom: "1px solid var(--color-gov-border)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
          }}>
            <NavLink href="/events" label="Events Gallery" current={pathname} />
            {user?.role === "admin" && <NavLink href="/admin" label="Admin Panel" current={pathname} />}
            {user?.role === "member" && <NavLink href="/member" label="Member Dashboard" current={pathname} />}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="https://github.com/akshat-jasrotia/event-viewer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              padding: 6,
              borderRadius: 6,
              color: "rgba(255,255,255,0.6)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            aria-label="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--color-gov-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#1a2a00",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="desktop-only" style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{user.name}</div>
                  <span className={`badge ${roleBadge[user.role] || "badge-member"}`} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={12} className="desktop-only" style={{ opacity: 0.6 }} color="white" />
              </button>

              {dropOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "var(--color-gov-surface)",
                    border: "1px solid var(--color-gov-border)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-elevated)",
                    minWidth: 180,
                    overflow: "hidden",
                    zIndex: 50,
                  }}
                  onMouseLeave={() => setDropOpen(false)}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-gov-border)" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white" }}>{user.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)" }}>{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-gov-danger)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-gold btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label, current }: { href: string; label: string; current: string }) {
  const active = current.startsWith(href);
  return (
    <Link
      href={href}
      style={{
        padding: "6px 14px",
        borderRadius: 6,
        color: active ? "var(--color-gov-gold)" : "rgba(255,255,255,0.75)",
        fontWeight: active ? 600 : 400,
        fontSize: "0.875rem",
        textDecoration: "none",
        background: active ? "rgba(201,168,76,0.12)" : "transparent",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </Link>
  );
}
