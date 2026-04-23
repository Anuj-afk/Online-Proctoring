import { Router } from 'express';
import { runUserCode, validateRunPayload } from '../lib/codeRunner.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post('/run', async (req, res, next) => {
  try {
    const payload = validateRunPayload(req.body);
    const result = await runUserCode(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
