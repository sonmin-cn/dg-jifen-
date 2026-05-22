export type BaseTripScoreConfig = {
  perTripPoints?: number;
  perDayPoints?: number;
  roundActualWorkDays?: "CEIL_TO_DAY" | "NONE";
};

export function calculateBaseTripPoints(
  actualWorkDays: number,
  config: BaseTripScoreConfig = {},
): number {
  if (!Number.isFinite(actualWorkDays) || actualWorkDays <= 0) {
    throw new Error("实际带队天数必须大于 0");
  }

  const perTripPoints = normalizeConfigNumber(config.perTripPoints, 1);
  const perDayPoints = normalizeConfigNumber(config.perDayPoints, 1);
  const effectiveWorkDays =
    config.roundActualWorkDays === "CEIL_TO_DAY"
      ? Math.ceil(actualWorkDays)
      : actualWorkDays;

  return Math.round((perTripPoints + effectiveWorkDays * perDayPoints) * 100) / 100;
}

function normalizeConfigNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
