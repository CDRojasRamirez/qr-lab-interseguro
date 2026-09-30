import { SignJWT, exportSPKI, generateKeyPair, type CryptoKey } from 'jose';

export const ISSUER = 'test-issuer';
export const AUDIENCE = 'test-audience';

export interface TestKeys {
  publicKeyPem: string;
  privateKey: CryptoKey;
}

/** Generates an RS256 key pair (public key as SPKI PEM). */
export async function makeKeys(): Promise<TestKeys> {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  return { publicKeyPem: await exportSPKI(publicKey), privateKey };
}

export interface SignOptions {
  key: CryptoKey | Uint8Array;
  alg?: string;
  issuer?: string;
  audience?: string;
  subject?: string;
  expiresIn?: string | number;
}

/** Signs a JWT with sensible defaults; every claim can be overridden. */
export function signToken(o: SignOptions): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: o.alg ?? 'RS256' })
    .setIssuer(o.issuer ?? ISSUER)
    .setAudience(o.audience ?? AUDIENCE)
    .setSubject(o.subject ?? 'admin')
    .setIssuedAt()
    .setExpirationTime(o.expiresIn ?? '5m')
    .sign(o.key);
}
