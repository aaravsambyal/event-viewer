import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// GET: List events (public sees active, authenticated sees relevant events)
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const db = await getDb();

  // Auto-close events whose closing_date has passed
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  db.prepare(
    `UPDATE events SET status = 'closed' WHERE status = 'active' AND closing_date IS NOT NULL AND closing_date != '' AND closing_date < ?`
  ).run(today);

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const parentId = searchParams.get("parentId");
  const type = searchParams.get("type");

  let events;
  if (!session) {
    // Public: see all events
    let query = `
      SELECT e.id, e.title, e.description, e.event_date, e.closing_date, e.location, e.country, e.state, e.district, e.status, e.created_at, e.type, e.parent_id,
             u.name as created_by_name, e.department as department, e.participant_count,
             COUNT(DISTINCT i.id) as image_count,
              CASE
                WHEN e.type = 'main' THEN (SELECT filename FROM images WHERE event_id IN (SELECT id FROM events WHERE id = e.id OR parent_id = e.id) ORDER BY RANDOM() LIMIT 1)
                ELSE (SELECT filename FROM images WHERE event_id = e.id ORDER BY uploaded_at DESC LIMIT 1)
              END as preview_image,
              EXISTS(SELECT 1 FROM events child WHERE child.parent_id = e.id) as has_children
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN images i ON i.event_id = e.id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];
    if (department) {
      whereClauses.push(`e.department = ?`);
      params.push(department);
    }
    if (parentId) {
      whereClauses.push(`e.parent_id = ?`);
      params.push(parentId);
    }
    if (type) {
      whereClauses.push(`e.type = ?`);
      params.push(type);
    }
    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(" AND ");
    }
    query += ` GROUP BY e.id ORDER BY e.created_at DESC`;
    events = db.prepare(query).all(...params);
  } else if (session.role === "admin") {
    // Admin sees everything
    let query = `
      SELECT e.id, e.title, e.description, e.event_date, e.closing_date, e.location, e.country, e.state, e.district, e.status, e.created_at, e.type, e.parent_id,
             u.name as created_by_name, u.id as created_by_id, e.department as department, e.participant_count,
             COUNT(DISTINCT i.id) as image_count,
             CASE
               WHEN e.type = 'main' THEN (SELECT filename FROM images WHERE event_id IN (SELECT id FROM events WHERE id = e.id OR parent_id = e.id) ORDER BY RANDOM() LIMIT 1)
               ELSE (SELECT filename FROM images WHERE event_id = e.id ORDER BY uploaded_at DESC LIMIT 1)
             END as preview_image,
             EXISTS(SELECT 1 FROM events child WHERE child.parent_id = e.id) as has_children
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN images i ON i.event_id = e.id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];
    if (department) {
      whereClauses.push(`e.department = ?`);
      params.push(department);
    }
    if (parentId) {
      whereClauses.push(`e.parent_id = ?`);
      params.push(parentId);
    }
    if (type) {
      whereClauses.push(`e.type = ?`);
      params.push(type);
    }
    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(" AND ");
    }
    query += ` GROUP BY e.id ORDER BY e.created_at DESC`;
    events = db.prepare(query).all(...params);
  } else {
    // When fetching main events for parent selection, show all main events
    if (type === 'main') {
      let query = `
      SELECT e.id, e.title, e.description, e.event_date, e.closing_date, e.location, e.country, e.state, e.district, e.status, e.created_at, e.type, e.parent_id,
             u.name as created_by_name, e.department as department, e.participant_count,
             COUNT(DISTINCT i.id) as image_count,
             CASE
               WHEN e.type = 'main' THEN (SELECT filename FROM images WHERE event_id IN (SELECT id FROM events WHERE id = e.id OR parent_id = e.id) ORDER BY RANDOM() LIMIT 1)
               ELSE (SELECT filename FROM images WHERE event_id = e.id ORDER BY uploaded_at DESC LIMIT 1)
             END as preview_image,
             EXISTS(SELECT 1 FROM events child WHERE child.parent_id = e.id) as has_children
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN images i ON i.event_id = e.id
        WHERE e.type = 'main'
      `;
      const params: any[] = [];
      if (department) {
        query += ` AND e.department = ?`;
        params.push(department);
      }
      query += ` GROUP BY e.id ORDER BY e.created_at DESC`;
      events = db.prepare(query).all(...params);
    } else if (parentId) {
      // Expanding children of an accessible parent — bypass department filter
      let query = `
        SELECT e.id, e.title, e.description, e.event_date, e.closing_date, e.location, e.country, e.state, e.district, e.status, e.created_at, e.type, e.parent_id,
               u.name as created_by_name, e.department as department, e.participant_count,
               COUNT(DISTINCT i.id) as image_count,
               CASE
                 WHEN e.type = 'main' THEN (SELECT filename FROM images WHERE event_id IN (SELECT id FROM events WHERE id = e.id OR parent_id = e.id) ORDER BY RANDOM() LIMIT 1)
                 ELSE (SELECT filename FROM images WHERE event_id = e.id ORDER BY uploaded_at DESC LIMIT 1)
               END as preview_image,
               EXISTS(SELECT 1 FROM events child WHERE child.parent_id = e.id) as has_children
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN images i ON i.event_id = e.id
        WHERE e.parent_id = ?
        GROUP BY e.id ORDER BY e.created_at DESC
      `;
      events = db.prepare(query).all(parentId);
    } else {
      // Members can upload if they are the creator, explicitly assigned, or in the same department
      let query = `
        SELECT DISTINCT e.id, e.title, e.description, e.event_date, e.closing_date, e.location, e.country, e.state, e.district, e.status, e.created_at, e.type, e.parent_id,
               u.name as created_by_name, e.department as department, e.participant_count,
               COUNT(DISTINCT i.id) as image_count,
               CASE
                 WHEN e.type = 'main' THEN (SELECT filename FROM images WHERE event_id IN (SELECT id FROM events WHERE id = e.id OR parent_id = e.id) ORDER BY RANDOM() LIMIT 1)
                 ELSE (SELECT filename FROM images WHERE event_id = e.id ORDER BY uploaded_at DESC LIMIT 1)
               END as preview_image,
               EXISTS(SELECT 1 FROM events child WHERE child.parent_id = e.id) as has_children
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN images i ON i.event_id = e.id
        LEFT JOIN event_members em ON em.event_id = e.id AND em.user_id = ?
        WHERE (e.created_by = ? OR em.user_id = ? OR (e.department IS NOT NULL AND e.department = ?))
      `;
      const params: any[] = [session.id, session.id, session.id, session.department || ''];
      if (department) {
        query += ` AND e.department = ?`;
        params.push(department);
      }
      query += ` GROUP BY e.id ORDER BY e.created_at DESC`;
      events = db.prepare(query).all(...params);
    }
  }

  return NextResponse.json({ events });
}

