import { LeaderStatus, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db/prisma";

export type LeaderImportAction = "CREATE" | "UPDATE" | "ERROR" | "SKIP";

export type ParsedLeaderImportRow = {
  rowNumber: number;
  externalLeaderId: string;
  realName: string;
  nickname: string;
  phone: string;
  residentLocation: string;
  rawLeaderIdentity: string;
  rawLeaderLevel: string;
  leadCount: number | null;
  leadDays: number | null;
  auditTime: Date | null;
  frozenTime: Date | null;
  rawJobStatus: string;
  status: LeaderStatus | null;
  level: string | null;
  jobStatus: string | null;
  rowSignature: string;
};

export type LeaderImportPreviewRow = ParsedLeaderImportRow & {
  action: LeaderImportAction;
  matchResult: string;
  existingLeaderId: string | null;
  importStatus: string;
  reasons: string[];
};

const REQUIRED_HEADERS = [
  "队长id",
  "姓名",
  "手机号码",
];

const HEADER_ALIASES = {
  externalLeaderId: "队长id",
  realName: "姓名",
  nickname: "昵称",
  phone: "手机号码",
  residentLocation: "常驻地",
  rawLeaderIdentity: ["队长身份", "队长状态", "是否实习", "身份类型"],
  rawLeaderLevel: ["队长级别", "等级"],
  leadCount: "带队次数",
  leadDays: "带队天数",
  auditTime: "审核时间",
  frozenTime: "冻结时间",
  rawJobStatus: ["岗位状态", "在职状态"],
} as const;

function normalizeCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\r\n/g, "\n").trim();
}

function normalizePhone(value: unknown) {
  return normalizeCell(value).replace(/[^\d]/g, "");
}

