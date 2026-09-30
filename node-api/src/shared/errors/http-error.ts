/** Error carrying the HTTP status and stable code to render at the edge. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
