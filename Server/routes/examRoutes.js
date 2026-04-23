import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import Exam from '../models/Exam.js';

const router = Router();

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const exams = await Exam.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(exams);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, questions } = req.body;

    if (!title?.trim()) {
      throw createError('Exam title is required.', 400);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw createError('At least one question is required.', 400);
    }

    const exam = await Exam.create({
      owner: req.user.id,
      title: title.trim(),
      questions,
    });

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
});

export default router;
