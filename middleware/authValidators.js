const { body } = require('express-validator');

const loginValidation = [
    body('email').isEmail().withMessage('Please entered valid email'),
    body('password').trim().not().isEmpty().withMessage('Password is required')
];

const signUpValidation = [
    body('email').isEmail().withMessage('Please entered valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[@$!%*?&]/)
        .withMessage('Password must contain at least one special character (@$!%*?&)'),
    body('passwordConfirmation').custom((value, { req }) => {
        return value === req.body.password;
    }).withMessage('Confirm Password not matched'),
    body('first_name').trim().not().isEmpty().withMessage('First Name is required'),
    body('last_name').trim().not().isEmpty().withMessage('Last Name is required'),
];

module.exports = { loginValidation,signUpValidation };
