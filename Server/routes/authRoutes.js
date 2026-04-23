import { Router } from 'express';
import {
  createUserToken,
  hashPassword,
  serializeUser,
  verifyPassword,
} from '../lib/auth.js';
import requireAuth from '../middleware/requireAuth.js';
import User from '../models/User.js';

const router = Router();

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim()) {
      throw createError('Name is required.', 400);
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw createError('Email is required.', 400);
    }

    if (!password || password.length < 6) {
      throw createError('Password must be at least 6 characters.', 400);
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      throw createError('An account with this email already exists.', 409);
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });

    res.status(201).json({
      token: createUserToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(createError('An account with this email already exists.', 409));
      return;
    }

    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw createError('Email and password are required.', 400);
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw createError('Invalid email or password.', 401);
    }

    res.json({
      token: createUserToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

export default router;
