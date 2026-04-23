import { Router } from 'express';
import { serializeExam, validateExamPayload } from '../lib/exams.js';
import requireAuth from '../middleware/requireAuth.js';
import Exam from '../models/Exam.js';

const router = Router();

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

async function findOwnedExam(examId, ownerId) {
  const exam = await Exam.findOne({ _id: examId, owner: ownerId }).populate(
    'assignedUsers',
    'name email',
  );

  if (!exam) {
    throw createError('Exam not found.', 404);
  }

  return exam;
}

async function findAccessibleExam(examId, userId) {
  const exam = await Exam.findOne({
    _id: examId,
    $or: [{ owner: userId }, { assignedUsers: userId }],
  })
    .populate('owner', 'name email')
    .populate('assignedUsers', 'name email');

  if (!exam) {
    throw createError('Exam not found.', 404);
  }

  return exam;
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const exams = await Exam.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .populate('assignedUsers', 'name email')
      .lean();

    res.json(exams.map((exam) => serializeExam(exam)));
  } catch (error) {
    next(error);
  }
});

router.get('/available', async (req, res, next) => {
  try {
    const exams = await Exam.find({ assignedUsers: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email')
      .lean();

    res.json(exams.map((exam) => serializeExam(exam)));
  } catch (error) {
    next(error);
  }
});

router.get('/:examId', async (req, res, next) => {
  try {
    const exam = await findAccessibleExam(req.params.examId, req.user.id);
    res.json(serializeExam(exam));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, assignedUsers, sections, questions } = validateExamPayload(req.body);

    const exam = await Exam.create({
      owner: req.user.id,
      title,
      assignedUsers: assignedUsers.filter((userId) => userId !== req.user.id),
      sections,
      questions,
    });

    const populatedExam = await Exam.findById(exam._id).populate('assignedUsers', 'name email');
    res.status(201).json(serializeExam(populatedExam));
  } catch (error) {
    next(error);
  }
});

router.put('/:examId', async (req, res, next) => {
  try {
    const exam = await findOwnedExam(req.params.examId, req.user.id);
    const { title, assignedUsers, sections, questions } = validateExamPayload(req.body);

    exam.title = title;
    exam.assignedUsers = assignedUsers.filter((userId) => userId !== req.user.id);
    exam.sections = sections;
    exam.questions = questions;

    await exam.save();

    res.json(serializeExam(exam));
  } catch (error) {
    next(error);
  }
});

export default router;
