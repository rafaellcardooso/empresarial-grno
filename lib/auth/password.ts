import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const BCRYPT_ROUNDS = 12;

/** Gera hash bcrypt da senha. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Compara senha em texto com hash armazenado. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Gera token aleatório para reset de senha (hex). */
export function createResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash SHA-256 do token para persistência segura. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
