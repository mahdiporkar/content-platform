const DISALLOWED_SECRETS = new Set([
  'dev-secret',
  'secret',
  'change-me',
  'change-me-please-change-me-please',
  'jwt-secret',
]);

export function validateJwtSecret(env: NodeJS.ProcessEnv): void {
  const appEnv = (env.APP_ENV || env.NODE_ENV || 'development').toLowerCase();
  if (appEnv !== 'production') {
    return;
  }

  const secret = env.JWT_SECRET?.trim() || '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
  if (DISALLOWED_SECRETS.has(secret.toLowerCase())) {
    throw new Error('JWT_SECRET is too weak for production.');
  }
}
