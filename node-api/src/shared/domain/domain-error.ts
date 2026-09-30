/** Shared Kernel: base class for all domain-level errors. Carries a stable machine-readable code. */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}
