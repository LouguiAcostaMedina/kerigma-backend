export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorEnvelope {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export function ok<T>(data: T, message?: string): SuccessEnvelope<T> {
  const envelope: SuccessEnvelope<T> = { success: true, data };
  if (message) {
    envelope.message = message;
  }
  return envelope;
}

export function fail(error: string, message: string, details?: unknown): ErrorEnvelope {
  const envelope: ErrorEnvelope = { success: false, error, message };
  if (details !== undefined) {
    envelope.details = details;
  }
  return envelope;
}

export interface PaginatedSuccessEnvelope<T> {
  success: true;
  data: T[];
  currentPage: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
}

export function paginated<T>(items: T[], total: number, page: number, limit: number): PaginatedSuccessEnvelope<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data: items,
    currentPage: page,
    totalPages,
    total,
    from: total > 0 ? (page - 1) * limit + 1 : 0,
    to: Math.min(page * limit, total),
  };
}
