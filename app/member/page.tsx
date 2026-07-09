import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MemberDashboard() {
  const session = await getSession();
  if (!session || (session.role !== "member" && session.role !== "admin")) redirect("/login");

  const db = await getDb();

  // Members can upload if they are the creator, explicitly assigned, or in the same department
  const assignedEvents = (db.prepare(
    `SELECT COUNT(DISTINCT e.id) as c FROM events e
     LEFT JOIN event_members em ON em.event_id = e.id AND em.user_id = ?
     WHERE e.created_by = ?
        OR em.user_id = ?
        OR (e.department IS NOT NULL AND e.department = ?)`
  ).get(session.id, session.id, session.id, session.department || '') as any).c;

  const activeAssigned = (db.prepare(
    `SELECT COUNT(DISTINCT e.id) as c FROM events e
     LEFT JOIN event_members em ON em.event_id = e.id AND em.user_id = ?
     WHERE e.status = 'active'
       AND (e.created_by = ?
        OR em.user_id = ?
        OR (e.department IS NOT NULL AND e.department = ?))`
  ).get(session.id, session.id, session.id, session.department || '') as any).c;

  const imageCount = (db.prepare(
    `SELECT COUNT(*) as c FROM images WHERE uploader_id = ?`
  ).get(session.id) as any).c;

  const stats = {
    events: assignedEvents,
    activeEvents: activeAssigned,
    images: imageCount,
  };

  const recentEvents = db.prepare(`
    SELECT DISTINCT e.id, e.title, e.status, e.event_date, e.type, e.department,
           COUNT(DISTINCT i.id) as image_count
    FROM events e
    LEFT JOIN event_members em ON em.event_id = e.id AND em.user_id = ?
    LEFT JOIN images i ON i.event_id = e.id
    WHERE e.created_by = ?
       OR em.user_id = ?
       OR (e.department IS NOT NULL AND e.department = ?)
    GROUP BY e.id ORDER BY e.created_at DESC LIMIT 5
  `).all(session.id, session.id, session.id, session.department || '') as any[];

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="member" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Member Dashboard</h1>
            <p style={{ color: "var(--color-gov-muted)", fontSize: "0.875rem" }}>
              Welcome, {session.name}
              {session.department && (
                <span style={{
                  marginLeft: 10, padding: "2px 10px",
                  background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: 999, fontSize: "0.75rem", color: "var(--color-gov-gold)",
                }}>
                  {session.department}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="My Events" value={stats.events} iconName="Calendar" href="/member/events" />
            <StatCard label="Active Events" value={stats.activeEvents} iconName="TrendingUp" href="/member/events" />
            <StatCard label="Images Uploaded" value={stats.images} iconName="Image" href="/member/events" />
          </div>

          <div className="gov-card">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-gov-border)", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>My Assigned Events</h2>
              <Link href="/member/events" style={{ fontSize: "0.8125rem", color: "var(--color-gov-navy)", textDecoration: "none" }}>View All →</Link>
            </div>
            {recentEvents.length === 0 ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>No events assigned</p>
                <p style={{ fontSize: "0.875rem", marginBottom: 16 }}>You haven&apos;t been assigned to any events yet.</p>
              </div>
            ) : (
              <table className="gov-table">
                <thead><tr><th>Title</th><th>Type</th><th>Department</th><th>Status</th><th>Images</th><th>Date</th></tr></thead>
                <tbody>
                  {recentEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <Link href={`/events/${ev.id}`} style={{ color: "var(--color-gov-navy)", fontWeight: 500, textDecoration: "none" }}>
                          {ev.title}
                        </Link>
                        <Link href={`/member/upload?eventId=${ev.id}`} style={{ display: "block", fontSize: "0.75rem", color: "var(--color-gov-muted)", textDecoration: "none" }}>
                          Upload Images →
                        </Link>
                      </td>
                      <td>
                          <span className={`badge badge-${ev.type === 'sub' ? 'closed' : 'active'}`}>
                          {ev.type === 'sub' ? 'Sub-Event' : 'Main'}
                        </span>
                      </td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{ev.department || "—"}</td>
                      <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{ev.image_count}</td>
                      <td style={{ color: "var(--color-gov-muted)" }}>
                        {ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
