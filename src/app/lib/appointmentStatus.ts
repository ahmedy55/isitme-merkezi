import type { Appointment } from '../data/mockData';
import type { BranchMode } from '../services/BranchService';
import { BranchService } from '../services/BranchService';

const OPEN_APPOINTMENT_STATUSES: Appointment['status'][] = ['Bekliyor', 'Hatırlatıldı'];
const CLOSED_APPOINTMENT_STATUSES: Appointment['status'][] = ['Geldi', 'Gelmedi', 'İptal'];

export function isOpenAppointment(status: Appointment['status']): boolean {
  return OPEN_APPOINTMENT_STATUSES.includes(status);
}

export function isClosedAppointment(status: Appointment['status']): boolean {
  return CLOSED_APPOINTMENT_STATUSES.includes(status);
}

export function countOpenAppointments(
  appointments: Appointment[],
  activeBranch: BranchMode,
): number {
  return appointments.filter(appointment =>
    isOpenAppointment(appointment.status) &&
    BranchService.matchesBranch(appointment.branch, appointment.branchId, activeBranch)
  ).length;
}
