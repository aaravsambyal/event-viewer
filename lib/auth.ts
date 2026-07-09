import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

function getSecret(): Uint8Array {
  if (process.env.JWT_SECRET) {
    return new TextEncoder().encode(process.env.JWT_SECRET);
  }
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const key = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  console.warn("[AUTH] No JWT_SECRET set. Using ephemeral random key. Set JWT_SECRET in .env for production.");
  return new TextEncoder().encode(key);
}

const SECRET = getSecret();

const COOKIE_NAME = "gov_portal_token";

export interface JWTPayload {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  department?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
