const express = require('express');
const { getDashboard, reimbursmentRequest, reimbursement, reimbursementList, getUserData, getAproval, setAdvancePay, advancedPayReport, updateRequest, authorityReimburseList, finalSettlementReport,selfreimbursement } = require('../controllers/homeController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { reimburseValidation } = require('../middleware/reimburseValidation');
const validateRequest = require('../middleware/validateRequest');
const { uploadMultipleFiles } = require('../middleware/uploadMiddleware');
const router = express.Router();

router.get('/dashboard', authenticateUser, getDashboard);

router.post('/reimbursment-request', authenticateUser, uploadMultipleFiles, reimburseValidation, validateRequest, reimbursmentRequest);

// router.post('/upload-file', uploadSingleFile, uploadFileRequest);
router.get('/reimbursement-request/:userId/:requestId', authenticateUser, reimbursement);
router.get('/self-reimbursement-request/:userId/:requestId', authenticateUser, selfreimbursement);
router.get('/reimbursement-list', authenticateUser, reimbursementList);
router.get('/authority-reimbursement-list', authenticateUser, authorityReimburseList);
router.get('/user', authenticateUser, getUserData);
router.post('/aproval', authenticateUser, getAproval);
router.post('/advance-pay', authenticateUser, setAdvancePay);
router.get('/advance-pay-report', authenticateUser, advancedPayReport);
router.get('/final-settlement-report', authenticateUser, finalSettlementReport);
router.post('/update-reimbursement-request/', authenticateUser, uploadMultipleFiles, reimburseValidation, validateRequest, updateRequest);

module.exports = router;