export function getNextMaintenanceDate(
  lastMaintenance: string | null | undefined,
  intervalMonths: number | null | undefined,
): Date | null {
  if (!lastMaintenance || intervalMonths == null || !Number.isFinite(intervalMonths) || intervalMonths <= 0) return null;

  const lastDate = new Date(lastMaintenance);
  if (!Number.isFinite(lastDate.getTime())) return null;

  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  return Number.isFinite(nextDate.getTime()) ? nextDate : null;
}
