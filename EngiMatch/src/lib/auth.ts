// ══════════════════════════════════════════════════════════════════
// EngiMatch Auth Utilities v2.0
// PBKDF2 password hashing + HMAC-SHA256 JWT (Web Crypto API)
// No external dependencies required
// ══════════════════════════════════════════════════════════════════

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32; // bytes
const JWT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Helpers ───────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.PASSWORD_SALT;
  if (!secret) {
    throw new Error(
      "JWT_SECRET (or PASSWORD_SALT) environment variable must be set"
    );
  }
  return new TextEncoder().encode(secret);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Fallback SHA-256 for migrating old password hashes
async function sha256Fallback(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = process.env.PASSWORD_SALT || "engimatch-salt";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── PBKDF2 Password Hashing ───────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    PBKDF2_KEYLEN * 8
  );
  const saltB64 = Buffer.from(salt).toString("base64url");
  const hashB64 = Buffer.from(hash).toString("base64url");
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split("$");
  // New PBKDF2 format
  if (parts.length === 4 && parts[0] === "pbkdf2") {
    const iterations = parseInt(parts[1], 10);
    const salt = Buffer.from(parts[2], "base64url");
    const expectedHash = parts[3];
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      PBKDF2_KEYLEN * 8
    );
    const actualHash = Buffer.from(hash).toString("base64url");
    return timingSafeEqual(expectedHash, actualHash);
  }
  // Fallback: old SHA-256 hash (auto-migrate on next login)
  const oldHash = await sha256Fallback(password);
  return timingSafeEqual(oldHash, storedHash);
}

// ─── HMAC-SHA256 JWT ───────────────────────────────────────────────

interface JWTPayload {
  sub: string; // userId
  iat: number;
  exp: number;
}

export async function generateToken(userId: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: userId,
    iat: now,
    exp: now + Math.floor(JWT_EXPIRY_MS / 1000),
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const message = `${headerB64}.${payloadB64}`;

  const secret = getSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(new TextEncoder().encode(message))
  );
  const sigB64 = Buffer.from(signature).toString("base64url");

  return `${message}.${sigB64}`;
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const secret = getSecret();
    const key = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Buffer.from(sigB64, "base64url");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(signature),
      toArrayBuffer(new TextEncoder().encode(message))
    );
    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    );
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: payload.sub };
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ────────────────────────────────────────────────

export function setAuthCookie(token: string): {
  name: string;
  value: string;
  options: object;
} {
  const secure =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL === "1";

  return {
    name: "engimatch_token",
    value: token,
    options: {
      httpOnly: true,
      secure,
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    },
  };
}

export function clearAuthCookie(): {
  name: string;
  value: string;
  options: object;
} {
  const secure =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL === "1";

  return {
    name: "engimatch_token",
    value: "",
    options: {
      httpOnly: true,
      secure,
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
    },
  };
}
