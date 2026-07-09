import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const departments = db
    .prepare("SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ORDER BY department ASC")
    .all() as { department: string }[];

  return NextResponse.json({ departments: departments.map(d => d.department) });
}
