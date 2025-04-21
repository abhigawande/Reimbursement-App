const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
// const moment = require('moment');
require('dotenv').config();


exports.getDashboard = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ message: `Welcome ${req.session.user.first_name}` });
};

// exports.uploadFileRequest = async (req, res) => {
//     try {
//         const filePath = req.file.filename;
//         await User.uploadFile(filePath);
//         res.status(201).json({ message: 'File successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// }

exports.reimbursmentRequest = async (req, res) => {
    try {
        const request = req.body;
        console.log(request);
        let accountantId = 0;

        const { user_id, project_id, team_no, req_date, reimbursement, teamMembers } = req.body;
        const parsedReimbursement = JSON.parse(reimbursement);

        parsedReimbursement.forEach((item, index) => {
            const file = req.files.find(f => f.fieldname === `bill_docs_${index}`);
            if (file) {
                item.bill_docs = file.path; // Store file path
            } else {
                item.bill_docs = '';
            }
        });

        // console.log('Final Processed Data:', {
        //     user_id,
        //     project_id,
        //     team_no,
        //     req_date,
        //     reimbursement: parsedReimbursement,
        //     teamMembers
        // });

        // console.log(request);
        const req_id = uuidv4(); // Generate unique request ID
        // console.log(req_id);

        // Check if files are uploaded
        // if (!req.files || req.files.length === 0) {
        //     return res.status(400).json({ message: "At least one file is required!" });
        // }

        // Process uploaded files
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            path: file.path
        }));

        const sql = 'SELECT id FROM tbl_employee WHERE designation_id = 3';
        const [accountants] = await db.execute(sql);

        if (accountants.length === 0) {
            // throw new Error('No accountants found');
            return res.status(400).json({ message: "No accountants found" });
        }

        const [existingRequests] = await db.execute(
            'SELECT COUNT(*) AS total FROM tbl_reimbursment_request WHERE assign_accountant_id IS NOT NULL'
        );

        const requestCount = existingRequests[0].total;

        if (accountants.length === 1) {
            accountantId = accountants[0].id;
        }
        if (requestCount === 0) {
            // Step 4a: If no requests yet, pick accountant with lowest ID
            accountantId = accountants
                .map(a => a.id)
                .sort((a, b) => a - b)[0]; // lowest ID
        } else {
            const [result] = await db.execute(`
                SELECT 
                    e.id AS employee_id,
                    COALESCE(COUNT(r.id), 0) AS assigned_count
                FROM 
                    tbl_employee e
                LEFT JOIN 
                    tbl_reimbursment_request r ON e.id = r.assign_accountant_id
                WHERE 
                    e.designation_id = 3
                GROUP BY 
                    e.id
                ORDER BY 
                    assigned_count ASC
                LIMIT 1
              `);

            accountantId = result[0].employee_id;
        }

        // console.log("Request Data:", request);
        // console.log("Uploaded Files:", uploadedFiles);

        // Store request and file details in database (modify User.createRequest as needed)
        // const newreq = await User.createRequest({ ...request, files: uploadedFiles }, req_id);
        const newreq = await User.createRequest(user_id, project_id, team_no, req_date, parsedReimbursement, req_id, teamMembers, accountantId);

        if (newreq.success) {
            return res.status(200).json({ message: "Request submitted successfully", files: uploadedFiles });
        }
        return res.status(400).json({ message: "Request submission failed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.reimbursementList = async (req, res) => {
    try {
        // console.log(req.user.userId);

        // const user_id = req.body;
        // const user_id = req.params.userId;
        // console.log(req.user.userId);
        const user_id = req.user.userId;

        const reimbursList = await User.getReimbursementList(user_id);
        return res.status(200).json({ data: reimbursList });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.authorityReimburseList = async (req, res) => {
    try {
        const user_id = req.user.userId;

        const reimbursList = await User.getAuthReimbursementList(user_id);
        return res.status(200).json({ data: reimbursList });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.reimbursement = async (req, res) => {
    try {
        const user_id = req.params.userId;
        // console.log(user_id);
        const user_id_role = req.user.userId;
        // console.log(user_id_role);
        // const user_id = req.user.userId;
        const request_id = req.params.requestId;
        const reimbursData = await User.getReimbursement(user_id, request_id, user_id_role);
        const role = await User.getRole(user_id_role);
        // console.log(role);
        let button_role = '';
        if (role === 'Manager') {
            button_role = 'M';
        } else if (role === 'Accountant') {
            button_role = 'A';
        } else if (role === 'Finance') {
            button_role = 'F';
        }
        // console.log("Status Type:", typeof reimbursData[0]?.status); // Check type
        // console.log("Button Role Type:", typeof button_role); // Check type
        // console.log(reimbursData);

        // Split team_members from first row into array of objects
        const teamMembersRaw = reimbursData[0]?.team_members || '';
        // const teammembers = teamMembersRaw
        //     .split(',')
        //     .map(name => name.trim())
        //     .filter(name => name)
        //     .map(name => ({ name }));

        const teammembers = teamMembersRaw
            .split(',')
            .map(item => item.trim())
            .filter(item => item)
            .map(item => {
                const [id, name] = item.split(':');
                return { id: parseInt(id), name };
            });

        const responseData = {
            request_id: request_id,
            user_id: reimbursData[0].user_id,
            project_id: reimbursData[0].project_id,
            team_no: reimbursData[0].team_no,
            req_date: reimbursData[0].req_date,
            first_name: reimbursData[0].first_name,
            last_name: reimbursData[0].last_name,
            project: reimbursData[0].project,
            aproval_status: reimbursData[0].aproval_status,
            status: reimbursData[0].status,
            advance_amount: reimbursData[0].advance_amount,
            reimbursement: reimbursData.map(row => ({
                id: row.id,
                description: row.description,
                expense_date: row.expense_date,
                amount: row.amount,
                bill_status: row.bill_status,
                bill_docs: row.bill_docs,
                comment: row.comment,
                // button_status: row.button_status,
                expense_status: row.expense_status,
                // demo: reimbursData[0].status,
                // buttondemo: row.button_status,
                button_status: (String(reimbursData[0]?.status) === String(button_role)) ? row.button_status : 1
                // button_status: (reimbursData[0]?.status.trim().toLowerCase() === button_role.trim().toLowerCase())
                //     ? row.button_status
                //     : 1

            })),
            teammembers: teammembers
        };
        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reimbursements', error: error.message });
    }
}

exports.selfreimbursement = async (req, res) => {
    try {
        const user_id = req.params.userId;
        // console.log(user_id);
        const user_id_role = req.user.userId;
        // console.log(user_id_role);
        // const user_id = req.user.userId;
        const request_id = req.params.requestId;
        const reimbursData = await User.getSelfReimbursement(user_id, request_id, user_id_role);
        const role = await User.getRole(user_id_role);
        // console.log(role);
        let button_role = '';
        if (role === 'Manager') {
            button_role = 'M';
        } else if (role === 'Accountant') {
            button_role = 'A';
        } else if (role === 'Finance') {
            button_role = 'F';
        }
        // console.log("Status Type:", typeof reimbursData[0]?.status); // Check type
        // console.log("Button Role Type:", typeof button_role); // Check type
        // console.log(reimbursData);

        // Split team_members from first row into array of objects
        const teamMembersRaw = reimbursData[0]?.team_members || '';
        const teammembers = teamMembersRaw
            .split(',')
            .map(name => name.trim())
            .filter(name => name)
            .map(name => ({ name }));

        const responseData = {
            request_id: request_id,
            user_id: reimbursData[0].user_id,
            project_id: reimbursData[0].project_id,
            team_no: reimbursData[0].team_no,
            req_date: reimbursData[0].req_date,
            first_name: reimbursData[0].first_name,
            last_name: reimbursData[0].last_name,
            project: reimbursData[0].project,
            aproval_status: reimbursData[0].aproval_status,
            status: reimbursData[0].status,
            advance_amount: reimbursData[0].advance_amount,
            reimbursement: reimbursData.map(row => ({
                id: row.id,
                description: row.description,
                expense_date: row.expense_date,
                amount: row.amount,
                bill_status: row.bill_status,
                bill_docs: row.bill_docs,
                comment: row.comment,
                // button_status: row.button_status,
                expense_status: row.expense_status,
                // demo: reimbursData[0].status,
                // buttondemo: row.button_status,
                button_status: (String(reimbursData[0]?.status) === String(button_role)) ? row.button_status : 1
                // button_status: (reimbursData[0]?.status.trim().toLowerCase() === button_role.trim().toLowerCase())
                //     ? row.button_status
                //     : 1

            })),
            teammembers: teammembers
        };
        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reimbursements', error: error.message });
    }
}

exports.getUserData = async (req, res) => {
    try {
        const user_id = req.user.userId;

        const user = await User.getUser(user_id);
        return res.status(200).json({ data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAproval = async (req, res) => {
    try {
        // const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        // console.log(currentDateTime); // Example: 2025-03-13 16:15:30
        const request = req.body;
        // console.log(request);
        const result = await User.getAproveal1(request);
        if (result.success) {
            // return res.status(200).json({ result: "Success", message: "Expenses approved" });
            return res.status(200).json({
                result: "Success",
                message: "Expenses approved",
                settled: result.settled  // Send settled flag in response
            });
        } else {
            return res.status(400).json({ result: "Failure", message: "Approval failed" });
        }
    } catch (error) {
        console.error("Error in getAproval:", error);
        return res.status(500).json({ result: "Error", message: "Internal Server Error" });
    }
}

exports.setAdvancePay = async (req, res) => {
    try {
        const { amount, emp_id, date } = req.body;
        const accountant_id = req.user.userId;
        const response = await User.setAdvancePay(amount, emp_id, date, accountant_id);

        if (response.success) {
            res.status(201).json({ message: 'Advance added successfully', result: true });
        } else {
            res.status(500).json({ message: 'Failed to add advance', result: false, error: response.error });
        }
    } catch (error) {
        console.error("Error inserting advance pay:", error);
        return { success: false, error: error.message };
    }
}

exports.advancedPayReport = async (req, res) => {
    try {
        const result = await User.getAdvancePayList();
        res.status(201).json({ message: 'Advance pay report successfully', data: result })
    } catch (error) {
        console.error(error);
    }
}

exports.updateRequest = async (req, res) => {
    try {
        const request = req.body;
        console.log(request);

        const { user_id, project_id, team_no, req_date, request_id, reimbursement, teammembers } = req.body;
        const parsedReimbursement = JSON.parse(reimbursement);
        const parsedteammembers = JSON.parse(teammembers);

        parsedReimbursement.forEach((item, index) => {
            const file = req.files.find(f => f.fieldname === `bill_docs_${index}`);
            item.bill_docs = file ? file.path : item.bill_docs || ''; // Retain existing file if no new upload
        });

        // console.log('Final Processed Data:', {
        //     user_id,
        //     request_id,
        //     project_id,
        //     team_no,
        //     req_date,
        //     reimbursement: parsedReimbursement,
        //     teammembers: parsedteammembers
        // });

        const newreq = await User.updateRequest(user_id, project_id, team_no, req_date, request_id, parsedReimbursement, parsedteammembers);
        if (newreq.success) {
            return res.status(200).json({ message: "Request updated successfully" });
        }
        return res.status(400).json({ message: "Request updated failed" });
    } catch (error) {

    }
}

exports.finalSettlementReport = async (req, res) => {
    try {
        const result = await User.getFinalSettlementList();
        res.status(201).json({ message: 'Final settlement report successfully', data: result })
    } catch (error) {
        console.error(error);
    }
}