import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export type UserRole = 'free' | 'pro' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET precisa ter pelo menos 32 caracteres em produção'
    );
  }

  return crypto.randomBytes(64).toString('hex');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;

  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const keyBuffer = Buffer.from(key, 'hex');

  return (
    hashBuffer.length === keyBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, keyBuffer)
  );
}

export function signToken(payload: {
  id: string;
  email: string;
  name: string;
  role?: string;
}): string {
  const finalPayload = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role || 'free',
  };
  return jwt.sign(finalPayload, getJwtSecret(), { expiresIn: '7d' });
}

function normalizeRole(role: unknown): UserRole {
  return role === 'pro' || role === 'admin' ? role : 'free';
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }
    const payload = decoded as Partial<
      Record<'id' | 'email' | 'name' | 'role', unknown>
    >;
    if (
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string'
    ) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: normalizeRole(payload.role),
    };
  } catch {
    return null;
  }
}
