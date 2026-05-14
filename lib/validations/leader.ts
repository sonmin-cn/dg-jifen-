import type { LeaderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  LEADER_LEVEL_OPTIONS,
  LEADER_STATUS_OPTIONS,
} from "@/lib/constants/leaders";

export type LeaderFormInput = {
  realName?: unknown;
  nickname?: unknown;
  phone?: unknown;
  region?: unknown;
  status?: unknown;
  level?: unknown;
  joinDate?: unknown;
  recommenderLeaderId?: unknown;
  tags?: unknown;
  remark?: unknown;
};

export type ValidatedLeaderInput = {
  realName: string;
  nickname: string | null;
  phone: string;
  region: string | null;
  status: LeaderStatus;
  level: string | null;
  joinDate: Date | null;
  recommenderLeaderId: string | null;
  tags: string | null;
  remark: string | null;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalDate(value: unknown) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T00:00:00+08:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function validateLeaderInput(
  input: LeaderFormInput,
  options?: { currentLeaderId?: string },
) {
  const errors: Record<string, string> = {};
  const realName = normalizeRequiredString(input.realName);
  const phone = normalizeRequiredString(input.phone);
  const statusText = normalizeRequiredString(input.status);
  const joinDate = parseOptionalDate(input.joinDate);
  const recommenderLeaderId = normalizeOptionalString(input.recommenderLeaderId);
  const level = normalizeOptionalString(input.level);

  if (!realName) {
    errors.realName = "队长姓名必填";
  }

  if (!phone) {
    errors.phone = "手机号必填";
  }

  if (!LEADER_STATUS_OPTIONS.includes(statusText as LeaderStatus)) {
    errors.status = "请选择有效状态";
  }

  if (level && !LEADER_LEVEL_OPTIONS.includes(level)) {
    errors.level = "请选择有效等级";
  }

  if (phone) {
    const existing = await prisma.leader.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (existing && existing.id !== options?.currentLeaderId) {
      errors.phone = "手机号已存在";
    }
  }

  if (recommenderLeaderId) {
    if (recommenderLeaderId === options?.currentLeaderId) {
      errors.recommenderLeaderId = "推荐人不能是自己";
    } else {
      const recommender = await prisma.leader.findUnique({
        where: { id: recommenderLeaderId },
        select: { id: true },
      });

      if (!recommender) {
        errors.recommenderLeaderId = "推荐人不存在";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: {
      realName,
      nickname: normalizeOptionalString(input.nickname),
      phone,
      region: normalizeOptionalString(input.region),
      status: statusText as LeaderStatus,
      level,
      joinDate,
      recommenderLeaderId,
      tags: normalizeOptionalString(input.tags),
      remark: normalizeOptionalString(input.remark),
    } satisfies ValidatedLeaderInput,
  };
}
