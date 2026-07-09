import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// POST: Add member to event (admin or the event's creator)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session || (session.role !== "admin" && session.role !== "member")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const eventId = parseInt(id);
  const db = await getDb();

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId) as any;
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Members can only assign members to their own events
  if (session.role === "member" && event.created_by !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const user = db.prepare("SELECT id, role FROM users WHERE id = ?").get(user_id) as any;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role !== "member") {
    return NextResponse.json({ error: "Only members can be assigned to events" }, { status: 400 });
  }

  try {
    db.prepare("INSERT INTO event_members (event_id, user_id) VALUES (?, ?)").run(eventId, user_id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Member already in event" }, { status: 409 });
  }
}

// GET: List members of an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id);
  const db = await getDb();

  const members = db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.department
     FROM event_members em
     JOIN users u ON u.id = em.user_id
     WHERE em.event_id = ?`
  ).all(eventId);

  return NextResponse.json({ members });
}
