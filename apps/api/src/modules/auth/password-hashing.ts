import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export const ARGON2ID_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
};

export function isLegacyBcryptHash(passwordHash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2ID_OPTIONS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<{
  valid: boolean;
  needsRehash: boolean;
}> {
  if (isLegacyBcryptHash(passwordHash)) {
    return { valid: await bcrypt.compare(password, passwordHash), needsRehash: true };
  }

  return {
    valid: await argon2.verify(passwordHash, password),
    needsRehash: argon2.needsRehash(passwordHash, ARGON2ID_OPTIONS),
  };
}
