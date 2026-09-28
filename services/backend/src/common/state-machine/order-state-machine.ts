import { OrderStatus, VALID_ORDER_TRANSITIONS, isValidOrderTransition, IOrderAuditLog } from '@deliverapp/types';

export class InvalidOrderTransitionException extends Error {
  constructor(public currentStatus: OrderStatus, public attemptedStatus: OrderStatus) {
    super(`Cannot transition order from status '${currentStatus}' to '${attemptedStatus}'. Allowed: [${(VALID_ORDER_TRANSITIONS[currentStatus] || []).join(', ')}]`);
    this.name = 'InvalidOrderTransitionException';
  }
}

export class OrderStateMachine {
  /**
   * Validates and executes an order state transition.
   * Throws InvalidOrderTransitionException if the transition is illegal.
   */
  static transition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    orderId: string,
    changedBy: string,
    reason?: string,
    metadata?: Record<string, any>
  ): { status: OrderStatus; auditLog: IOrderAuditLog } {
    if (!isValidOrderTransition(currentStatus, newStatus)) {
      throw new InvalidOrderTransitionException(currentStatus, newStatus);
    }

    const auditLog: IOrderAuditLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 10),
      orderId,
      previousStatus: currentStatus,
      newStatus,
      changedBy,
      reason,
      metadata,
      timestamp: new Date().toISOString()
    };

    return {
      status: newStatus,
      auditLog
    };
  }
}
