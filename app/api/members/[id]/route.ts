import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// DELETE: Remove a member (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const memberId = parseInt(id);

  if (isNaN(memberId)) {
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  }

  const db = await getDb();
  const member = db
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .get(memberId) as any;

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role !== "member") {
    return NextResponse.json({ error: "User is not a member" }, { status: 400 });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(memberId);

  return NextResponse.json({ success: true });
}
