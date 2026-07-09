"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ChevronRight,
  Settings,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "member";
}

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/members", label: "Manage Members", icon: Users },
  { href: "/admin/events", label: "All Events", icon: Calendar },
  { href: "/events", label: "Events Gallery", icon: Calendar },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const memberLinks = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/member/events", label: "My Events", icon: Calendar },
  { href: "/events", label: "Events Gallery", icon: Calendar },
  { href: "/member/settings", label: "Settings", icon: Settings },
];

const linkMap = { admin: adminLinks, member: memberLinks };

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = linkMap[role];
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {isOpen && <div className="sidebar-overlay mobile-only" onClick={() => setIsOpen(false)} />}
      <aside
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={{ padding: "24px 0" }}
      >
      <div style={{ padding: "0 16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {role} panel
        </div>
      </div>

      <nav style={{ padding: "12px 8px" }}>
        {links.map((link) => {
          const Icon = link.icon;
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 7,
                marginBottom: 2,
                color: active ? "var(--color-gov-gold)" : "rgba(255,255,255,0.65)",
                fontWeight: active ? 600 : 400,
                fontSize: "0.875rem",
                textDecoration: "none",
                background: active ? "rgba(201,168,76,0.12)" : "transparent",
                borderLeft: active ? "3px solid var(--color-gov-gold)" : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
