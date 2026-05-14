import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { TRIP_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import { parseTripImportWorkbook } from "@/lib/services/trip-import";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "解析失败";
  return NextResponse.json({ message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(
      TRIP_MANAGEMENT_ROLES,
      "/api/trips/import/preview",
      { mode: "throw" },
    );

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "请上传 .xlsx 文件" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { message: "仅支持 .xlsx 文件" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "文件不能超过 10MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = parseTripImportWorkbook(buffer);

    return NextResponse.json({ preview });
  } catch (error) {
    return errorResponse(error);
  }
}
