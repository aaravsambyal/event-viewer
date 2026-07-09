import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

// PATCH: Update image caption
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const imageId = parseInt(id);
  const db = await getDb();

  const image = db.prepare(
    `SELECT i.*, e.created_by as event_creator
     FROM images i JOIN events e ON e.id = i.event_id
     WHERE i.id = ?`
  ).get(imageId) as any;

  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const canEdit =
    session.role === "admin" ||
    image.uploader_id === session.id ||
    (session.role === "member" && image.event_creator === session.id);

  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { caption } = await request.json();
  db.prepare("UPDATE images SET caption = ? WHERE id = ?").run(caption ?? "", imageId);

  return NextResponse.json({ success: true });
}

// DELETE: Delete an image (uploader, host who owns event, or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const imageId = parseInt(id);
  const db = await getDb();

  const image = db.prepare(
    `SELECT i.*, e.created_by as event_creator
     FROM images i JOIN events e ON e.id = i.event_id
     WHERE i.id = ?`
  ).get(imageId) as any;

  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  // DELETE: Delete an image (uploader, member who owns event, or admin)
  const canDelete =
    session.role === "admin" ||
    image.uploader_id === session.id ||
    (session.role === "member" && image.event_creator === session.id);

  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete file from disk
  try {
    await unlink(path.join(process.cwd(), "public", "uploads", image.filename));
  } catch {}

  db.prepare("DELETE FROM images WHERE id = ?").run(imageId);
  return NextResponse.json({ success: true });
}
