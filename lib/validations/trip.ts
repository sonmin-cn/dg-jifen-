import type { TripLeaderRole, TripStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  TRIP_LEADER_ROLE_OPTIONS,
  TRIP_STATUS_OPTIONS,
} from "@/lib/constants/trips";

export type TripInput = {
  routeName?: unknown;
  region?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  tripDays?: unknown;
  status?: unknown;
  participantCount?: unknown;
  productManagerId?: unknown;
  isHoliday?: unknown;
};

export type TripLeaderInput = {
  leaderId?: unknown;
  role?: unknown;
  actualWorkDays?: unknown;
  isCompleted?: unknown;
};

function optionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDate(value: unknown) {
  const text = requiredString(value);
  if (!text) return null;
  const date = new Date(`${text}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

export function validateTripInput(input: TripInput) {
  const errors: Record<string, string> = {};
  const routeName = requiredString(input.routeName);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);
  const tripDays = Number(input.tripDays);
  const participantCount = parseOptionalNumber(input.participantCount);
  const statusText = requiredString(input.status) || "PLANNED";

  if (!routeName) {
    errors.routeName = "路线名称必填";
  }

  if (!startDate) {
    errors.startDate = "出发日期必填";
  }

  if (!endDate) {
    errors.endDate = "结束日期必填";
  }

  if (startDate && endDate && startDate > endDate) {
    errors.startDate = "出发日期不能晚于结束日期";
  }

  if (!Number.isFinite(tripDays) || tripDays <= 0) {
    errors.tripDays = "行程天数必须大于 0";
  }

  if (participantCount !== null && participantCount < 0) {
    errors.participantCount = "出团人数不能小于 0";
  }

  if (!TRIP_STATUS_OPTIONS.includes(statusText as TripStatus)) {
    errors.status = "请选择有效团期状态";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: {
      routeName,
      region: optionalString(input.region),
      startDate: startDate as Date,
      endDate: endDate as Date,
      tripDays,
      status: statusText as TripStatus,
      participantCount:
        participantCount === null ? null : Math.floor(participantCount),
      productManagerId: optionalString(input.productManagerId),
      isHoliday: parseBoolean(input.isHoliday),
    },
  };
}

export async function validateTripLeaderInput(
  tripId: string,
  input: TripLeaderInput,
  options?: { currentTripLeaderId?: string },
) {
  const errors: Record<string, string> = {};
  const leaderId = requiredString(input.leaderId);
  const roleText = requiredString(input.role) || "MAIN";
  const actualWorkDays = Number(input.actualWorkDays);
  const [trip, leader, existing] = await Promise.all([
    prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, tripDays: true },
    }),
    leaderId
      ? prisma.leader.findUnique({
          where: { id: leaderId },
          select: { id: true },
        })
      : null,
    leaderId
      ? prisma.tripLeader.findFirst({
          where: {
            tripId,
            leaderId,
            id: options?.currentTripLeaderId
              ? { not: options.currentTripLeaderId }
              : undefined,
          },
          select: { id: true },
        })
      : null,
  ]);

  if (!trip) {
    errors.tripId = "团期不存在";
  }

  if (!leaderId) {
    errors.leaderId = "请选择带队队长";
  } else if (!leader) {
    errors.leaderId = "队长不存在";
  }

  if (!TRIP_LEADER_ROLE_OPTIONS.includes(roleText as TripLeaderRole)) {
    errors.role = "请选择有效带队角色";
  }

  if (!Number.isFinite(actualWorkDays) || actualWorkDays <= 0) {
    errors.actualWorkDays = "实际带队天数必须大于 0";
  }

  if (trip && Number.isFinite(actualWorkDays) && actualWorkDays > trip.tripDays) {
    errors.actualWorkDays = "实际带队天数不能大于行程天数";
  }

  if (existing) {
    errors.leaderId = "同一个团期不能重复添加同一名队长";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: {
      leaderId,
      role: roleText as TripLeaderRole,
      actualWorkDays,
      isCompleted: parseBoolean(input.isCompleted),
    },
  };
}
