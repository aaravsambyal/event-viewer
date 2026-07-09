import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const db = await getDb();
  const stats = {
    members: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='member'").get() as any).c,
    events: (db.prepare("SELECT COUNT(*) as c FROM events").get() as any).c,
    activeEvents: (db.prepare("SELECT COUNT(*) as c FROM events WHERE status='active'").get() as any).c,
    images: (db.prepare("SELECT COUNT(*) as c FROM images").get() as any).c,
  };

  const recentEvents = db.prepare(`
    SELECT e.id, e.title, e.status, e.created_at, u.name as created_by_name, u.department as department,
           COUNT(DISTINCT i.id) as image_count
    FROM events e LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN images i ON i.event_id = e.id
    GROUP BY e.id ORDER BY e.created_at DESC LIMIT 5
  `).all() as any[];

  const recentMembers = db.prepare(
    "SELECT id, name, email, department, created_at FROM users WHERE role='member' ORDER BY created_at DESC LIMIT 5"
  ).all() as any[];

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="admin" />
        <main style={{ flex: 1, padding: "32px 32px", overflowY: "auto" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</h1>
            <p style={{ color: "var(--color-gov-muted)", fontSize: "0.875rem" }}>
              Welcome back, {session.name}. Here's an overview of the portal.
            </p>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Members" value={stats.members} iconName="Users" href="/admin/members" />
            <StatCard label="Total Events" value={stats.events} iconName="Calendar" href="/admin/events" />
            <StatCard label="Active Events" value={stats.activeEvents} iconName="TrendingUp" href="/admin/events" />
            <StatCard label="Images Archived" value={stats.images} iconName="Image" href="/admin/events" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Recent Events */}
            <div className="gov-card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-gov-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Recent Events</h2>
                <Link href="/admin/events" style={{ fontSize: "0.8125rem", color: "var(--color-gov-navy)", textDecoration: "none" }}>View All →</Link>
              </div>
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Dept</th>
                    <th>Status</th>
                    <th>Images</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <Link href={`/events/${ev.id}`} style={{ color: "var(--color-gov-navy)", textDecoration: "none", fontWeight: 500 }}>
                          {ev.title}
                        </Link>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)" }}>{ev.created_by_name}</div>
                      </td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{ev.department || "—"}</td>
                      <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{ev.image_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent Members */}
            <div className="gov-card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-gov-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Recent Members</h2>
                <Link href="/admin/members" style={{ fontSize: "0.8125rem", color: "var(--color-gov-navy)", textDecoration: "none" }}>View All →</Link>
              </div>
              <table className="gov-table">
                <thead><tr><th>Name</th><th>Department</th><th>Joined</th></tr></thead>
                <tbody>
                  {recentMembers.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.name}</td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{m.department || "—"}</td>
                      <td style={{ color: "var(--color-gov-muted)" }}>
                        {new Date(m.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
