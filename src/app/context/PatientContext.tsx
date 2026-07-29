'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, initialPatients } from '../data/mockData';
import { dbInsertPatient, dbUpdatePatient, dbInsertAuditLog } from '../lib/database';
import { logger } from '../lib/logger';

interface PatientContextType {
  patientsList: Patient[];
  setPatientsList: React.Dispatch<React.SetStateAction<Patient[]>>;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  addPatient: (patient: Patient, currentOrgId: string | null, currentOrg: any, addToast: (t: any) => void) => Promise<void>;
  updatePatient: (patient: Patient, currentOrgId: string | null, addToast: (t: any) => void) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patientsList, setPatientsList] = useState<Patient[]>(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const addPatient = async (patient: Patient, currentOrgId: string | null, currentOrg: any, addToast: (t: any) => void) => {
    if (currentOrg && currentOrg.plan_type === 'trial' && patientsList.length >= 50) {
      addToast({
        type: 'warning',
        message: 'Deneme sürümü (Trial) hasta limitinize ulaştınız (Maksimum 50 hasta).'
      });
      return;
    }
    if (currentOrgId) {
      try {
        const created = await dbInsertPatient(patient);
        setPatientsList(prev => [created, ...prev]);
        addToast({ type: 'success', message: 'Hasta başarıyla eklendi.' });
        await dbInsertAuditLog({
          action: 'Hasta Ekleme',
          module: 'Hastalar',
          description: `${patient.firstName} ${patient.lastName} eklendi.`
        });
      } catch (err: any) {
        logger.error('addPatient error', err, 'PatientContext');
        addToast({ type: 'error', message: `Hasta eklenemedi: ${err.message}` });
      }
    } else {
      setPatientsList(prev => [patient, ...prev]);
    }
  };

  const updatePatient = async (updatedPatient: Patient, currentOrgId: string | null, addToast: (t: any) => void) => {
    setPatientsList(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    addToast({ type: 'success', message: 'Hasta bilgileri güncellendi.' });
    if (currentOrgId && updatedPatient.id) {
      try {
        await dbUpdatePatient(updatedPatient.id, updatedPatient);
        await dbInsertAuditLog({
          action: 'Hasta Güncelleme',
          module: 'Hastalar',
          description: `${updatedPatient.firstName} ${updatedPatient.lastName} güncellendi.`
        });
      } catch (err: any) {
        logger.warn(`dbUpdatePatient background sync error: ${err.message}`, 'PatientContext');
        addToast({ type: 'warning', message: 'Hasta verisi yerelde güncellendi ancak veritabanına eşlenemedi.' });
      }
    }
  };

  return (
    <PatientContext.Provider value={{
      patientsList,
      setPatientsList,
      selectedPatientId,
      setSelectedPatientId,
      addPatient,
      updatePatient
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatientContext() {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatientContext must be used within PatientProvider');
  return context;
}
