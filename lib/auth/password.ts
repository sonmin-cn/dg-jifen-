import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const HASH_ALGORITHM = "pbkdf2_sha512";
const DEFAULT_ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    DEFAULT_ITERATIONS,
    KEY_LENGTH,
    DIGEST,
  ).toString("hex");

  return `${HASH_ALGORITHM}$${DEFAULT_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string,
): boolean {
  const [algorithm, iterationsText, salt, originalHash] = storedHash.split("$");
  const iterations = Number(iterationsText);

  if (
    algorithm !== HASH_ALGORITHM ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !salt ||
    !originalHash
  ) {
    return false;
  }

  const calculatedHash = pbkdf2Sync(
    password,
    salt,
    iterations,
    KEY_LENGTH,
    DIGEST,
  ).toString("hex");

  const original = Buffer.from(originalHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");

  return (
    original.length === calculated.length && timingSafeEqual(original, calculated)
  );
}
