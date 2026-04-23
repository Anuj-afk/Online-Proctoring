import { verifyUserToken } from '../lib/auth.js';

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export default function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw createError('Authentication is required.', 401);
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = verifyUserToken(token);

    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    next();
  } catch (_error) {
    next(createError('Authentication is required.', 401));
  }
}
