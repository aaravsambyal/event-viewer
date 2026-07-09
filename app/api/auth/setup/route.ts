import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const db = await getDb();
  const admin = db
    .prepare("SELECT id FROM users WHERE role = 'admin'")
    .get();
  return NextResponse.json({ setupRequired: !admin });
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const existingAdmin = db
      .prepare("SELECT id FROM users WHERE role = 'admin'")
      .get();
    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin account already exists" },
        { status: 409 }
      );
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)"
      )
      .run(name, email, hash, "admin", "Administration");

    const token = await signToken({
      id: result.lastInsertRowid as number,
      name,
      email,
      role: "admin",
      department: "Administration",
    });

    const response = NextResponse.json({
      success: true,
      user: { id: result.lastInsertRowid, name, email, role: "admin", department: "Administration" },
    });

    response.cookies.set("gov_portal_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
