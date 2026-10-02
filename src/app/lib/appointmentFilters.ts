export function filterAppointmentsForDay<T extends { date: string }>(appointments: T[], selectedDate: string): T[] {
  return appointments.filter(appointment => appointment.date === selectedDate);
}
