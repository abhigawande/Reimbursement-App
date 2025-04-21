const { body } = require('express-validator');

const reimburseValidation = [
    // console.log(body())

    body('user_id').isInt().withMessage('Employee name is required'),
    body('project_id').isInt().withMessage('Project is required'),
    body('team_no').isInt().withMessage('Team no is required'),
    body('reimbursement[*].description').trim().not().isEmpty().withMessage('Description is required'),
    body('reimbursement[*].expense_date').trim().not().isEmpty().withMessage('Expense date is required'),
    body('reimbursement[*].amount').isInt().withMessage('Amount is required')

    // for (let index = 0; index < reimbursement.length; index++) {
    //     const element = array[reimbursement];
    //     body('element.description').trim().not().isEmpty().withMessage('Description is required');
    // }
    
]
module.exports = { reimburseValidation };