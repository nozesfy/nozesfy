const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const HASH = 'SHA-512';

function toBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as any, iterations: ITERATIONS, hash: HASH }, key, KEY_LENGTH * 8);
  return `${toBase64(salt)}:${toBase64(new Uint8Array(derived))}`;
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const [saltB64, hashB64] = hashed.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = fromBase64(saltB64);
  const expected = fromBase64(hashB64);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as any, iterations: ITERATIONS, hash: HASH }, key, KEY_LENGTH * 8);
  const actual = new Uint8Array(derived);
  if (actual.length !== expected.length) return false;
  return actual.every((b, i) => b === expected[i]);
}