function parseNumber(value: unknown) {
  const normalized = normalizeCell(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const normalized = normalizeCell(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized.replace(/\./g, "/").replace(/-/g, "/"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeLeaderIdentity(value: unknown) {
  const text = normalizeCell(value);
  const normalized = text.toLowerCase();

  if (
    text.includes("离职") ||
    normalized === "left" ||
    normalized.includes("resigned")
  ) {
    return { raw: text, status: LeaderStatus.LEFT };
  }
  if (
    text.includes("暂停") ||
    text.includes("停用") ||
    text.includes("冻结") ||
    normalized === "suspended" ||
    normalized.includes("disabled")
  ) {
    return { raw: text, status: LeaderStatus.SUSPENDED };
  }
  if (
    text.includes("实习") ||
    text === "是" ||
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "intern" ||
    normalized.includes("intern")
  ) {
    return { raw: text, status: LeaderStatus.INTERN };
  }
  if (
    text.includes("正式") ||
    normalized === "regular" ||
    normalized.includes("regular")
  ) {
    return { raw: text, status: LeaderStatus.REGULAR };
  }

  return { raw: text, status: null };
}

export function normalizeLeaderLevel(value: unknown) {
  const text = normalizeCell(value).replace(/\s+/g, "");
  const levels = ["流星", "彗星", "恒星", "星云", "银河"];
  const level = levels.find((item) => text.includes(item)) || null;

  return { raw: normalizeCell(value), level };
}

export function normalizeJobStatus(value: unknown) {
  const text = normalizeCell(value);
  const normalized = text.toLowerCase();
  if (text.includes("在职")) {
    return { raw: text, jobStatus: "ACTIVE", leaderStatus: null };
  }
  if (
    text.includes("冻结") ||
    text.includes("暂停") ||
    text.includes("停用") ||
    normalized === "suspended"
  ) {
    return {
      raw: text,
      jobStatus: "FROZEN",
      leaderStatus: LeaderStatus.SUSPENDED,
    };
  }
  if (text.includes("离职") || normalized === "left") {
    return { raw: text, jobStatus: "LEFT", leaderStatus: LeaderStatus.LEFT };
  }

  return { raw: text, jobStatus: null, leaderStatus: null };
}

export async function parseLeaderImportWorkbook(file: File | ArrayBuffer | Buffer) {
  const buffer =
    file instanceof File
      ? Buffer.from(await file.arrayBuffer())
      : Buffer.isBuffer(file)
        ? file
        : Buffer.from(new Uint8Array(file));
  const workbook = XLSX.read(buffer, {
    cellDates: true,
    raw: false,
  });
  const sheetName =
    workbook.SheetNames.find((name) => name.includes("队长列表")) ||
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("未找到队长列表工作表");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const headers = (rows[1] || []).map(normalizeCell);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`表头格式不符合预期，缺少：${missingHeaders.join("、")}`);
  }

  const parsedRows = rows
    .slice(2)
    .map((row, index) =>
      parseLeaderImportRow(rowToRecord(headers, row), index + 3),
    )
    .filter((row) => hasUsefulContent(row));

  return {
    sheetName,
    totalRows: parsedRows.length,
    rows: dedupeLeaderImportRows(parsedRows),
  };
}

export function parseLeaderImportRow(
  row: Record<string, unknown>,
  rowNumber = Number(row.rowNumber || 0),
): ParsedLeaderImportRow {
  const rawIdentityValue = getAliasedValue(row, HEADER_ALIASES.rawLeaderIdentity);
  const rawLevelValue = getAliasedValue(row, HEADER_ALIASES.rawLeaderLevel);
  const identity = normalizeLeaderIdentity(rawIdentityValue);
  const levelIdentity = normalizeLeaderIdentity(rawLevelValue);
  const level = normalizeLeaderLevel(rawLevelValue);
  const job = normalizeJobStatus(getAliasedValue(row, HEADER_ALIASES.rawJobStatus));
  const status = job.leaderStatus || identity.status || levelIdentity.status;
  const parsedLevel = level.level || (status === LeaderStatus.INTERN ? "流星" : null);
  const parsed = {
    rowNumber,
    externalLeaderId: normalizeCell(row[HEADER_ALIASES.externalLeaderId]),
    realName: normalizeCell(row[HEADER_ALIASES.realName]),
    nickname: normalizeCell(row[HEADER_ALIASES.nickname]),
    phone: normalizePhone(row[HEADER_ALIASES.phone]),
    residentLocation: normalizeCell(row[HEADER_ALIASES.residentLocation]),
    rawLeaderIdentity: identity.raw,
    rawLeaderLevel: level.raw,
    leadCount: parseNumber(row[HEADER_ALIASES.leadCount]),
    leadDays: parseNumber(row[HEADER_ALIASES.leadDays]),
    auditTime: parseDate(row[HEADER_ALIASES.auditTime]),
    frozenTime: parseDate(row[HEADER_ALIASES.frozenTime]),
    rawJobStatus: job.raw,
    status,
    level: parsedLevel,
    jobStatus: job.jobStatus,
  };

  return {
    ...parsed,
    rowSignature: buildRowSignature(parsed),
  };
}

function getAliasedValue(
  row: Record<string, unknown>,
  aliases: readonly string[] | string,
) {
  const candidates = Array.isArray(aliases) ? aliases : [aliases];

  for (const alias of candidates) {
    const value = row[alias];
    if (normalizeCell(value)) {
      return value;
    }
  }

  return "";
}

export function dedupeLeaderImportRows(rows: ParsedLeaderImportRow[]) {
  const keptRows: ParsedLeaderImportRow[] = [];
  const seenSignatures = new Set<string>();

  for (const row of rows) {
    if (seenSignatures.has(row.rowSignature)) {
      continue;
    }

    seenSignatures.add(row.rowSignature);
    keptRows.push(row);
  }

  return keptRows;
}

export async function buildLeaderImportPreview(rows: ParsedLeaderImportRow[]) {
  const dedupedRows = dedupeLeaderImportRows(rows);
  const externalIds = dedupedRows
    .map((row) => row.externalLeaderId)
    .filter(Boolean);
  const phones = dedupedRows.map((row) => row.phone).filter(Boolean);
  const [leadersByExternalId, leadersByPhone] = await Promise.all([
    prisma.leader.findMany({
      where: { externalLeaderId: { in: externalIds } },
      select: { id: true, externalLeaderId: true, phone: true, userId: true },
    }),
    prisma.leader.findMany({
      where: { phone: { in: phones } },
      select: { id: true, externalLeaderId: true, phone: true, userId: true },
    }),
  ]);
  const externalMap = new Map(
    leadersByExternalId
      .filter((leader) => leader.externalLeaderId)
      .map((leader) => [leader.externalLeaderId as string, leader]),
  );
  const phoneMap = new Map(leadersByPhone.map((leader) => [leader.phone, leader]));
  const conflictMap = buildConflictMap(dedupedRows);

  return dedupedRows.map<LeaderImportPreviewRow>((row) => {
    const reasons = collectRowReasons(row, conflictMap);
    const externalMatch = row.externalLeaderId
      ? externalMap.get(row.externalLeaderId) || null
      : null;
    const phoneMatch = row.phone ? phoneMap.get(row.phone) || null : null;
    const matchedLeader = externalMatch || phoneMatch;
    let action: LeaderImportAction = matchedLeader ? "UPDATE" : "CREATE";
    let matchResult = matchedLeader
      ? externalMatch
        ? "队长id匹配"
        : "手机号匹配"
      : "未匹配，准备新建";

    if (
      externalMatch &&
      externalMatch.userId &&
      row.phone &&
      externalMatch.phone !== row.phone
    ) {
      reasons.push("已绑定账号但手机号变更，需人工确认");
    }

    if (reasons.length > 0) {
      action = "ERROR";
      matchResult = matchedLeader ? matchResult : "无法导入";
    }

    return {
      ...row,
      action,
      matchResult,
      existingLeaderId: matchedLeader?.id || null,
      importStatus: reasons.length > 0 ? reasons[0] : "可导入",
      reasons,
    };
  });
}

export async function applyLeaderImportRows(
  rows: ParsedLeaderImportRow[],
  options: { userId: string },
) {
  const previewRows = await buildLeaderImportPreview(rows);
  const importableRows = previewRows.filter(
    (row) => row.action === "CREATE" || row.action === "UPDATE",
  );
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of importableRows) {
      if (row.action === "CREATE") {
        await tx.leader.create({
          data: toLeaderCreateData(row, now),
        });
        createdCount += 1;
      } else if (row.action === "UPDATE" && row.existingLeaderId) {
        await tx.leader.update({
          where: { id: row.existingLeaderId },
          data: toLeaderUpdateData(row, now),
        });
        updatedCount += 1;
      }
    }

    const summary = {
      createdCount,
      updatedCount,
      skippedCount: previewRows.filter((row) => row.action === "SKIP").length,
      errorCount: previewRows.filter((row) => row.action === "ERROR").length,
      totalRows: previewRows.length,
    };

    await tx.auditLog.create({
      data: {
        userId: options.userId,
        action: "LEADER_IMPORT_CONFIRMED",
        targetType: "LeaderImport",
        targetId: `leader-import-${now.getTime()}`,
        afterJson: JSON.stringify({ summary, rows: previewRows }),
      },
    });

    return summary;
  });
}

