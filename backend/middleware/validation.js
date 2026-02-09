const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidation = [
  body('username')
    .isLength({ min: 6, max: 20 })
    .withMessage('Username must be between 6 and 20 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const roleValidation = [
  body('role')
    .isIn(['user', 'premium', 'admin'])
    .withMessage('Role must be one of: user, premium, admin'),
  validate
];

const movieValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required'),
  body('extract')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Invalid release year'),
  body('genres')
    .isArray({ min: 1 })
    .withMessage('At least one genre is required'),
    body('cast')
    .isArray({ min: 1 })
    .withMessage('At least one actor is required'),
    body('director') .isArray({ min: 1 })
  .withMessage('Director is required'),
    body('posterUrl')  .optional({checkFalsy: true})
  .isURL()
  .withMessage('Poster must be a URL'),
    body('trailerUrl')  .optional({checkFalsy: true})
  .isURL()
  .withMessage('Poster must be a URL'),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  movieValidation,
  roleValidation
};
