/** Outbound port: verifies a bearer token and yields the authenticated subject. */
export interface TokenVerifier {
  /** @throws when the token is invalid, expired or not addressed to this service. */
  verify(token: string): Promise<{ subject: string }>;
}
