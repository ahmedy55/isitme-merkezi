import { Patient } from '../data/mockData';
import { mapPatientRowToDomain } from '../lib/mappers/entityMappers';
import { DatabaseError } from '../lib/errors/DatabaseError';

export interface IPatientRepository {
  mapPatient(row: unknown): Patient;
  mapPatientList(rows: unknown[]): Patient[];
}

export class PatientRepository implements IPatientRepository {
  mapPatient(row: unknown): Patient {
    if (!row) throw new DatabaseError('[PatientRepository] Null row provided');
    return mapPatientRowToDomain(row);
  }

  mapPatientList(rows: unknown[]): Patient[] {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => mapPatientRowToDomain(row));
  }
}

export const patientRepository = new PatientRepository();
