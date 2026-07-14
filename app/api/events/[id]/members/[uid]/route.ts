import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// DELETE: Remove member from event (admin or event creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session || (session.role !== "admin" && session.role !== "member")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, uid } = await params;
  const eventId = parseInt(id);
  const userId = parseInt(uid);
  const db = await getDb();

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId) as any;
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Members can only remove from their own events
  if (session.role === "member") {
    if (!event.created_by || event.created_by !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const isDeptMatched = !event.department || (session.department && event.department === session.department);
    if (!isDeptMatched) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  db.prepare("DELETE FROM event_members WHERE event_id = ? AND user_id = ?").run(eventId, userId);
  return NextResponse.json({ success: true });
}
