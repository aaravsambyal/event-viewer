import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, answer, newPassword } = await request.json();

    if (!email || !answer || !newPassword) {
      return NextResponse.json(
        { error: "Email, answer, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = db
      .prepare("SELECT id, security_question, security_answer FROM users WHERE email = ?")
      .get(email) as { id: number; security_question: string | null; security_answer: string | null } | undefined;

    if (!user || !user.security_answer) {
      return NextResponse.json(
        { error: "No account found or security question not set" },
        { status: 404 }
      );
    }

    const answerMatch = await bcrypt.compare(answer, user.security_answer);
    if (!answerMatch) {
      return NextResponse.json(
        { error: "Incorrect answer" },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);

    return NextResponse.json({ message: "Password reset successfully" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
