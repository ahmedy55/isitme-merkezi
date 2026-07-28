import { Patient, RecallItem, RECALL_POLICIES } from '../data/mockData';
import { EventBus } from './EventBus';

export interface ApprovePrescriptionPayload {
  patientId: string;
  prescriptionNo: string;
  reportNo: string;
  policyKey?: 'SGK' | 'PRIVATE_INSURANCE' | 'TRIAL';
  branchId?: string;
  organizationId?: string;
  performedByUserId?: string;
}

export class SGKDomainService {
  /**
   * Approve SGK Prescription and configure 5-Year Recall Policy dynamically
   */
  static async approvePrescription(
    currentPatients: Patient[],
    currentRecalls: RecallItem[],
    payload: ApprovePrescriptionPayload
  ): Promise<{ updatedPatients: Patient[]; updatedRecalls: RecallItem[]; newRecall: RecallItem }> {
    const policy = RECALL_POLICIES[payload.policyKey || 'SGK'] || RECALL_POLICIES.SGK;

    const patient = currentPatients.find(p => p.id === payload.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Bilinmeyen Hasta';

    // Calculate dynamic renewal date based on RecallPolicy
    const today = new Date();
    const renewalYear = today.getFullYear() + policy.durationYears;
    const renewalMonth = String(today.getMonth() + 1).padStart(2, '0');
    const renewalDay = String(today.getDate()).padStart(2, '0');
    const renewalDateStr = `${renewalYear}-${renewalMonth}-${renewalDay}`;

    // 1. Update Patient sgkRenewalDate & status
    const updatedPatients = currentPatients.map(p =>
      p.id === payload.patientId
        ? {
            ...p,
            sgkStatus: 'Aktif' as Patient['sgkStatus'],
            sgkRenewalDate: renewalDateStr,
            prescriptionNo: payload.prescriptionNo,
            reportNo: payload.reportNo
          }
        : p
    );

    // 2. Generate 5-year RecallItem
    const newRecall: RecallItem = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      patientId: payload.patientId,
      patientName,
      reason: 'SGK Yenileme',
      dueDate: renewalDateStr,
      status: 'Bekliyor',
      lastContact: null,
      estimatedRevenue: 12500,
      probability: 'Yüksek Olasılık'
    };

    const updatedRecalls = [newRecall, ...currentRecalls];

    // 3. Publish Domain Event
    await EventBus.publish({
      type: 'SGK_APPROVED',
      payload: { patientId: payload.patientId, prescriptionNo: payload.prescriptionNo, renewalDate: renewalDateStr },
      timestamp: new Date().toISOString(),
      triggeredByUserId: payload.performedByUserId,
      organizationId: payload.organizationId,
      branchId: payload.branchId
    });

    return { updatedPatients, updatedRecalls, newRecall };
  }
}
