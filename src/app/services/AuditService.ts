import { supabase } from '../lib/supabase';

export interface AuditLogPayload {
  organizationId?: string;
  branchId?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an event to system audit log
   */
  static async log(payload: AuditLogPayload): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      organization_id: payload.organizationId || null,
      branch_id: payload.branchId || null,
      user_id: payload.userId || 'system',
      action: payload.action,
      entity: payload.entity,
      entity_id: payload.entityId || null,
      details: payload.details ? JSON.stringify(payload.details) : null,
      ip: payload.ip || 'client-side',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side'
    };

    try {
      if (payload.organizationId) {
        await supabase.from('audit_logs').insert([logEntry]);
      } else {
        console.log('[AuditLog]', logEntry);
      }
    } catch (err) {
      console.warn('[AuditLog Exception]', err);
    }
  }

  /**
   * Dedicated helper for logging branch switches
   */
  static async logBranchChange(
    userId: string | undefined,
    organizationId: string | undefined,
    fromBranch: string,
    toBranch: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: 'CHANGE_BRANCH',
      entity: 'branch',
      details: { fromBranch, toBranch }
    });
  }
}
