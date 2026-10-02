const { Router } = require('express');
const { signup, login, refresh, logout } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimit.middleware');
const { signupSchema, loginSchema, refreshSchema } = require('../schemas/auth.schema');

const router = Router();

router.post('/signup', signupLimiter, validate(signupSchema), signup);
router.post('/login',  loginLimiter,  validate(loginSchema),  login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);

module.exports = router;
