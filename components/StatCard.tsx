"use client";

import Link from "next/link";
import { Users, Calendar, Image, UserCheck, TrendingUp, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Calendar,
  Image,
  UserCheck,
  TrendingUp,
};

interface StatCardProps {
  label: string;
  value: number;
  iconName: string;
  href: string;
}

export default function StatCard({ label, value, iconName, href }: StatCardProps) {
  const Icon = iconMap[iconName] || Calendar;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        className="stat-card"
        style={{ cursor: "pointer", transition: "box-shadow 0.2s", background: "var(--color-gov-surface)" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-elevated)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.boxShadow = "")
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </span>
          <Icon size={16} color="var(--color-gov-gold)" />
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-gov-gold)" }}>
          {value}
        </div>
      </div>
    </Link>
  );
}
