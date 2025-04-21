const express = require('express');
const { signup, login, logout, getDepartment, getDesignation, getProject, getManager } = require('../controllers/authController');
const { signUpValidation, loginValidation } = require('../middleware/authValidators');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();

router.post('/signup', signUpValidation, validateRequest, signup);
router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', logout);

router.get("/department", getDepartment);
router.get("/designation", getDesignation);
router.get('/manager', getManager);
router.get('/project', getProject);
module.exports = router;