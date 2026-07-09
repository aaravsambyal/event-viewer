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

    const { security_question, security_answer } = await request.json();

    if (!security_question || !security_answer) {
      return NextResponse.json(
        { error: "Security question and answer are required" },
        { status: 400 }
      );
    }

    const hashedAnswer = bcrypt.hashSync(security_answer, 10);
    const db = await getDb();
    db.prepare("UPDATE users SET security_question = ?, security_answer = ? WHERE id = ?")
      .run(security_question, hashedAnswer, session.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
