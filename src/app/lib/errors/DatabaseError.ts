/**
 * Custom Error Hierarchy for Database Access Layer (DAL)
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}
