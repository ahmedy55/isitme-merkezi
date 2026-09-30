/** Parse the DATE + TIME values returned by Postgres (TIME commonly includes seconds). */
export function parseAppointmentDateTime(dateValue: unknown, timeValue: unknown): Date | null {
  const datePart = String(dateValue ?? '').slice(0, 10);
  const timeMatch = String(timeValue ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || !timeMatch) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;

  const date = new Date(`${datePart}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  if (Number.isNaN(date.getTime())) return null;

  // Reject impossible calendar dates instead of allowing JS to roll them over.
  const [year, month, day] = datePart.split('-').map(Number);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}
