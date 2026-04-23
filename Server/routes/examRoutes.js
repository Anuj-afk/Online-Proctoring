import { Router } from 'express';
import Exam from '../models/Exam.js';

const router = Router();

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

router.get('/', async (_req, res, next) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 }).lean();
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
      title: title.trim(),
      questions,
    });

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
});

export default router;
