const express = require('express');
const { signup, login, logout, getDashboard, reimbursmentRequest } = require('../controllers/authController');
const { signUpValidation, loginValidation } = require('../middleware/authValidators');
const validateRequest = require('../middleware/validateRequest');
const { authenticateUser } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', signUpValidation, validateRequest, signup);
router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', logout);
router.get('/dashboard', authenticateUser, getDashboard);
router.post('/reimbursment-request', reimbursmentRequest);
module.exports = router;