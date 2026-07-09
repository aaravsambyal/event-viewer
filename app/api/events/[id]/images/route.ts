import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// GET: List images for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id);
  if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = await getDb();
  const images = db.prepare(
    `WITH RECURSIVE event_tree AS (
       SELECT id FROM events WHERE id = ?
       UNION
       SELECT e.id FROM events e JOIN event_tree et ON e.parent_id = et.id
     )
     SELECT i.id, i.filename, i.original_name, i.caption, i.uploaded_at,
            u.name as uploader_name, u.id as uploader_id,
            e.department as event_department, e.title as event_title, e.id as event_id
     FROM images i
     JOIN users u ON u.id = i.uploader_id
     JOIN events e ON e.id = i.event_id
     WHERE i.event_id IN (SELECT id FROM event_tree)
     ORDER BY i.uploaded_at DESC`
  ).all(eventId);

  return NextResponse.json({ images });
}

// POST: Upload image to event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const eventId = parseInt(id);
  const db = await getDb();

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId) as any;
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status === "closed") {
    return NextResponse.json({ error: "Event is closed" }, { status: 400 });
  }

  // Check upload permission: admin, event creator (member), assigned member or same department
  const canUpload =
    session.role === "admin" ||
    event.created_by === session.id ||
    (session.role === "member" &&
      !!db.prepare("SELECT 1 FROM event_members WHERE event_id = ? AND user_id = ?")
        .get(eventId, session.id)) ||
    (event.department && session.department && event.department === session.department);

  if (!canUpload) {
    return NextResponse.json({ error: "Not authorized to upload to this event" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const caption = formData.get("caption") as string;

    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, GIF or WebP" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    const result = db.prepare(
      "INSERT INTO images (event_id, uploader_id, filename, original_name, caption) VALUES (?, ?, ?, ?, ?)"
    ).run(eventId, session.id, filename, file.name, caption || null);

    return NextResponse.json({
      success: true,
      image: { id: result.lastInsertRowid, filename, caption },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
