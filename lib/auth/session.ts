import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "leader_score_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  exp: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET || "local-dev-session-secret-change-me";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(
  user: Pick<SessionPayload, "userId" | "username" | "name" | "role">,
) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload.userId || !payload.username || !payload.role || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: session.userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      username: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      leader: {
        select: {
          id: true,
          realName: true,
          status: true,
        },
      },
    },
  });
}

export function createLoginSession(
  response: NextResponse,
  user: Pick<SessionPayload, "userId" | "username" | "name" | "role">,
) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearLoginSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export function getHomePathForRole(role: UserRole) {
  return role === "LEADER" ? "/leader/dashboard" : "/admin/dashboard";
}
