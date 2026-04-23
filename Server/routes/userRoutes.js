import { Router } from 'express';
import { serializeUser } from '../lib/auth.js';
import requireAuth from '../middleware/requireAuth.js';
import User from '../models/User.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .sort({ name: 1, email: 1 })
      .lean();

    res.json(users.map((user) => serializeUser(user)));
  } catch (error) {
    next(error);
  }
});

export default router;
