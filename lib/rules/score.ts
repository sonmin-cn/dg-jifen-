export function calculateBaseTripPoints(actualWorkDays: number): number {
  if (!Number.isFinite(actualWorkDays) || actualWorkDays <= 0) {
    throw new Error("实际带队天数必须大于 0");
  }

  return Math.round((1 + actualWorkDays * 3) * 100) / 100;
}
