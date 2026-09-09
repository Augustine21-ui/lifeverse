// backend/src/middleware/validation.js
import { body, param, query, validationResult } from 'express-validator';

// ─── Validation Rules ──────────────────────────────────────────

export const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[a-z]/).withMessage('Must contain lowercase')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character'),
  body('username')
    .isLength({ min: 3, max: 30 }).withMessage('Username 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Only letters, numbers, underscores'),
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

export const validateTask = [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Task title required'),
  body('xp_reward').optional().isInt({ min: 0, max: 1000 }).withMessage('XP reward 0–1000'),
  body('due_date').optional().isISO8601().withMessage('Invalid date'),
];

export const validateFocusSession = [
  body('duration').isInt({ min: 1, max: 180 }).withMessage('Duration 1–180 minutes'),
  body('topic').optional().isLength({ max: 100 }).withMessage('Topic too long'),
];

export const validateOpportunity = [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description 10–2000 chars'),
  body('age_min').optional().isInt({ min: 0, max: 100 }).withMessage('Invalid min age'),
  body('age_max').optional().isInt({ min: 0, max: 100 }).withMessage('Invalid max age')
    .custom((value, { req }) => {
      if (req.body.age_min && value < req.body.age_min) {
        throw new Error('Max age must be > min age');
      }
      return true;
    }),
  body('skills_required').isArray().withMessage('Skills must be an array'),
  body('education_level').isIn(['high_school', 'bachelors', 'masters', 'phd']),
];

// ─── Handle Validation Errors ──────────────────────────────────

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};