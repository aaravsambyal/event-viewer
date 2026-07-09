import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = db.prepare("SELECT password FROM users WHERE id = ?").get(session.id) as { password: string } | undefined;

    if (!user || !bcrypt.compareSync(current_password, user.password)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, session.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
