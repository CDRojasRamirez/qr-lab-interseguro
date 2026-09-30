import { readFileSync } from 'node:fs';
import { z } from 'zod';

const DEFAULT_ORIGINS = 'http://localhost:4200,http://localhost:8080';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DIAGONAL_EPSILON: z.coerce.number().positive().default(1e-10),
  JWT_PUBLIC_KEY: z.string().min(1).optional(),
  JWT_PUBLIC_KEY_PATH: z.string().min(1).optional(),
  JWT_ISSUER: z.string().min(1).default('qr-go-api'),
  JWT_AUDIENCE: z.string().min(1).default('qr-challenge'),
  ALLOWED_ORIGINS: z
    .string()
    .default(DEFAULT_ORIGINS)
    .transform((v) => v.split(',').map((o) => o.trim()).filter((o) => o !== '')),
  BODY_LIMIT: z.string().min(1).default('512kb'),
});

/** Validated configuration; the public key is always resolved to a PEM string. */
export type Env = Omit<z.infer<typeof schema>, 'JWT_PUBLIC_KEY' | 'JWT_PUBLIC_KEY_PATH'> & {
  JWT_PUBLIC_KEY: string;
};

/**
 * Parses and validates environment variables, applying defaults.
 * The key comes from JWT_PUBLIC_KEY (inline, literal `\n` accepted) or JWT_PUBLIC_KEY_PATH.
 * @param readFile file reader, injectable for tests.
 */
export function loadEnv(
  source: NodeJS.ProcessEnv = process.env,
  readFile: (path: string) => string = (p) => readFileSync(p, 'utf8'),
): Env {
  const { JWT_PUBLIC_KEY, JWT_PUBLIC_KEY_PATH, ...rest } = schema.parse(source);
  const pem = JWT_PUBLIC_KEY?.replaceAll('\n', '\n') ?? (JWT_PUBLIC_KEY_PATH && readFile(JWT_PUBLIC_KEY_PATH));
  if (!pem) throw new Error('Either JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH is required');
  return { ...rest, JWT_PUBLIC_KEY: pem };
}