function rowToRecord(headers: string[], row: unknown[]) {
  return headers.reduce<Record<string, unknown>>((record, header, index) => {
    if (header) {
      record[header] = row[index];
    }

    return record;
  }, {});
}

function hasUsefulContent(row: ParsedLeaderImportRow) {
  return Boolean(row.externalLeaderId || row.realName || row.phone);
}

function buildRowSignature(row: Omit<ParsedLeaderImportRow, "rowSignature">) {
  return JSON.stringify({
    externalLeaderId: row.externalLeaderId,
    realName: row.realName,
    nickname: row.nickname,
    phone: row.phone,
    residentLocation: row.residentLocation,
    rawLeaderIdentity: row.rawLeaderIdentity,
    rawLeaderLevel: row.rawLeaderLevel,
    leadCount: row.leadCount,
    leadDays: row.leadDays,
    auditTime: formatSignatureDate(row.auditTime),
    frozenTime: formatSignatureDate(row.frozenTime),
    rawJobStatus: row.rawJobStatus,
  });
}

function formatSignatureDate(value: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buildConflictMap(rows: ParsedLeaderImportRow[]) {
  const conflicts = new Map<string, string>();
  const byExternalId = new Map<string, ParsedLeaderImportRow[]>();
  const byPhone = new Map<string, ParsedLeaderImportRow[]>();

  for (const row of rows) {
    if (row.externalLeaderId) {
      byExternalId.set(row.externalLeaderId, [
        ...(byExternalId.get(row.externalLeaderId) || []),
        row,
      ]);
    }
    if (row.phone) {
      byPhone.set(row.phone, [...(byPhone.get(row.phone) || []), row]);
    }
  }

  for (const [externalLeaderId, group] of byExternalId.entries()) {
    if (new Set(group.map((row) => row.rowSignature)).size > 1) {
      conflicts.set(`external:${externalLeaderId}`, "队长id重复冲突");
    }
  }

  for (const [phone, group] of byPhone.entries()) {
    if (new Set(group.map((row) => row.rowSignature)).size > 1) {
      conflicts.set(`phone:${phone}`, "手机号重复");
    }
  }

  return conflicts;
}

function collectRowReasons(
  row: ParsedLeaderImportRow,
  conflictMap: Map<string, string>,
) {
  const reasons: string[] = [];

  if (!row.externalLeaderId) {
    reasons.push("缺少队长id");
  }
  if (!row.realName) {
    reasons.push("缺少姓名");
  }
  if (!row.phone) {
    reasons.push("缺少手机号");
  } else if (!/^1\d{10}$/.test(row.phone)) {
    reasons.push("手机号格式异常");
  }
  if (row.externalLeaderId && conflictMap.has(`external:${row.externalLeaderId}`)) {
    reasons.push(conflictMap.get(`external:${row.externalLeaderId}`) as string);
  }
  if (row.phone && conflictMap.has(`phone:${row.phone}`)) {
    reasons.push(conflictMap.get(`phone:${row.phone}`) as string);
  }
  if (row.rawLeaderIdentity && !row.status) {
    reasons.push("无法识别队长身份");
  }
  if (row.rawLeaderLevel && !row.level) {
    reasons.push("无法识别队长级别");
  }
  if (row.rawJobStatus && !row.jobStatus) {
    reasons.push("无法识别岗位状态");
  }

  return [...new Set(reasons)];
}

function baseLeaderData(row: LeaderImportPreviewRow, now: Date) {
  return {
    externalLeaderId: row.externalLeaderId || null,
    realName: row.realName,
    nickname: row.nickname || null,
    phone: row.phone,
    residentLocation: row.residentLocation || null,
    rawLeaderIdentity: row.rawLeaderIdentity || null,
    rawLeaderLevel: row.rawLeaderLevel || null,
    rawJobStatus: row.rawJobStatus || null,
    leadCount: row.leadCount,
    leadDays: row.leadDays,
    auditTime: row.auditTime,
    frozenTime: row.frozenTime,
    jobStatus: row.jobStatus,
    lastImportedAt: now,
    sourceSystem: "IMPORT",
    ...(row.status ? { status: row.status } : {}),
    ...(row.level ? { level: row.level } : {}),
  };
}

function toLeaderCreateData(
  row: LeaderImportPreviewRow,
  now: Date,
): Prisma.LeaderCreateInput {
  return baseLeaderData(row, now);
}

function toLeaderUpdateData(
  row: LeaderImportPreviewRow,
  now: Date,
): Prisma.LeaderUpdateInput {
  return baseLeaderData(row, now);
}
