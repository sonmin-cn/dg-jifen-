import * as XLSX from "xlsx";
import type { Prisma, TripLeaderRole, TripStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const REQUIRED_HEADERS = [
  "套餐编号",
  "路线类型",
  "路线名称",
  "套餐名称",
  "开始时间",
  "结束时间",
  "城市",
  "套餐状态",
  "目前出行旅客数",
  "最大成行人数",
  "队长安排",
  "路线负责人",
];

export type ParsedLeaderAssignment = {
  mainLeaders: string[];
  assistantLeaders: string[];
  followerLeaders: string[];
  rawText: string;
};

export type TripImportPreviewRow = {
  rowNumber: number;
  packageNo: string;
  routeType: string;
  routeName: string;
  packageName: string;
  startTime: string;
  endTime: string;
  city: string;
  packageStatus: string;
  travelerCount: string;
  maxTravelerCount: string;
  leaderAssignmentRaw: string;
  routeOwner: string;
  mainLeaders: string[];
  assistantLeaders: string[];
  followerLeaders: string[];
  otherLeaders?: string[];
  status: "可导入" | "缺少队长安排" | "缺少开始/结束时间" | "无法解析队长";
};

export type TripImportConfirmSummary = {
  createdTrips: number;
  updatedTrips: number;
  createdTripLeaders: number;
  updatedTripLeaders: number;
  skippedTripLeaders: number;
  unmatchedLeaders: number;
  failedRows: number;
};

export type TripImportConfirmDetail = {
  rowIndex: number;
  routeName?: string;
  leaderName?: string;
  action:
    | "created_trip"
    | "updated_trip"
    | "created_trip_leader"
    | "updated_trip_leader"
    | "skipped_trip_leader"
    | "unmatched_leader"
    | "failed_row";
  message: string;
};

export type TripImportConfirmInput = {
  rows?: unknown;
};

type ImportRow = Record<string, string>;

export function parseTripImportWorkbook(input: Buffer | ArrayBuffer) {
  const workbook = XLSX.read(input, {
    cellDates: false,
    raw: false,
    type: Buffer.isBuffer(input) ? "buffer" : "array",
  });

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      blankrows: false,
      defval: "",
      header: 1,
      raw: false,
    });

    if (rows.length < 2) {
      continue;
    }

    const headers = rows[1].map((cell) => normalizeCell(cell));
    const hasExpectedHeaders = REQUIRED_HEADERS.some((header) =>
      headers.includes(header),
    );

    if (!hasExpectedHeaders) {
      continue;
    }

    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new Error(`表头格式不符合预期，缺少字段：${missingHeaders.join("、")}`);
    }

    const previewRows = rows
      .slice(2)
      .map((row, index) => {
        const record: ImportRow = {};

        headers.forEach((header, headerIndex) => {
          if (header) {
            record[header] =
              header === "队长安排"
                ? normalizeMultilineCell(row[headerIndex])
                : normalizeCell(row[headerIndex]);
          }
        });

        return mapImportRowToTripDraft(record, index + 3);
      })
      .filter((row) => hasAnyPreviewValue(row));

    return {
      sheetName,
      totalRows: previewRows.length,
      rows: previewRows,
    };
  }

  throw new Error("未找到销转表工作表");
}

export function parseLeaderAssignment(rawText: string): ParsedLeaderAssignment {
  const normalized = normalizeAssignmentText(rawText);

  return {
    rawText,
    mainLeaders: extractLeadersByLabel(normalized, "主队"),
    assistantLeaders: extractLeadersByLabel(normalized, "副队"),
    followerLeaders: extractLeadersByLabel(normalized, "跟队"),
  };
}

