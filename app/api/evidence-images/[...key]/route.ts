import { NextRequest, NextResponse } from "next/server";
import { isAdminRole, isAuthError, requireAuth } from "@/lib/auth/permissions";
import {
  isCosStorageConfigError,
  readEvidenceImageFromCos,
} from "@/lib/storage/cos";

export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type RouteContext = {
  params: Promise<{ key: string[] }>;
};

type EvidenceUser = Awaited<ReturnType<typeof requireAuth>>;

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth({
      mode: "throw",
      targetPath: "/api/evidence-images",
    });
    const { key: segments } = await context.params;
    const key = normalizeRouteKey(segments || []);

    if (!key) {
      return NextResponse.json({ message: "图片路径不合法" }, { status: 400 });
    }

    if (!canReadEvidenceImage(user, key)) {
      return NextResponse.json({ message: "无权访问图片" }, { status: 403 });
    }

    const object = await readEvidenceImageFromCos(key);
    const contentType = normalizeImageContentType(object.contentType, key);

    if (!contentType) {
      return NextResponse.json({ message: "不支持的图片类型" }, { status: 415 });
    }

    return new NextResponse(new Uint8Array(object.body), {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(object.body.length),
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (isCosNotFoundError(error)) {
      return NextResponse.json({ message: "图片不存在" }, { status: 404 });
    }

    if (isCosStorageConfigError(error)) {
      console.error(error);
      return NextResponse.json({ message: "图片读取配置缺失" }, { status: 500 });
    }

    console.error(error);
    return NextResponse.json({ message: "图片读取失败" }, { status: 500 });
  }
}

function canReadEvidenceImage(user: EvidenceUser, key: string) {
  if (key.startsWith("score-adjustments/")) {
    return isAdminRole(user.role);
  }

  if (!key.startsWith("score-applications/")) {
    return false;
  }

  if (isAdminRole(user.role)) {
    return true;
  }

  if (user.role !== "LEADER" || !user.leader?.id) {
    return false;
  }

  return key.startsWith(`score-applications/${user.leader.id}/`);
}

function normalizeRouteKey(segments: string[]) {
  if (segments.length === 0) {
    return null;
  }

  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }

  return segments.join("/");
}

function normalizeImageContentType(contentType: string | undefined, key: string) {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();

  if (normalized && ALLOWED_CONTENT_TYPES.has(normalized)) {
    return normalized;
  }

  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (key.endsWith(".png")) {
    return "image/png";
  }

  if (key.endsWith(".webp")) {
    return "image/webp";
  }

  return null;
}

function isCosNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "NoSuchKey"
  );
}
