import { createApp } from './app.js';
import { ComputeStatisticsUseCase } from './analytics/application/index.js';
import { DiagonalPolicy, StatisticsCalculator } from './analytics/domain/index.js';
import { JoseTokenVerifier } from './shared/auth/jose-token-verifier.js';
import { loadEnv } from './shared/config/env.js';
import { createLogger } from './shared/logger/logger.js';

// Composition root: wire dependencies and start the server.
const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);

async function main(): Promise<void> {
  const policy = DiagonalPolicy.create(env.DIAGONAL_EPSILON);
  const computeStatistics = new ComputeStatisticsUseCase(new StatisticsCalculator(policy));
  const tokenVerifier = await JoseTokenVerifier.create({
    publicKeyPem: env.JWT_PUBLIC_KEY,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  const app = createApp({
    logger,
    computeStatistics,
    tokenVerifier,
    allowedOrigins: env.ALLOWED_ORIGINS,
    bodyLimit: env.BODY_LIMIT,
  });

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'server started');
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
