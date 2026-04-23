import crypto from 'crypto';

const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-this-auth-secret';

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedPasswordHash) {
  const [salt, storedHash] = storedPasswordHash.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const storedBuffer = Buffer.from(storedHash, 'hex');

  return (
    storedBuffer.length === derivedKey.length &&
    crypto.timingSafeEqual(storedBuffer, derivedKey)
  );
}

export function createUserToken(user) {
  const payload = {
    sub: user._id.toString(),
    name: user.name,
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = encode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyUserToken(token) {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new Error('Invalid token.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const providedSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error('Invalid token.');
  }

  const payload = JSON.parse(decode(encodedPayload));

  if (!payload?.sub || !payload?.email || !payload?.name || payload.exp <= Date.now()) {
    throw new Error('Token expired or malformed.');
  }

  return payload;
}

export function serializeUser(user) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
