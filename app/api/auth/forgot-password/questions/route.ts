import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = await getDb();
    const user = db
      .prepare("SELECT id, name, security_question FROM users WHERE email = ?")
      .get(email) as { id: number; name: string; security_question: string | null } | undefined;

    if (!user || !user.security_question) {
      return NextResponse.json(
        { error: "No account found with that email or security question not set" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      question: user.security_question,
      name: user.name,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
