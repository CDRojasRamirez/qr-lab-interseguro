import { beforeAll, describe, expect, it } from 'vitest';
import { JoseTokenVerifier } from '../../../src/shared/auth/jose-token-verifier.js';
import { AUDIENCE, ISSUER, makeKeys, signToken, type TestKeys } from '../../helpers/tokens.js';

let keys: TestKeys;
let other: TestKeys;
let verifier: JoseTokenVerifier;

beforeAll(async () => {
  [keys, other] = await Promise.all([makeKeys(), makeKeys()]);
  verifier = await JoseTokenVerifier.create({
    publicKeyPem: keys.publicKeyPem,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
});

describe('JoseTokenVerifier', () => {
  it('accepts a valid token and returns the subject', async () => {
    const token = await signToken({ key: keys.privateKey, subject: 'alice' });
    await expect(verifier.verify(token)).resolves.toEqual({ subject: 'alice' });
  });

  it('rejects an expired token', async () => {
    const token = await signToken({ key: keys.privateKey, expiresIn: Math.floor(Date.now() / 1000) - 60 });
    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it('rejects a wrong issuer', async () => {
    const token = await signToken({ key: keys.privateKey, issuer: 'evil' });
    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it('rejects a wrong audience', async () => {
    const token = await signToken({ key: keys.privateKey, audience: 'other' });
    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it('rejects an HS256 token (algorithm confusion)', async () => {
    const secret = new TextEncoder().encode('x'.repeat(64));
    const token = await signToken({ key: secret, alg: 'HS256' });
    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it('rejects a token signed by another key', async () => {
    const token = await signToken({ key: other.privateKey });
    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it('rejects garbage', async () => {
    await expect(verifier.verify('not.a.jwt')).rejects.toThrow();
  });

  it('fails fast at startup on an invalid public key', async () => {
    await expect(
      JoseTokenVerifier.create({ publicKeyPem: 'nope', issuer: ISSUER, audience: AUDIENCE }),
    ).rejects.toThrow();
  });
});
