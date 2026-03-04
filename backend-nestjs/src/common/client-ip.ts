import type { Request } from 'express';

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0]?.trim() || request.ip || 'unknown';
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.split(',')[0]?.trim() || request.ip || 'unknown';
  }
  return request.ip || request.socket.remoteAddress || 'unknown';
}