// POST: Create event (admin only for main/sub structure, or member for standard)
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || (session.role !== "admin" && session.role !== "member")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, description, event_date, location, country, state, district, type, parent_id, department, closing_date, participant_count } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Event title is required" }, { status: 400 });
    }
    if (!event_date) {
      return NextResponse.json({ error: "Event date is required" }, { status: 400 });
    }
    if (!country || !state || !district) {
      return NextResponse.json({ error: "Country, state, and district are required" }, { status: 400 });
    }
    if (!closing_date) {
      return NextResponse.json({ error: "Closing date is required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Default values
    const eventType = type || 'main';
    const eventParentId = parent_id || null;

    // Verify parent exists
    if (eventType === 'sub' && eventParentId) {
      const parent = db.prepare("SELECT id FROM events WHERE id = ?").get(eventParentId) as any;
      if (!parent) {
        return NextResponse.json({ error: "Parent event not found" }, { status: 400 });
      }
    }

    // For sub-events, use the provided department. For main, use the creator's or provided.
    let eventDept = department || null;
    if (!eventDept && session.role === 'member') {
      const creator = db.prepare("SELECT department FROM users WHERE id = ?").get(session.id) as any;
      eventDept = creator?.department;
    }

    const loc = location || [district, state, country].filter(Boolean).join(", ") || null;

    const result = db
      .prepare(
        `INSERT INTO events (title, description, event_date, location, country, state, district, department, type, parent_id, closing_date, participant_count, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, description || null, event_date, loc, country || null, state || null, district || null, eventDept, eventType, eventParentId, closing_date || null, participant_count != null ? parseInt(participant_count) : null, session.id);

    const event = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