export function mapImportRowToTripDraft(
  row: ImportRow,
  rowNumber: number,
): TripImportPreviewRow {
  const assignment = parseLeaderAssignment(row["队长安排"] || "");
  const hasLeaderAssignment = Boolean(assignment.rawText.trim());
  const hasAnyLeader =
    assignment.mainLeaders.length > 0 ||
    assignment.assistantLeaders.length > 0 ||
    assignment.followerLeaders.length > 0;
  const hasStartAndEnd = Boolean(row["开始时间"] && row["结束时间"]);
  const status: TripImportPreviewRow["status"] = !hasLeaderAssignment
    ? "缺少队长安排"
    : !hasStartAndEnd
      ? "缺少开始/结束时间"
      : !hasAnyLeader
        ? "无法解析队长"
        : "可导入";

  return {
    rowNumber,
    packageNo: row["套餐编号"] || "",
    routeType: row["路线类型"] || "",
    routeName: row["路线名称"] || "",
    packageName: row["套餐名称"] || "",
    startTime: row["开始时间"] || "",
    endTime: row["结束时间"] || "",
    city: row["城市"] || "",
    packageStatus: row["套餐状态"] || "",
    travelerCount: row["目前出行旅客数"] || "",
    maxTravelerCount: row["最大成行人数"] || "",
    leaderAssignmentRaw: assignment.rawText,
    routeOwner: row["路线负责人"] || "",
    mainLeaders: assignment.mainLeaders,
    assistantLeaders: assignment.assistantLeaders,
    followerLeaders: assignment.followerLeaders,
    status,
  };
}

export async function confirmTripImport(input: TripImportConfirmInput, operatorUserId: string) {
  if (!Array.isArray(input.rows)) {
    return { ok: false as const, status: 400, message: "导入数据格式不正确" };
  }

  const rows = input.rows.map(normalizePreviewRow).filter(Boolean) as TripImportPreviewRow[];

  if (rows.length === 0) {
    return { ok: false as const, status: 400, message: "没有可导入的数据行" };
  }

  const summary: TripImportConfirmSummary = {
    createdTrips: 0,
    updatedTrips: 0,
    createdTripLeaders: 0,
    updatedTripLeaders: 0,
    skippedTripLeaders: 0,
    unmatchedLeaders: 0,
    failedRows: 0,
  };
  const details: TripImportConfirmDetail[] = [];
  const leaders = await prisma.leader.findMany({
    select: {
      id: true,
      realName: true,
      nickname: true,
      phone: true,
      externalLeaderId: true,
    },
  });

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (row.status !== "可导入") {
          continue;
        }

        const parsed = parseImportTripDates(row);
        if (!parsed.ok) {
          summary.failedRows += 1;
          details.push({
            rowIndex: row.rowNumber,
            routeName: row.routeName,
            action: "failed_row",
            message: parsed.message,
          });
          continue;
        }

        const tripStatus = mapPackageStatus(row.packageStatus);
        const tripDays = calculateTripDays(parsed.startDate, parsed.endDate);
        const tripData = {
          routeName: row.routeName.trim(),
          region: normalizeCell(row.city) || null,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          tripDays,
          status: tripStatus,
          participantCount: parseInteger(row.travelerCount),
          productManagerId: normalizeCell(row.routeOwner) || null,
          isHoliday: false,
        };

        if (!tripData.routeName) {
          summary.failedRows += 1;
          details.push({
            rowIndex: row.rowNumber,
            routeName: row.routeName,
            action: "failed_row",
            message: "缺少路线名称，已跳过",
          });
          continue;
        }

        const existingTrip = await findExistingTrip(tx, tripData);
        const trip = existingTrip
          ? await tx.trip.update({
              where: { id: existingTrip.id },
              data: tripData,
            })
          : await tx.trip.create({ data: tripData });

        if (existingTrip) {
          summary.updatedTrips += 1;
          details.push({
            rowIndex: row.rowNumber,
            routeName: row.routeName,
            action: "updated_trip",
            message: "已更新团期",
          });
        } else {
          summary.createdTrips += 1;
          details.push({
            rowIndex: row.rowNumber,
            routeName: row.routeName,
            action: "created_trip",
            message: "已创建团期",
          });
        }

        const leaderAssignments = [
          ...row.mainLeaders.map((name) => ({ name, role: "MAIN" as const })),
          ...row.assistantLeaders.map((name) => ({ name, role: "ASSISTANT" as const })),
          ...row.followerLeaders.map((name) => ({ name, role: "OTHER" as const })),
        ];

        if (leaderAssignments.length === 0) {
          details.push({
            rowIndex: row.rowNumber,
            routeName: row.routeName,
            action: "skipped_trip_leader",
            message: "未解析到队长，已仅导入团期",
          });
          continue;
        }

        for (const assignment of leaderAssignments) {
          const matchedLeader = matchLeaderByName(assignment.name, leaders);

          if (!matchedLeader) {
            summary.unmatchedLeaders += 1;
            details.push({
              rowIndex: row.rowNumber,
              routeName: row.routeName,
              leaderName: assignment.name,
              action: "unmatched_leader",
              message: "未匹配到队长，已跳过带队记录",
            });
            continue;
          }

          const existingTripLeader = await tx.tripLeader.findFirst({
            where: { tripId: trip.id, leaderId: matchedLeader.id },
            select: { id: true, role: true, baseScoreRecordId: true },
          });

          if (existingTripLeader) {
            if (existingTripLeader.baseScoreRecordId) {
              summary.skippedTripLeaders += 1;
              details.push({
                rowIndex: row.rowNumber,
                routeName: row.routeName,
                leaderName: assignment.name,
                action: "skipped_trip_leader",
                message: "带队记录已生成基础积分，未覆盖",
              });
              continue;
            }

            if (existingTripLeader.role !== assignment.role) {
              await tx.tripLeader.update({
                where: { id: existingTripLeader.id },
                data: { role: assignment.role },
              });
              summary.updatedTripLeaders += 1;
              details.push({
                rowIndex: row.rowNumber,
                routeName: row.routeName,
                leaderName: assignment.name,
                action: "updated_trip_leader",
                message: "已更新带队角色",
              });
            } else {
              summary.skippedTripLeaders += 1;
              details.push({
                rowIndex: row.rowNumber,
                routeName: row.routeName,
                leaderName: assignment.name,
                action: "skipped_trip_leader",
                message: "带队记录已存在，已跳过",
              });
            }
            continue;
          }

          await tx.tripLeader.create({
            data: {
              tripId: trip.id,
              leaderId: matchedLeader.id,
              role: assignment.role,
              actualWorkDays: tripDays,
              isCompleted: tripStatus === "COMPLETED",
            },
          });
          summary.createdTripLeaders += 1;
          details.push({
            rowIndex: row.rowNumber,
            routeName: row.routeName,
            leaderName: assignment.name,
            action: "created_trip_leader",
            message: "已创建带队记录",
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: operatorUserId,
          action: "TRIP_IMPORT_CONFIRMED",
          targetType: "TripImport",
          targetId: "xiaozhuan",
          afterJson: JSON.stringify(summary),
        },
      });
    });

    return { ok: true as const, summary, details };
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: "TRIP_IMPORT_CONFIRM_FAILED",
        targetType: "TripImport",
        targetId: "xiaozhuan",
        afterJson: JSON.stringify({
          reason: error instanceof Error ? error.message : "unknown",
        }),
      },
    });

    throw error;
  }
}

