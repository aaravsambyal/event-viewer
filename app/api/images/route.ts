import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const department = searchParams.get("department");
  const random = searchParams.get("random");

  let query = "";
  const params: any[] = [];
  const clauses: string[] = [];

  if (eventId) {
    query = `
      WITH RECURSIVE event_tree(id, depth) AS (
        SELECT id, 1 FROM events WHERE id = ?
        UNION
        SELECT e.id, et.depth + 1 FROM events e JOIN event_tree et ON e.parent_id = et.id
        WHERE et.depth < 100
      )
      SELECT i.id, i.filename, i.original_name, i.caption, i.uploaded_at,
             u.name as uploader_name, u.id as uploader_id,
             e.department as event_department, e.title as event_title,
             e.id as event_id, e.type as event_type, e.parent_id as event_parent_id
      FROM images i
      JOIN users u ON u.id = i.uploader_id
      JOIN events e ON e.id = i.event_id
      WHERE i.event_id IN (SELECT id FROM event_tree)
    `;
    params.push(parseInt(eventId));
  } else {
    query = `
      SELECT i.id, i.filename, i.original_name, i.caption, i.uploaded_at,
             u.name as uploader_name, u.id as uploader_id,
             e.department as event_department, e.title as event_title,
             e.id as event_id, e.type as event_type, e.parent_id as event_parent_id
      FROM images i
      JOIN users u ON u.id = i.uploader_id
      JOIN events e ON e.id = i.event_id
    `;
  }

  if (department) {
    if (eventId) {
      query += " AND e.department = ?";
    } else {
      query += " WHERE e.department = ?";
    }
    params.push(department);
  }

  if (random) {
    query += " ORDER BY RANDOM() LIMIT ?";
    params.push(parseInt(random));
  } else {
    query += " ORDER BY i.uploaded_at DESC";
  }

  const images = db.prepare(query).all(...params);
  return NextResponse.json({ images });
}
