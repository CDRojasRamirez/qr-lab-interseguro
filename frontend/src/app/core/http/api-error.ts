import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: string[];
}

/** User-facing (Spanish) message per API error code. */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.',
  INVALID_MATRIX: 'La matriz no es válida.',
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  UNAUTHORIZED: 'Credenciales inválidas o sesión expirada.',
  PAYLOAD_TOO_LARGE: 'La solicitud es demasiado grande.',
  NOT_FOUND: 'No se encontró el recurso solicitado.',
  METHOD_NOT_ALLOWED: 'Operación no permitida.',
  UPSTREAM_UNAVAILABLE: 'El servicio de estadísticas no está disponible. Intenta más tarde.',
  UPSTREAM_TIMEOUT: 'El servicio de estadísticas tardó demasiado en responder.',
  UPSTREAM_REJECTED: 'El servicio de estadísticas rechazó la solicitud.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado en el servidor.',
};

const CODE_BY_STATUS: Record<number, string> = {
  401: 'UNAUTHORIZED',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  413: 'PAYLOAD_TOO_LARGE',
  502: 'UPSTREAM_UNAVAILABLE',
  504: 'UPSTREAM_TIMEOUT',
};

interface ErrorBody {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

const extractBody = (raw: unknown): ErrorBody | null => {
  const inner = (raw as { error?: unknown } | null)?.error;
  return inner && typeof inner === 'object' ? (inner as ErrorBody) : null;
};

export function toApiError(err: unknown): ApiError {
  if (!(err instanceof HttpErrorResponse)) {
    return { status: 0, code: 'INTERNAL_ERROR', message: MESSAGES['INTERNAL_ERROR'], details: [] };
  }
  if (err.status === 0) {
    return { status: 0, code: 'NETWORK_ERROR', message: MESSAGES['NETWORK_ERROR'], details: [] };
  }
  const body = extractBody(err.error);
  const code =
    typeof body?.code === 'string' ? body.code : (CODE_BY_STATUS[err.status] ?? 'INTERNAL_ERROR');
  const serverMessage = typeof body?.message === 'string' ? body.message : undefined;
  const details = Array.isArray(body?.details)
    ? body.details.filter((d): d is string => typeof d === 'string')
    : [];
  return {
    status: err.status,
    code,
    message: MESSAGES[code] ?? serverMessage ?? MESSAGES['INTERNAL_ERROR'],
    details,
  };
}
