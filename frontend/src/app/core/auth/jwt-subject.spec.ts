import { jwtSubject } from './jwt-subject';

const encode = (payload: object) =>
  btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = (payload: object) => `header.${encode(payload)}.signature`;

describe('jwtSubject', () => {
  it('returns the sub claim', () => {
    expect(jwtSubject(token({ sub: 'maria', exp: 1 }))).toBe('maria');
  });

  it('returns null without a token', () => {
    expect(jwtSubject(null)).toBeNull();
  });

  it('returns null for malformed tokens or a missing sub', () => {
    expect(jwtSubject('not-a-jwt')).toBeNull();
    expect(jwtSubject('a.%%%.c')).toBeNull();
    expect(jwtSubject(token({ name: 'x' }))).toBeNull();
  });
});
