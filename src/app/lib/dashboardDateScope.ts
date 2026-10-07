export type DashboardChartPeriod = 'Bu Ay' | 'Bu Hafta';

export function getDashboardChartPeriod(start: Date, end: Date): DashboardChartPeriod {
  const durationDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return durationDays > 0 && durationDays <= 7 ? 'Bu Hafta' : 'Bu Ay';
}
