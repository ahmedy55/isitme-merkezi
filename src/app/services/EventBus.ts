export type DomainEventType = 
  | 'SALE_COMPLETED' 
  | 'PURCHASE_COMPLETED' 
  | 'SERVICE_COMPLETED' 
  | 'SGK_APPROVED' 
  | 'EXPENSE_CREATED' 
  | 'CRITICAL_STOCK_ALERT'
  | 'AUDIT_LOGGED';

export interface DomainEvent<T = any> {
  type: DomainEventType;
  payload: T;
  timestamp: string;
  triggeredByUserId?: string;
  organizationId?: string;
  branchId?: string;
}

type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBusService {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();

  /**
   * Subscribe to a specific domain event
   */
  on<T = any>(type: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const set = this.handlers.get(type)!;
    set.add(handler);

    // Return unsubscribe function
    return () => {
      set.delete(handler);
    };
  }

  /**
   * Publish a domain event to all registered listeners asynchronously
   */
  async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    // Event payloads can contain patient, device, or financial data. Never log them.
    const set = this.handlers.get(event.type);
    if (!set || set.size === 0) return;

    for (const handler of Array.from(set)) {
      try {
        await handler(event);
      } catch {
        console.error(`[EventBus Error] Exception handling event ${event.type}`);
      }
    }
  }
}

export const EventBus = new EventBusService();