function normalizeCell(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeMultilineCell(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function normalizeAssignmentText(rawText: string) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.includes("身份证"))
    .join("\n");
}

function extractLeadersByLabel(text: string, label: "主队" | "副队" | "跟队") {
  const regex = new RegExp(
    `${label}\\s*[:：]\\s*([\\s\\S]*?)(?=(?:主队|副队|跟队)\\s*[:：]|$)`,
    "u",
  );
  const match = text.match(regex);

  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split(/[、,，;；/\n]+/)
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => !name.includes("身份证"));
}

function hasAnyPreviewValue(row: TripImportPreviewRow) {
  return [
    row.packageNo,
    row.routeType,
    row.routeName,
    row.packageName,
    row.startTime,
    row.endTime,
    row.city,
    row.packageStatus,
    row.travelerCount,
    row.maxTravelerCount,
    row.leaderAssignmentRaw,
    row.routeOwner,
  ].some(Boolean);
}

function normalizePreviewRow(value: unknown): TripImportPreviewRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Partial<TripImportPreviewRow>;
  const followerLeaders =
    row.followerLeaders && row.followerLeaders.length > 0
      ? row.followerLeaders
      : row.otherLeaders;

  return {
    rowNumber: Number(row.rowNumber) || 0,
    packageNo: normalizeCell(row.packageNo),
    routeType: normalizeCell(row.routeType),
    routeName: normalizeCell(row.routeName),
    packageName: normalizeCell(row.packageName),
    startTime: normalizeCell(row.startTime),
    endTime: normalizeCell(row.endTime),
    city: normalizeCell(row.city),
    packageStatus: normalizeCell(row.packageStatus),
    travelerCount: normalizeCell(row.travelerCount),
    maxTravelerCount: normalizeCell(row.maxTravelerCount),
    leaderAssignmentRaw: normalizeMultilineCell(row.leaderAssignmentRaw),
    routeOwner: normalizeCell(row.routeOwner),
    mainLeaders: normalizeStringArray(row.mainLeaders),
    assistantLeaders: normalizeStringArray(row.assistantLeaders),
    followerLeaders: normalizeStringArray(followerLeaders),
    status: row.status || "无法解析队长",
  };
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => normalizeCell(item)).filter(Boolean)
    : [];
}

