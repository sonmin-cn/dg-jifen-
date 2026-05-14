import * as XLSX from "xlsx";

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
  status: "可导入" | "缺少队长安排" | "缺少开始/结束时间" | "无法解析队长";
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
