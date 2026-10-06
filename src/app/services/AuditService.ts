import { supabase } from '../lib/supabase';
import { dbInsertAuditLog } from '../lib/database';
import { logger } from '../lib/logger';

export interface AuditLogPayload {
  organizationId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  userName?: string | null;
  action: string;
  module?: string;
  description?: string;
  entity?: string;
  entityId?: string | null;
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an event to system audit log
   */
  static async log(payload: AuditLogPayload): Promise<void> {
    const details = payload.details ? JSON.stringify(payload.details) : undefined;
    const description = payload.description || (payload.entity ? `${payload.entity}: ${payload.action}` : payload.action);
    const module = payload.module || (payload.entity === 'branch' ? 'Şubeler' : 'Sistem');

    try {
      await dbInsertAuditLog({
        action: payload.action,
        module,
        description,
        details,
        userName: payload.userName
      });
    } catch (err: any) {
      logger.warn(`Audit log kaydı oluşturulamadı: ${err?.message || err}`, 'AuditService');
    }
  }

  /**
   * Dedicated helper for logging branch switches
   */
  static async logBranchChange(
    userId: string | null | undefined,
    organizationId: string | null | undefined,
    fromBranch: string,
    toBranch: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: 'Şube Değişikliği',
      module: 'Şubeler',
      description: `Kullanıcı şube filtresini değiştirdi: ${fromBranch} -> ${toBranch}`,
      details: { fromBranch, toBranch }
    });
  }
}

