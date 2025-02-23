const db = require('../config/db');
const becrypt = require('bcryptjs');
class User {
    static async createUser(first_name, last_name, email, password) {
        const hashpassword = await becrypt.hash(password, 10);
        const sql = 'INSERT INTO tbl_users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        return db.execute(sql, [first_name, last_name, email, hashpassword]);
    }
    static async findUserByEmail(email) {
        try {
            const sql = 'SELECT * FROM tbl_users WHERE email = ?';
            const [rows] = await db.execute(sql, [email]);

            if (!Array.isArray(rows)) {
                throw new Error('Database response is not iterable');
            }

            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error in findUserByEmail:', error.message);
            throw error;
        }
    }

    static async createRequest(request) {
        const sql_req = 'Insert INTO tbl_reimbursment_request (user_id,project_id,team_no,status) VALUES (?, ?, ?, ?)';
        db.execute(sql_req, [request.user_id, request.project_id, request.team_no, request.status]);
        const sql_expense = 'Insert INTO tbl_expenses (description,expense_date,amount,bill_status) VALUES (?, ?, ?, ?)';
        for (let index = 0; index < request.reimbursement.length; index++) {
            const element = request.reimbursement[index];
            db.execute(sql_expense, [element.description, element.expense_date, element.amount, element.bill_status]);
        }
        
        const sql_expense_adv = 'Insert INTO tbl_exp_advance (expense_date,amount,mode) VALUES (?, ?, ?)';
        for (let index = 0; index < request.expense_advance.length; index++) {
            const element = request.expense_advance[index];
            db.execute(sql_expense_adv, [element.expense_date, element.amount, element.mode]);
        }
    }
}

module.exports = User;