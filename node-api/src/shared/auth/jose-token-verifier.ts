import { importSPKI, jwtVerify, type CryptoKey } from 'jose';
import type { TokenVerifier } from './token-verifier.js';

export interface JoseVerifierOptions {
  publicKeyPem: string;
  issuer: string;
  audience: string;
}

/** Adapter: verifies RS256 JWTs (signed by the Go API) with the shared public key. */
export class JoseTokenVerifier implements TokenVerifier {
  private constructor(
    private readonly key: CryptoKey,
    private readonly issuer: string,
    private readonly audience: string,
  ) {}

  /** Imports the key eagerly so a bad key fails at startup, not on first request. */
  static async create({ publicKeyPem, issuer, audience }: JoseVerifierOptions): Promise<JoseTokenVerifier> {
    const key = await importSPKI(publicKeyPem, 'RS256');
    return new JoseTokenVerifier(key, issuer, audience);
  }

  async verify(token: string): Promise<{ subject: string }> {
    const { payload } = await jwtVerify(token, this.key, {
      algorithms: ['RS256'],
      issuer: this.issuer,
      audience: this.audience,
      requiredClaims: ['exp', 'sub'],
    });
    return { subject: String(payload.sub) };
  }
}
