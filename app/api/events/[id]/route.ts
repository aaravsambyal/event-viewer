import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// GET: Single event with members and image count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id);
  if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = await getDb();
  const event = db.prepare(
    `SELECT e.*, u.name as created_by_name, u.id as created_by_id, 
            e.department as assigned_department,
            COUNT(DISTINCT i.id) as image_count
     FROM events e
     LEFT JOIN users u ON e.created_by = u.id
     LEFT JOIN images i ON i.event_id = e.id
     WHERE e.id = ?
     GROUP BY e.id`
  ).get(eventId) as any;

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const members = db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.department
     FROM event_members em
     JOIN users u ON u.id = em.user_id
     WHERE em.event_id = ?`
  ).all(eventId);

  return NextResponse.json({ event, members });
}

// PATCH: Update event (owner or admin)
export async function PATCH(
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

  // Members can edit if they created the event, are assigned, or match department
  let hasPermission = false;
  if (session.role === "admin") {
    hasPermission = true;
  } else {
    const isCreator = event.created_by === session.id;
    const isAssigned = !!db.prepare("SELECT 1 FROM event_members WHERE event_id = ? AND user_id = ?").get(eventId, session.id);
    const isDeptMatched = event.department && session.department && event.department === session.department;
    hasPermission = isCreator || isAssigned || isDeptMatched;
  }

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, event_date, location, country, state, district, status, type, parent_id, department, participant_count, closing_date } = body;

  // Verify parent exists
  if ((type === 'sub' || parent_id !== undefined) && (parent_id ?? event.parent_id)) {
    const checkParentId = parent_id ?? event.parent_id;
    const parent = db.prepare("SELECT id FROM events WHERE id = ?").get(checkParentId) as any;
    if (!parent) {
      return NextResponse.json({ error: "Parent event not found" }, { status: 400 });
    }
  }

  // Validate closing restrictions
  if (status === "closed" && event.status !== "closed" && event.type === "main" && session.role !== "admin") {
    return NextResponse.json(
      { error: "Main events can only be ended by an admin." },
      { status: 400 }
    );
  }

  // Cascade close all descendant sub-events recursively when any event is closed
  if (status === "closed" && event.status !== "closed") {
    db.prepare(`
      WITH RECURSIVE descendants(id) AS (
        SELECT id FROM events WHERE parent_id = ?
        UNION ALL
        SELECT e.id FROM events e JOIN descendants d ON e.parent_id = d.id
      )
      UPDATE events SET status = 'closed' WHERE id IN (SELECT id FROM descendants) AND status = 'active'
    `).run(eventId);
  }

  const fields: string[] = [];
  const sqlParams: any[] = [];
  const allowedFields = [
    "title",
    "description",
    "event_date",
    "location",
    "country",
    "state",
    "district",
    "status",
    "type",
    "parent_id",
    "department",
    "participant_count",
    "closing_date"
  ];

  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      let val = body[key];
      if (key === "participant_count") {
        val = val !== null && val !== "" ? parseInt(val) : null;
      } else if (key === "parent_id") {
        val = val !== null && val !== "" ? parseInt(val) : null;
      } else if (key === "description" || key === "department") {
        val = val || null;
      } else if (key === "event_date" || key === "location" || key === "closing_date" || key === "country" || key === "state" || key === "district") {
        if (!val) {
          return NextResponse.json({ error: `${key} cannot be empty` }, { status: 400 });
        }
      }
      sqlParams.push(val);
    }
  }

  if (fields.length > 0) {
    sqlParams.push(eventId);
    db.prepare(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`).run(...sqlParams);
  }

  const updated = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  return NextResponse.json({ success: true, event: updated });
}

// DELETE: Delete event (owner or admin)
export async function DELETE(
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

  // Members can only delete their own events
  if (session.role === "member" && event.created_by !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete associated images from filesystem
  const images = db.prepare("SELECT filename FROM images WHERE event_id = ?").all(eventId) as any[];
  const fs = require("fs");
  const path = require("path");
  for (const img of images) {
    const filePath = path.join(process.cwd(), "public", "uploads", img.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
  return NextResponse.json({ success: true });
}
