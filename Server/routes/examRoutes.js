import { Router } from 'express';
import { serializeExam, serializeSubmission, validateExamPayload } from '../lib/exams.js';
import requireAuth from '../middleware/requireAuth.js';
import Exam from '../models/Exam.js';

const router = Router();

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

async function findOwnedExam(examId, ownerId) {
  const exam = await Exam.findOne({ _id: examId, owner: ownerId })
    .populate('assignedUsers', 'name email')
    .populate('submissions.candidate', 'name email');

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
    .populate('assignedUsers', 'name email')
    .populate('submissions.candidate', 'name email');

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
    const serialized = exam.owner._id.toString() === req.user.id
      ? serializeExam(exam, { includeSubmissions: true })
      : serializeExam(exam, { currentUserId: req.user.id });

    res.json(serialized);
  } catch (error) {
    next(error);
  }
});

router.post('/:examId/submissions', async (req, res, next) => {
  try {
    const exam = await findAccessibleExam(req.params.examId, req.user.id);

    if (exam.owner._id.toString() === req.user.id) {
      throw createError('Exam owners cannot submit their own exam.', 403);
    }

    const existing = Array.isArray(exam.submissions)
      ? exam.submissions.find(
          (submission) => submission.candidate._id.toString() === req.user.id,
        )
      : null;

    if (existing) {
      throw createError('You have already submitted this exam.', 400);
    }

    exam.submissions.push({
      candidate: req.user.id,
      answers: req.body.answers || {},
      submittedAt: new Date(),
    });

    await exam.save();

    const updatedExam = await Exam.findById(exam._id)
      .populate('submissions.candidate', 'name email');

    const submission = Array.isArray(updatedExam.submissions)
      ? updatedExam.submissions.find(
          (item) => item.candidate._id.toString() === req.user.id,
        )
      : null;

    res.status(201).json({ submission: serializeSubmission(submission) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, assignedUsers, sections, questions, allowedFaults } = validateExamPayload(req.body);

    const exam = await Exam.create({
      owner: req.user.id,
      title,
      assignedUsers: assignedUsers.filter((userId) => userId !== req.user.id),
      sections,
      questions,
      allowedFaults,
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
    const { title, assignedUsers, sections, questions, allowedFaults } = validateExamPayload(req.body);

    exam.title = title;
    exam.assignedUsers = assignedUsers.filter((userId) => userId !== req.user.id);
    exam.sections = sections;
    exam.questions = questions;
    exam.allowedFaults = allowedFaults;

    await exam.save();

    res.json(serializeExam(exam));
  } catch (error) {
    next(error);
  }
});

export default router;
