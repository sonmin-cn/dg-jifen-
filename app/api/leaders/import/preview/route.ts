import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { LEADER_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import {
  buildLeaderImportPreview,
  parseLeaderImportWorkbook,
} from "@/lib/services/leader-import";

function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ message: "导入预览失败" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(LEADER_MANAGEMENT_ROLES, "/api/leaders/import/preview", {
      mode: "throw",
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "请上传 .xlsx 文件" }, { status: 400 });
    }

    if (!file.name.endsWith(".xlsx")) {
      return NextResponse.json({ message: "仅支持 .xlsx 文件" }, { status: 400 });
    }

    const parsed = await parseLeaderImportWorkbook(file);
    const previewRows = await buildLeaderImportPreview(parsed.rows);

    return NextResponse.json({
      sheetName: parsed.sheetName,
      totalRows: parsed.totalRows,
      rows: previewRows,
      summary: {
        createCount: previewRows.filter((row) => row.action === "CREATE").length,
        updateCount: previewRows.filter((row) => row.action === "UPDATE").length,
        errorCount: previewRows.filter((row) => row.action === "ERROR").length,
        skipCount: previewRows.filter((row) => row.action === "SKIP").length,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
