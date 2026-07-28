import { AuditLogEntry, UserRole } from '../../data/mockData';
import { EventBus } from '../EventBus';

export interface EnrichedAuditPayload {
  action: AuditLogEntry['action'];
  module: AuditLogEntry['module'];
  description: string;
  userId?: string;
  userName?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditServiceEnriched {
  /**
   * Log an enriched audit trail event with before/after JSON diffs & execution metrics
   */
  static logEnriched(payload: EnrichedAuditPayload): AuditLogEntry {
    const detailsObj = {
      before: payload.before || null,
      after: payload.after || null,
      durationMs: payload.durationMs || 0,
      ipAddress: payload.ipAddress || 'Client Side',
      userAgent: payload.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'Node.js')
    };

    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: payload.userId || 'usr-1',
      userName: payload.userName || 'Dr. Elif Arslan',
      action: payload.action,
      module: payload.module,
      description: payload.description,
      details: JSON.stringify(detailsObj)
    };

    EventBus.publish({
      type: 'AUDIT_LOGGED',
      payload: entry,
      timestamp: entry.timestamp
    });

    return entry;
  }

  /**
   * Role-Based Authorization Guard for Service Layer
   */
  static checkPermission(userRoles: UserRole[], requiredRole: UserRole): void {
    const isAuthorized = userRoles.includes('Firma Yöneticisi') || userRoles.includes(requiredRole);
    if (!isAuthorized) {
      throw new Error(`[Security Permission Error] Bu işlemi gerçekleştirmek için '${requiredRole}' yetkisi gereklidir.`);
    }
  }
}
