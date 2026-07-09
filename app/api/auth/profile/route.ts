import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await request.json();
    const db = await getDb();

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), session.id);
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email.trim(), session.id);
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email.trim(), session.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
