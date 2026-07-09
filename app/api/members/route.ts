import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: List all members (admin sees all; member sees all for event assignment)
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");

  let query = `
    SELECT u.id, u.name, u.email, u.role, u.department, u.created_at,
           c.name as created_by_name, c.id as created_by_id
    FROM users u
    LEFT JOIN users c ON u.created_by = c.id
    WHERE u.role = 'member'
  `;
  const params: any[] = [];

  if (department) {
    query += ` AND u.department = ?`;
    params.push(department);
  }

  query += ` ORDER BY u.created_at DESC`;

  const members = db.prepare(query).all(...params);
  return NextResponse.json({ members });
}

// POST: Create a new member (admin only)
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, password, department, security_question, security_answer } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    const answerHash = security_question && security_answer
      ? bcrypt.hashSync(security_answer, 10)
      : null;

    const result = db
      .prepare(
        "INSERT INTO users (name, email, password, role, department, created_by, security_question, security_answer) VALUES (?, ?, ?, 'member', ?, ?, ?, ?)"
      )
      .run(name, email, hash, department || null, session.id, security_question || null, answerHash);

    return NextResponse.json({
      success: true,
      member: { id: result.lastInsertRowid, name, email, role: "member", department },
    });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