function parseImportTripDates(row: TripImportPreviewRow):
  | { ok: true; startDate: Date; endDate: Date }
  | { ok: false; message: string } {
  const startDate = parseImportDate(row.startTime);
  const endDate = parseImportDate(row.endTime);

  if (!startDate || !endDate) {
    return { ok: false, message: "开始时间或结束时间无法解析，已跳过" };
  }

  if (startDate > endDate) {
    return { ok: false, message: "开始时间晚于结束时间，已跳过" };
  }

  return { ok: true, startDate, endDate };
}

function parseImportDate(value: string) {
  const text = normalizeCell(value);
  if (!text) return null;

  const slashDateMatch = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (slashDateMatch) {
    const [, year, month, day] = slashDateMatch;
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+08:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const chineseDateMatch = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (chineseDateMatch) {
    const [, year, month, day] = chineseDateMatch;
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+08:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const excelSerial = Number(text);
  if (Number.isFinite(excelSerial) && excelSerial > 20000) {
    const parsed = XLSX.SSF.parse_date_code(excelSerial);
    if (parsed) {
      const date = new Date(`${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}T00:00:00+08:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateTripDays(startDate: Date, endDate: Date) {
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.max(Math.round((end - start) / 86400000) + 1, 1);
}

function mapPackageStatus(value: string): TripStatus {
  const text = normalizeCell(value);
  if (text.includes("取消")) return "CANCELLED";
  if (text.includes("完成") || text.includes("结束")) return "COMPLETED";
  return "PLANNED";
}

function parseInteger(value: string) {
  const number = Number(normalizeCell(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

async function findExistingTrip(
  tx: Prisma.TransactionClient,
  tripData: {
    routeName: string;
    region: string | null;
    startDate: Date;
    endDate: Date;
  },
) {
  return tx.trip.findFirst({
    where: {
      routeName: tripData.routeName,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      region: tripData.region,
    },
    select: { id: true },
  });
}

function matchLeaderByName(
  rawName: string,
  leaders: Array<{
    id: string;
    realName: string;
    nickname: string | null;
    phone: string;
    externalLeaderId: string | null;
  }>,
) {
  const candidates = buildLeaderNameCandidates(rawName);
  const matches = leaders.filter((leader) => {
    const leaderTokens = [
      leader.externalLeaderId,
      leader.realName,
      leader.nickname,
      leader.phone,
      normalizePersonName(`${leader.realName}${leader.nickname ? `（${leader.nickname}）` : ""}`),
    ]
      .filter(Boolean)
      .map((value) => normalizePersonName(value as string));

    return candidates.some((candidate) => leaderTokens.includes(candidate));
  });

  return matches.length === 1 ? matches[0] : null;
}

function buildLeaderNameCandidates(rawName: string) {
  const text = normalizePersonName(rawName);
  const candidates = new Set<string>([text]);
  const match = text.match(/^(.+?)[(（](.+?)[)）]$/);
  if (match) {
    candidates.add(normalizePersonName(match[1]));
    candidates.add(normalizePersonName(match[2]));
  }

  return Array.from(candidates).filter(Boolean);
}

function normalizePersonName(value: string) {
  return value.replace(/\s+/g, "").trim();
}
