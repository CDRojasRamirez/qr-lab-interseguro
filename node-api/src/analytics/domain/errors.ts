import { DomainError } from '../../shared/domain/index.js';

/** Raised when a matrix (or a set of matrices) violates domain invariants. */
export class InvalidMatrixError extends DomainError {
  readonly code = 'INVALID_MATRIX';
}

/** Raised when a domain policy is configured with invalid parameters. */
export class InvalidPolicyError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}
