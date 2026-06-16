import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const CORS_ALLOWED_HEADERS = [
  'Accept',
  'Authorization',
  'Content-Type',
  'Origin',
  'X-Requested-With',
  'X-App-Id',
  'X-Application-Id',
  'X-Application-Token',
  'x-app-id',
  'x-application-id',
  'x-application-token',
];

export type CorsConfiguration = {
  options: CorsOptions;
  missingInProduction: boolean;
};

export function buildCorsConfiguration(env: NodeJS.ProcessEnv): CorsConfiguration {
  const configuredOrigins = (env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set(configuredOrigins);
  const appEnv = (env.APP_ENV || env.NODE_ENV || 'development').toLowerCase();
  const isProduction = appEnv === 'production';
  const allowAnyOrigin = allowedOrigins.size === 0 && !isProduction;

  return {
    missingInProduction: allowedOrigins.size === 0 && isProduction,
    options: {
      origin: (origin, callback) => {
        const allowed = !origin || allowAnyOrigin || allowedOrigins.has(origin);
        callback(null, allowed);
      },
      credentials: true,
      methods: CORS_METHODS,
      allowedHeaders: CORS_ALLOWED_HEADERS,
      optionsSuccessStatus: 204,
    },
  };
}
