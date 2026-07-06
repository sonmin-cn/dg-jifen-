import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireRole } from "@/lib/auth/permissions";
import { SCORE_ADJUSTMENT_MANAGEMENT_ROLES } from "@/lib/auth/roles";
import {
  isCosStorageConfigError,
  uploadEvidenceImageToCos,
} from "@/lib/storage/cos";
import { getEvidenceImageProxyUrl } from "@/lib/storage/evidence-url";

export const runtime = "nodejs";

const MAX_FILE_COUNT = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: NextRequest) {
  try {
    await requireRole(
      SCORE_ADJUSTMENT_MANAGEMENT_ROLES,
      "/api/admin/score-adjustments/upload-evidence",
      { mode: "throw" },
    );

    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "请选择要上传的证明图片" },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { success: false, error: "最多上传 3 张证明图片" },
        { status: 400 },
      );
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { success: false, error: "证明图片总大小不能超过 15MB" },
        { status: 400 },
      );
    }

    const images = [];

    for (const file of files) {
      const originalName = file.name.toLowerCase();

      if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        originalName.endsWith(".heic") ||
        originalName.endsWith(".heif")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "暂不支持 HEIC 图片，请在相册中转换为 JPG/PNG 后上传，或截图后上传。",
          },
          { status: 400 },
        );
      }

      const extension = ALLOWED_TYPES.get(file.type);
      if (!extension) {
        return NextResponse.json(
          { success: false, error: "仅支持 JPG、PNG、WEBP 图片" },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "单张证明图片不能超过 5MB" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadEvidenceImageToCos({
        folder: "score-adjustments",
        extension,
        body: buffer,
        contentType: file.type,
      });

      images.push({
        url: uploaded.url,
        displayUrl: getEvidenceImageProxyUrl(uploaded.url, "score-adjustments"),
        filename: uploaded.filename,
        mimeType: file.type,
        size: file.size,
      });
    }

    return NextResponse.json({ success: true, images });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    if (isCosStorageConfigError(error)) {
      console.error(error);
      return NextResponse.json(
        { success: false, error: "图片上传配置缺失，请联系管理员" },
        { status: 500 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, error: "图片上传失败，请稍后重试" },
      { status: 500 },
    );
  }
}
