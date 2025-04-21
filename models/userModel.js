const db = require('../config/db');
const becrypt = require('bcryptjs');
const moment = require("moment");
class User {
    static async createUser(first_name, last_name, email, password, department_id, designation_id, manager_id) {
        const hashpassword = await becrypt.hash(password, 10);
        const sql = 'INSERT INTO tbl_employee (first_name, last_name, email, password, department_id, designation_id, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
        return db.execute(sql, [first_name, last_name, email, hashpassword, department_id, designation_id, manager_id]);
    }
    static async findUserByEmail(email) {
        try {
            const sql = 'SELECT * FROM tbl_employee WHERE email = ?';
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

    // static async uploadFile(filePath) {
    //     const sql = 'INSERT INTO tbl_expenses (bill_docs) VALUES (?)';
    //     return db.execute(sql, [filePath]);
    // }

    static async createRequest(user_id, project_id, team_no, req_date, parsedReimbursement, req_id, teamMembers, accountantId) {
        try {
            await db.beginTransaction();
            const sql_req = 'Insert INTO tbl_reimbursment_request (user_id,project_id,team_no,request_id,req_date,created_by,assign_accountant_id) VALUES (?, ?, ?, ?, ?, ?, ?)';

            await db.execute(sql_req, [user_id, project_id, team_no, req_id, req_date, user_id, accountantId]);

            const sql_expense = 'Insert INTO tbl_expenses (description,expense_date,amount,bill_status,request_id,created_by,bill_docs) VALUES (?, ?, ?, ?, ?, ?, ?)';
            let total_amount = 0;

            const sql_teammembers = 'Insert INTO tbl_teammembers (name,request_id) VALUES (?,?)';
            for (let index = 0; index < parsedReimbursement.length; index++) {
                // const billdoc_filePath = request.reimbursement[index].bill_docs;
                const element = parsedReimbursement[index];

                // let filePath = null;
                // if (request.files && request.files[index]) {
                //     filePath = request.files[index].path;  // Store file path
                // }
                await db.execute(sql_expense, [element.description, element.expense_date, element.amount, element.bill_status, req_id, user_id, element.bill_docs]);
                total_amount = total_amount + element.amount;
            }

            // Safely parse JSON string if necessary
            if (typeof teamMembers === 'string') {
                teamMembers = JSON.parse(teamMembers);
            }

            for (let index = 0; index < teamMembers.length; index++) {
                const element = teamMembers[index];
                // console.log('Element', element);


                await db.execute(sql_teammembers, [element.name, req_id]);
            }

            // const sql_expense_adv = 'Insert INTO tbl_advance_spent (date,amount,mode) VALUES (?, ?, ?)';
            // for (let index = 0; index < request.advance_taken.length; index++) {
            //     const element = request.advance_taken[index];
            //     db.execute(sql_expense_adv, [element.date, element.amount, element.mode]);
            // }

            const sql_request_status = 'Insert INTO tbl_reimbursment_status (user_id,amount,request_id,created_by) VALUES (?, ?, ?, ?)';
            await db.execute(sql_request_status, [user_id, total_amount, req_id, user_id]);

            await db.commit();
            return { success: true };
        } catch (error) {
            await db.rollback();
            console.error(error);
            throw error;
        }
    }

    static async getDepartment() {
        const sql = 'SELECT * FROM tbl_department';
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async getDesignation() {
        const sql = 'SELECT * FROM tbl_designation';
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async getManager() {
        const sql = 'SELECT first_name,last_name,id FROM tbl_employee';
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async getProject() {
        const sql = 'SELECT * FROM tbl_project';
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async getLastRequestId() {
        const sql = 'SELECT request_id FROM tbl_reimbursment_request ORDER BY request_id DESC LIMIT 1;'
        const [rows] = await db.execute(sql);
        let newRequestId = 1; // Default for the first record
        if (rows.length > 0) {
            newRequestId = rows[0].request_id + 1; // Increment the last request_id
        }
        return newRequestId;
    }

    static async getReimbursementList(user_id) {
        // console.log(user_id);

        const sql2 = 'SELECT d.designation from tbl_designation d JOIN tbl_employee e ON d.id = e.designation_id WHERE e.id = ?;'
        const [rows1] = await db.execute(sql2, [user_id]);
        // console.log(rows1[0].designation);
        const designation = rows1[0].designation;
        const sqlReporting = 'SELECT id from tbl_employee WHERE manager_id = ?;'
        const [reprows] = await db.execute(sqlReporting, [user_id]);
        if (reprows.length > 0 && designation != 'Accountant' && designation != 'Finance') {
            // const sql = "SELECT request_id,req_date,team_no FROM tbl_reimbursment_request WHERE manager_id = ? AND status = 'M';"
            const sql = "SELECT req.user_id,req.request_id,req.req_date,req.team_no,req.status,req.aproval_status,e.first_name,e.last_name,p.project FROM tbl_reimbursment_request req JOIN tbl_employee e ON req.user_id = e.id JOIN tbl_project p ON req.project_id = p.id WHERE user_id IN (SELECT id from tbl_employee WHERE manager_id = ?) AND status IN ('M', 'A', 'F', 'S');"

            const [rows] = await db.execute(sql, [user_id]);
            rows.map(row => ({
                ...row,
                flag: row.designation = 'Manager'
            }));
            return rows;
        } else if (designation == 'Accountant') {
            // const sql = "SELECT user_id,request_id,req_date,team_no FROM tbl_reimbursment_request WHERE status = 'A';"
            const sql = "SELECT req.user_id,req.request_id,req.req_date,req.team_no,req.status,req.aproval_status,e.first_name,e.last_name,p.project FROM tbl_reimbursment_request req JOIN tbl_employee e ON req.user_id = e.id JOIN tbl_project p ON req.project_id = p.id WHERE status IN ('A', 'F', 'S') AND req.assign_accountant_id = ?;"
            const [rows] = await db.execute(sql,[user_id]);
            return rows;
        } else if (designation == 'Finance') {
            // const sql = "SELECT user_id,request_id,req_date,team_no FROM tbl_reimbursment_request WHERE status = 'F';"
            const sql = "SELECT req.user_id,req.request_id,req.req_date,req.team_no,req.status,req.aproval_status,e.first_name,e.last_name,p.project FROM tbl_reimbursment_request req JOIN tbl_employee e ON req.user_id = e.id JOIN tbl_project p ON req.project_id = p.id WHERE status IN ('F', 'S');"
            const [rows] = await db.execute(sql);
            return rows;
        } else {
            // const sql = 'SELECT user_id,request_id,req_date,team_no FROM tbl_reimbursment_request WHERE user_id=?;'
            const sql = 'SELECT req.user_id,req.request_id,req.req_date,req.team_no,req.status,req.aproval_status,ms.status as aprove_status,e.first_name,e.last_name,p.project FROM tbl_reimbursment_request req JOIN tbl_employee e ON req.user_id = e.id JOIN tbl_project p ON req.project_id = p.id JOIN tbl_master_status as ms ON req.aproval_status = ms.id WHERE user_id=?;'
            const [rows] = await db.execute(sql, [user_id]);
            return rows;
        }
    }

    static async getAuthReimbursementList(user_id) {
        const sql2 = 'SELECT d.designation from tbl_designation d JOIN tbl_employee e ON d.id = e.designation_id WHERE e.id = ?;'
        const [rows1] = await db.execute(sql2, [user_id]);
        // console.log(rows1[0].designation);
        const designation = rows1[0].designation;
        if (designation == 'Finance' || designation == 'Manager' || designation == 'Accountant') {
            const sql = 'SELECT req.user_id,req.request_id,req.req_date,req.team_no,req.status,ms.status as aprove_status,e.first_name,e.last_name,p.project FROM tbl_reimbursment_request req JOIN tbl_employee e ON req.user_id = e.id JOIN tbl_project p ON req.project_id = p.id JOIN tbl_master_status as ms ON req.aproval_status = ms.id WHERE req.user_id=?;'
            const [rows] = await db.execute(sql, [user_id]);
            return rows;
        }
    }

    static async getReimbursement(user_id, request_id, login_user_id) {
        const role = await this.getRole(login_user_id);
        // console.log(role);
        // if (user_id == login_user_id) {
        //     this.role = 'Self';
        // }

        if (role == 'Employee') {
            // const sql = 'SELECT e.first_name,e.last_name,p.project, req.user_id, req.project_id,req.team_no,req.req_date,req.aproval_status,req.status,exp.id,exp.description,exp.expense_date,exp.amount,exp.bill_status,exp.button_status,exp.bill_docs,exp.comment,ms.status as expense_status,ad.amount as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status as ms ON exp.bill_status = ms.id JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE req.request_id = ? && req.user_id = ?;'
            // const [rows] = await db.execute(sql, [request_id, user_id]);
            // return rows;

            const sql = `SELECT GROUP_CONCAT(DISTINCT CONCAT(tm.id, ':', tm.name)) AS team_members, e.first_name, e.last_name, p.project, req.user_id, req.project_id, req.team_no, req.req_date, req.aproval_status, req.status, exp.id, exp.description, exp.expense_date, exp.amount, exp.bill_status, exp.button_status, exp.bill_docs, exp.comment, ms.status as expense_status, SUM(ad.amount) as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status ms ON exp.bill_status = ms.id LEFT JOIN tbl_teammembers tm ON req.request_id = tm.request_id LEFT JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE req.request_id = ? AND req.user_id = ? GROUP BY exp.id;`
            const [rows] = await db.execute(sql, [request_id, user_id]);
            return rows;
        }
        // else if (role == 'Self') {
        //     const sql = 'SELECT e.first_name,e.last_name,p.project, req.user_id, req.project_id,req.team_no,req.req_date,req.aproval_status,req.status,exp.id,exp.description,exp.expense_date,exp.amount,exp.bill_status,exp.button_status,exp.bill_docs,exp.comment,ms.status as expense_status,ad.amount as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status as ms ON exp.bill_status = ms.id JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE req.request_id = ? && req.user_id = ?;'
        //     const [rows] = await db.execute(sql, [request_id, user_id]);
        //     return rows;
        // } 
        else {
            // const sql = 'SELECT e.first_name,e.last_name,p.project, req.user_id, req.project_id,req.team_no,req.req_date,req.aproval_status,req.status,exp.id,exp.description,exp.expense_date,exp.amount,exp.bill_status,exp.button_status,exp.bill_docs,exp.comment,ms.status as expense_status,ad.amount as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status as ms ON exp.bill_status = ms.id JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE exp.bill_status NOT IN (8, 9, 10) && req.request_id = ? && req.user_id = ?;'
            // const [rows] = await db.execute(sql, [request_id, user_id]);
            // return rows;

            // const sql = 'SELECT GROUP_CONCAT(DISTINCT tm.name) as team_members, e.first_name, e.last_name, p.project, req.user_id, req.project_id, req.team_no, req.req_date, req.aproval_status, req.status, exp.id, exp.description, exp.expense_date, exp.amount, exp.bill_status, exp.button_status, exp.bill_docs, exp.comment, ms.status as expense_status, ad.amount as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status ms ON exp.bill_status = ms.id LEFT JOIN tbl_teammembers tm ON req.request_id = tm.request_id LEFT JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE exp.bill_status NOT IN (8, 9, 10) && req.request_id = ? && req.user_id = ? GROUP BY exp.id;'
            // const [rows] = await db.execute(sql, [request_id, user_id]);
            // return rows;

            const sql = `SELECT GROUP_CONCAT(DISTINCT CONCAT(tm.id, ':', tm.name)) AS team_members, e.first_name, e.last_name, p.project, req.user_id, req.project_id, req.team_no, req.req_date, req.aproval_status, req.status, exp.id, exp.description, exp.expense_date, exp.amount, exp.bill_status, exp.button_status, exp.bill_docs, exp.comment, ms.status as expense_status, ad.amount as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status ms ON exp.bill_status = ms.id LEFT JOIN tbl_teammembers tm ON req.request_id = tm.request_id LEFT JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE exp.bill_status NOT IN (8, 9, 10) && req.request_id = ? && req.user_id = ? GROUP BY exp.id;`
            const [rows] = await db.execute(sql, [request_id, user_id]);
            return rows;
        }
    }

    static async getSelfReimbursement(user_id, request_id, login_user_id) {
        const role = await this.getRole(login_user_id);

        const sql = 'SELECT GROUP_CONCAT(DISTINCT tm.name) as team_members, e.first_name, e.last_name, p.project, req.user_id, req.project_id, req.team_no, req.req_date, req.aproval_status, req.status, exp.id, exp.description, exp.expense_date, exp.amount, exp.bill_status, exp.button_status, exp.bill_docs, exp.comment, ms.status as expense_status, SUM(ad.amount) as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status ms ON exp.bill_status = ms.id LEFT JOIN tbl_teammembers tm ON req.request_id = tm.request_id LEFT JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE req.request_id = ? AND req.user_id = ? GROUP BY exp.id;'
        const [rows] = await db.execute(sql, [request_id, user_id]);
        return rows;
        // else if (role == 'Self') {
        //     const sql = 'SELECT e.first_name,e.last_name,p.project, req.user_id, req.project_id,req.team_no,req.req_date,req.aproval_status,req.status,exp.id,exp.description,exp.expense_date,exp.amount,exp.bill_status,exp.button_status,exp.bill_docs,exp.comment,ms.status as expense_status,ad.amount as advance_amount FROM tbl_reimbursment_request req JOIN tbl_expenses exp ON req.request_id = exp.request_id JOIN tbl_employee e ON e.id = req.user_id JOIN tbl_project p ON p.id = req.project_id JOIN tbl_master_status as ms ON exp.bill_status = ms.id JOIN tbl_master_advance ad ON req.user_id = ad.emp_id WHERE req.request_id = ? && req.user_id = ?;'
        //     const [rows] = await db.execute(sql, [request_id, user_id]);
        //     return rows;
        // } 
    }

    static async getUser(user_id) {
        const sql = 'SELECT first_name,last_name,id as userId FROM tbl_employee WHERE id = ?';
        const [rows] = await db.execute(sql, [user_id]);
        return rows;
    }

    static async getAproveal(request) {
        try {
            // console.log(request);

            let isReject = false;
            let aproval_status = '';

            await db.beginTransaction();

            const sql_aprove_req = 'Update tbl_expenses SET bill_status = ?,comment = ? WHERE id = ? AND request_id = ?';
            for (let index = 0; index < request.expense.length; index++) {
                const element = request.expense[index];
                if (element.bill_status == 3 || element.bill_status == 5 || element.bill_status == 7) {
                    isReject = true;
                }
                await db.execute(sql_aprove_req, [element.bill_status, element.comment, element.id, request.request_id]);
            }
            // if (isReject == false) {
            if (!isReject) {
                if (request.role == 'Manager') {
                    aproval_status = 2;
                } else if (request.role == 'Accountant') {
                    aproval_status = 4;
                } else if (request.role == 'Finance') {
                    aproval_status = 6;

                    const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");

                    const sql_get_user = 'SELECT user_id FROM tbl_reimbursment_request WHERE request_id = ?;'
                    const [userRow] = await db.execute(sql_get_user, [request.request_id]);

                    if (userRow.length === 0) {
                        throw new Error("Employee ID not found for request ID: " + request.request_id);
                    }

                    const emp_id = userRow[0].user_id;

                    // Get total advance payment
                    const sql_get_advance = 'SELECT amount as total_amount FROM tbl_master_advance WHERE emp_id = ?;'
                    const [advanceRow] = await db.execute(sql_get_advance, [emp_id]);

                    // const totalAdvanceAmount = rows[0]?.total_amount || 0;
                    const totalAdvanceAmount = advanceRow.length > 0 ? advanceRow[0].total_amount || 0 : 0;

                    let paid_by_advance = 0;
                    let to_be_paid = request.totalAmount;
                    let advance_rem = 0;
                    if (totalAdvanceAmount > request.totalAmount) {
                        advance_rem = totalAdvanceAmount - request.totalAmount;
                        paid_by_advance = request.totalAmount;
                        to_be_paid = 0;
                    } else {
                        to_be_paid = request.totalAmount - totalAdvanceAmount;
                        advance_rem = 0;
                        paid_by_advance = totalAdvanceAmount;
                    }
                    if (advanceRow.length > 0) {
                        const sql_update_advance = 'UPDATE tbl_master_advance SET amount = ? WHERE emp_id = ?';
                        await db.execute(sql_update_advance, [advance_rem, emp_id]);
                    }

                    const sql_insert_settlement = 'INSERT INTO tbl_final_settlement (emp_id,req_id,paid_by_advance,to_be_paid,claim_amount,date) values(?, ?, ?, ?, ?, ?);'
                    const result = await db.execute(sql_insert_settlement, [emp_id, request.request_id, paid_by_advance, to_be_paid, request.totalAmount, currentDateTime]);
                }
                const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                await db.execute(sql_aprove_req1, [request.status, aproval_status, request.request_id]);
            } else {
                if (request.role == 'Manager') {
                    aproval_status = 3;
                } else if (request.role == 'Accountant') {
                    aproval_status = 5;
                } else if (request.role == 'Finance') {
                    aproval_status = 7;
                }
                const sql_aprove_req2 = 'Update tbl_reimbursment_request SET aproval_status = ? WHERE request_id = ?';
                await db.execute(sql_aprove_req2, [aproval_status, request.request_id]);
            }
            await db.commit();
            return { success: true };
        } catch (error) {
            await db.rollback();
            // return { success: false };
            console.error(error);
            throw error;
        }
    }

    // static async getAproveal(request, date) {
    //     try {
    //         await db.beginTransaction();
    //         const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ? WHERE request_id = ?';
    //         await db.execute(sql_aprove_req1, [request.status, request.request_id]);
    //         const sql_aprove_req = 'Update tbl_expenses SET bill_status = ? WHERE id = ? AND request_id = ?';
    //         for (let index = 0; index < request.expense.length; index++) {
    //             const element = request.expense[index];
    //             await db.execute(sql_aprove_req, [element.bill_status, element.id, request.request_id]);
    //         }
    //         if (request.role == 'Finance') {
    //             const total_ad_pay = 'SELECT SUM(amount) as total_amount FROM tbl_advance_pay WHERE emp_id = ?;'
    //             const [rows] = await db.execute(total_ad_pay, [element.id]);
    //             const totalAmount = rows[0]?.total_amount || 0;
    //             if (totalAmount > 0) {
    //                 const settled_amount = totalAmount - request.amount;
    //             } else {
    //                 settled_amount = request.amount;
    //             }
    //             const sql_settlement = 'INSERT INTO tbl_final_settlement (emp_id,req_id,amount,date) values(?, ?, ?, ?);'
    //             const result = await db.execute(sql_settlement, [element.id, request.request_id, request.amount, date]);
    //         }
    //         await db.commit();
    //         return { success: true };
    //     } catch (error) {
    //         await db.rollback();
    //         // return { success: false };
    //         console.error(error);
    //         throw error;
    //     }

    // }

    static async getRole(user_id) {
        const sql2 = 'SELECT d.designation from tbl_designation d JOIN tbl_employee e ON d.id = e.designation_id WHERE e.id = ?;'
        const [rows1] = await db.execute(sql2, [user_id]);
        // console.log(rows1[0].designation);
        const designation = rows1[0].designation;
        const sqlReporting = 'SELECT id from tbl_employee WHERE manager_id = ?;'
        const [reprows] = await db.execute(sqlReporting, [user_id]);
        if (reprows.length > 0 && designation != 'Accountant' && designation != 'Finance') {
            return 'Manager';
        } else if (designation == 'Accountant') {
            return 'Accountant';
        } else if (designation == 'Finance') {
            return 'Finance';
        } else {
            return 'Employee';
        }
    }

    static async setAdvancePay(amount, emp_id, date, accountant_id) {
        try {
            const sql = 'INSERT INTO tbl_advance_pay (emp_id, accountant_id, amount, date) VALUES (?, ?, ?, ?)';
            await db.execute(sql, [emp_id, accountant_id, amount, date]);

            const sql2 = 'SELECT amount from tbl_master_advance WHERE emp_id = ?;'
            const [reprows] = await db.execute(sql2, [emp_id]);

            if (reprows.length > 0) {
                let updated_amount = amount + reprows[0].amount;
                const sql1 = 'UPDATE tbl_master_advance SET amount = ? WHERE emp_id = ?';
                await db.execute(sql1, [updated_amount, emp_id]);
            } else {
                const sql1 = 'INSERT INTO tbl_master_advance (emp_id, amount) VALUES (?, ?)';
                await db.execute(sql1, [emp_id, amount]);
            }
            return { success: true };
        } catch (error) {
            console.error("Error inserting advance pay:", error);
            return { success: false, error: error.message };
        }
    }

    static async getAdvancePayList() {
        const sql = 'SELECT ad.amount,ad.date,emp.first_name,emp.last_name FROM tbl_advance_pay ad JOIN tbl_employee emp ON ad.emp_id = emp.id;'
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async updateRequest(user_id, project_id, team_no, req_date, request_id, parsedReimbursement, teamMembers) {
        try {
            await db.beginTransaction();
            const status = 'M';
            const aproval_status = 1;
            // const bill_status = '1';
            const sql_req = 'UPDATE tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
            await db.execute(sql_req, [status, aproval_status, request_id]);

            const sql_expense = 'UPDATE tbl_expenses SET description = ?,expense_date = ?,amount = ?,bill_status = ?,bill_docs = ?,button_status = ? WHERE request_id = ? AND id = ? AND bill_status NOT IN (8, 9, 10)';
            for (let index = 0; index < parsedReimbursement.length; index++) {
                const element = parsedReimbursement[index];
                await db.execute(sql_expense, [element.description, element.expense_date, element.amount, element.bill_status, element.bill_docs, element.button_status, request_id, element.id]);
            }

            const sql_teammembers = 'UPDATE tbl_teammembers SET name = ? WHERE request_id = ? AND id = ?';
            for (let index = 0; index < teamMembers.length; index++) {
                const element = teamMembers[index];
                await db.execute(sql_teammembers, [element.name, request_id, element.id]);
            }

            await db.commit();
            return { success: true };
        } catch (error) {
            await db.rollback();
            console.error(error);
            throw error;
        }
    }

    static async getFinalSettlementList() {
        const sql = 'SELECT emp.first_name,emp.last_name, fs.date,fs.paid_by_advance,fs.to_be_paid,fs.claim_amount FROM tbl_final_settlement fs JOIN tbl_employee emp ON fs.emp_id = emp.id;'
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async getAproveal1(request) {
        try {
            console.log(request);
            let aproval_status = '';
            let req_status = '';
            let settled = false; // Introduce a flag for settlement

            await db.beginTransaction();

            const sql_aprove_req = 'Update tbl_expenses SET bill_status = ?,button_status = ?,comment = ? WHERE id = ? AND request_id = ?';
            for (let index = 0; index < request.expense.length; index++) {
                const element = request.expense[index];
                await db.execute(sql_aprove_req, [element.bill_status, element.button_status, element.comment, element.id, request.request_id]);
            }
            if (request.role == 'Manager') {
                let req_status = '';
                let aproval_status = 0;

                const checkAllReject = `SELECT 
                            CASE 
                                WHEN COUNT(*) = COUNT(CASE WHEN bill_status = 8 THEN 1 END) 
                                THEN 'All Rejected' 
                                ELSE 'Pending' 
                            END AS status
                        FROM tbl_expenses
                        WHERE request_id = ?;`;
                const [userRowRej] = await db.execute(checkAllReject, [request.request_id]);

                if (userRowRej[0].status == 'All Rejected') {
                    req_status = 'R';
                    aproval_status = 8;

                    const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                    await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                    // const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ?';
                    // await db.execute(sql_aprove_req2, [0, request.request_id]);
                }

                const sql_expense_count = 'SELECT COUNT(*) AS total_expenses FROM tbl_expenses WHERE request_id = ?';
                const [rows] = await db.execute(sql_expense_count, [request.request_id]);
                let total_expenses = rows[0].total_expenses; // Returning the count
                // console.log(total_expenses);


                const sql_expense_button_status = 'SELECT COUNT(*) AS total_button_expenses FROM tbl_expenses WHERE request_id = ? AND button_status = ?';
                const [rows1] = await db.execute(sql_expense_button_status, [request.request_id, 1]);
                let total_button_expenses = rows1[0].total_button_expenses; // Returning the count
                // console.log(total_button_expenses);
                if (total_expenses == total_button_expenses) {
                    const checkAllApp = `SELECT 
                                        CASE 
                                            WHEN COUNT(*) = 0 THEN 'All Approved' 
                                            ELSE 'Pending' 
                                        END AS status
                                    FROM tbl_expenses
                                    WHERE request_id = ? 
                                    AND bill_status <> 2
                                    AND bill_status != 9
                                    AND bill_status != 8
                                    AND bill_status != 10;`;
                    const [userRow1] = await db.execute(checkAllApp, [request.request_id]);
                    console.log(userRow1[0].status);

                    if (userRow1[0].status == 'All Approved') {
                        req_status = 'A';
                        aproval_status = 2;

                        const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                        await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                        const sql_aprove_req2 = `Update tbl_expenses SET button_status = ?, comment = NULL WHERE request_id = ? AND bill_status NOT IN (8, 9, 10)`;
                        await db.execute(sql_aprove_req2, [0, request.request_id]);
                    }
                    else {
                        const sql_up_aproved_count = `
                                                        SELECT COUNT(*) AS total_up_ap_expenses 
                                                        FROM tbl_expenses 
                                                        WHERE request_id = ? 
                                                        AND bill_status IN (4, 6)
                                                    `;

                        const [rows1] = await db.execute(sql_up_aproved_count, [request.request_id]);

                        // Ensure rows exist before accessing the result
                        let total_up_count = (rows1.length > 0) ? rows1[0].total_up_ap_expenses : 0;

                        if (total_up_count > 0) {
                            const sql_check_bill_status = `
                                    SELECT COUNT(*) AS count 
                                    FROM tbl_expenses 
                                    WHERE request_id = ? 
                                    AND bill_status = 2
                                `;

                            const [rows] = await db.execute(sql_check_bill_status, [request.request_id]);

                            // Check if any records exist with bill_status = 2
                            // const hasBillStatus2 = rows[0].count > 0;
                            if (rows[0].count > 0) {
                                const sql_record_count = `
                                                            SELECT COUNT(*) AS total_expenses_record
                                                            FROM tbl_expenses 
                                                            WHERE request_id = ? 
                                                            AND bill_status IN (4, 6, 2, 8, 9, 10)
                                                        `;

                                const [rowstotal] = await db.execute(sql_record_count, [request.request_id]);
                                if (rowstotal[0].total_expenses_record == total_expenses) {
                                    req_status = 'A';
                                    aproval_status = 2;

                                    const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                                    await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                                    const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ? AND bill_status = 2';
                                    await db.execute(sql_aprove_req2, [0, request.request_id]);
                                }
                            }

                        } else {
                            const sql_manager_review_count = `
                                                        SELECT COUNT(*) AS total_review_expenses 
                                                        FROM tbl_expenses 
                                                        WHERE request_id = ? 
                                                        AND bill_status IN (3)
                                                    `;

                            const [rows_reviews] = await db.execute(sql_manager_review_count, [request.request_id]);

                            // Ensure rows exist before accessing the result
                            let total_m_review_count = (rows_reviews.length > 0) ? rows_reviews[0].total_review_expenses : 0;
                            if (total_m_review_count > 0) {
                                aproval_status = 3;
                                const sql_aprove_req1 = 'Update tbl_reimbursment_request SET aproval_status = ? WHERE request_id = ?';
                                await db.execute(sql_aprove_req1, [aproval_status, request.request_id]);
                            }
                        }

                        // req_status = 'M';
                        // aproval_status = 1;

                        // const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                        // await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                        // const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ?';
                        // await db.execute(sql_aprove_req2, [0, request.request_id]);

                        // const sql_expense_review = 'SELECT status FROM tbl_reimbursment_request WHERE request_id = ?';
                        // const [rows] = await db.execute(sql_expense_review, [request.request_id]);

                        // if (rows.length > 0) {  // Ensure rows exist
                        //     let status = rows[0].status;
                        //     console.log(status);

                        //     if (status === 'A' || status === 'F') {
                        //         const sql_aprove_req2 = 'UPDATE tbl_expenses SET button_status = ? WHERE request_id = ? AND bill_status = 2 AND button_status = 1';
                        //         await db.execute(sql_aprove_req2, [0, request.request_id]);
                        //     }
                        // } else {
                        //     console.log(`No record found for request_id: ${request.request_id}`);
                        // }

                    }
                }

            } else if (request.role == 'Accountant') {
                let req_status = '';
                let aproval_status = 0;

                const checkAllReject = `SELECT 
                            CASE 
                                WHEN COUNT(*) = COUNT(CASE WHEN bill_status = 9 THEN 1 END) 
                                THEN 'All Rejected' 
                                ELSE 'Pending' 
                            END AS status
                        FROM tbl_expenses
                        WHERE request_id = ?;`;
                const [userRowRej] = await db.execute(checkAllReject, [request.request_id]);

                if (userRowRej[0].status == 'All Rejected') {
                    req_status = 'R';
                    aproval_status = 9;

                    const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                    await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                    // const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ?';
                    // await db.execute(sql_aprove_req2, [0, request.request_id]);
                }

                const sql_expense_count = 'SELECT COUNT(*) AS total_expenses FROM tbl_expenses WHERE request_id = ?';
                const [rows] = await db.execute(sql_expense_count, [request.request_id]);
                let total_expenses = rows[0].total_expenses; // Returning the count

                const sql_expense_button_status = 'SELECT COUNT(*) AS total_button_expenses FROM tbl_expenses WHERE request_id = ? AND button_status = ?';
                const [rows1] = await db.execute(sql_expense_button_status, [request.request_id, 1]);
                let total_button_expenses = rows1[0].total_button_expenses; // Returning the count

                if (total_expenses == total_button_expenses) {
                    const checkAllApp = `SELECT 
                                        CASE 
                                            WHEN COUNT(*) = 0 THEN 'All Approved' 
                                            ELSE 'Pending' 
                                        END AS status
                                    FROM tbl_expenses
                                    WHERE request_id = ? 
                                    AND bill_status <> 4
                                    AND bill_status != 9
                                    AND bill_status != 8
                                    AND bill_status != 10;`;
                    const [userRow1] = await db.execute(checkAllApp, [request.request_id]);
                    console.log(userRow1[0].status);

                    if (userRow1[0].status == 'All Approved') {
                        req_status = 'F';
                        aproval_status = 4;

                        const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                        await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                        const sql_aprove_req2 = 'UPDATE tbl_expenses SET button_status = ?, comment = NULL WHERE request_id = ? AND bill_status NOT IN (8, 9, 10)';
                        await db.execute(sql_aprove_req2, [0, request.request_id]);

                    }
                    else {
                        const sql_up_aproved_count = `
                        SELECT COUNT(*) AS total_up_ap_expenses 
                        FROM tbl_expenses 
                        WHERE request_id = ? 
                        AND bill_status IN (6)
                    `;

                        const [rows1] = await db.execute(sql_up_aproved_count, [request.request_id]);

                        // Ensure rows exist before accessing the result
                        let total_up_count = (rows1.length > 0) ? rows1[0].total_up_ap_expenses : 0;

                        if (total_up_count > 0) {
                            const sql_check_bill_status = `
                                SELECT COUNT(*) AS count 
                                FROM tbl_expenses 
                                WHERE request_id = ? 
                                AND bill_status = 4
                            `;

                            const [rows] = await db.execute(sql_check_bill_status, [request.request_id]);

                            // Check if any records exist with bill_status = 4
                            // const hasBillStatus2 = rows[0].count > 0;
                            if (rows[0].count > 0) {
                                const sql_record_count = `
                                SELECT COUNT(*) AS total_expenses_record
                                FROM tbl_expenses 
                                WHERE request_id = ? 
                                AND bill_status IN (4, 6, 2, 8, 9, 10)`;

                                const [rowstotal] = await db.execute(sql_record_count, [request.request_id]);
                                if (rowstotal[0].total_expenses_record == total_expenses) {
                                    req_status = 'F';
                                    aproval_status = 4;

                                    const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                                    await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                                    const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ? AND bill_status = 4';
                                    await db.execute(sql_aprove_req2, [0, request.request_id]);
                                }
                            }

                        } else {
                            const sql_account_review_count = `
                                                        SELECT COUNT(*) AS total_review_expenses 
                                                        FROM tbl_expenses 
                                                        WHERE request_id = ? 
                                                        AND bill_status IN (5)
                                                    `;

                            const [rows_reviews] = await db.execute(sql_account_review_count, [request.request_id]);

                            // Ensure rows exist before accessing the result
                            let total_a_review_count = (rows_reviews.length > 0) ? rows_reviews[0].total_review_expenses : 0;
                            if (total_a_review_count > 0) {
                                req_status = 'M';
                                aproval_status = 5;
                                const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                                await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);
                            } else {
                                req_status = 'M';
                                aproval_status = 1;
                                const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                                await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);
                            }
                        }

                        // const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ?';
                        // await db.execute(sql_aprove_req2, [0, request.request_id]);

                        // const sql_expense_review = 'SELECT status FROM tbl_reimbursment_request WHERE request_id = ?';
                        // const [rows] = await db.execute(sql_expense_review, [request.request_id]);

                        // if (rows.length > 0) {  // Ensure rows exist
                        //     let status = rows[0].status;
                        //     console.log(status);

                        //     if (status === 'F') {
                        //         const sql_aprove_req2 = 'UPDATE tbl_expenses SET button_status = ? WHERE request_id = ? AND bill_status = 4 AND button_status = 1';
                        //         await db.execute(sql_aprove_req2, [0, request.request_id]);
                        //     }
                        // } else {
                        //     console.log(`No record found for request_id: ${request.request_id}`);
                        // }
                    }
                }

            } else if (request.role == 'Finance') {
                req_status = '';
                aproval_status = 0;

                const checkAllReject = `SELECT 
                            CASE 
                                WHEN COUNT(*) = COUNT(CASE WHEN bill_status = 10 THEN 1 END) 
                                THEN 'All Rejected' 
                                ELSE 'Pending' 
                            END AS status
                        FROM tbl_expenses
                        WHERE request_id = ?;`;
                const [userRowRej] = await db.execute(checkAllReject, [request.request_id]);

                if (userRowRej[0].status == 'All Rejected') {
                    req_status = 'R';
                    aproval_status = 10;

                    const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                    await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                    // const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ?';
                    // await db.execute(sql_aprove_req2, [0, request.request_id]);
                }

                const sql_expense_count = 'SELECT COUNT(*) AS total_expenses FROM tbl_expenses WHERE request_id = ?';
                const [rows] = await db.execute(sql_expense_count, [request.request_id]);
                let total_expenses = rows[0].total_expenses; // Returning the count

                const sql_expense_button_status = 'SELECT COUNT(*) AS total_button_expenses FROM tbl_expenses WHERE request_id = ? AND button_status = ?';
                const [rows1] = await db.execute(sql_expense_button_status, [request.request_id, 1]);
                let total_button_expenses = rows1[0].total_button_expenses; // Returning the count

                if (total_expenses == total_button_expenses) {
                    const checkAllApp = `SELECT 
                                        CASE 
                                            WHEN COUNT(*) = 0 THEN 'All Approved' 
                                            ELSE 'Pending' 
                                        END AS status
                                    FROM tbl_expenses
                                    WHERE request_id = ? 
                                    AND bill_status <> 6
                                    AND bill_status != 9
                                    AND bill_status != 8
                                    AND bill_status != 10;`;
                    const [userRow1] = await db.execute(checkAllApp, [request.request_id]);
                    console.log(userRow1[0].status);

                    if (userRow1[0].status == 'All Approved') {
                        req_status = 'S';
                        aproval_status = 6;
                        settled = true; // Mark as settled

                        const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                        await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);

                        const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ?, comment = NULL WHERE request_id = ? AND bill_status NOT IN (8, 9, 10)';
                        await db.execute(sql_aprove_req2, [0, request.request_id]);

                        const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");

                        const sql_get_user = 'SELECT user_id FROM tbl_reimbursment_request WHERE request_id = ?;'
                        const [userRow] = await db.execute(sql_get_user, [request.request_id]);

                        if (userRow.length === 0) {
                            throw new Error("Employee ID not found for request ID: " + request.request_id);
                        }

                        const emp_id = userRow[0].user_id;

                        // Get total advance payment
                        const sql_get_advance = 'SELECT amount as total_amount FROM tbl_master_advance WHERE emp_id = ?;'
                        const [advanceRow] = await db.execute(sql_get_advance, [emp_id]);

                        // const totalAdvanceAmount = rows[0]?.total_amount || 0;
                        const totalAdvanceAmount = advanceRow.length > 0 ? advanceRow[0].total_amount || 0 : 0;

                        // Get total advance payment
                        // const sql_get_totalAmount = 'SELECT count(amount) as total_amount FROM tbl_expenses WHERE bill_status == 8 && request_id = ?;'
                        // const [totalAmountRow] = await db.execute(sql_get_advance, [emp_id]);
                        // const totalAmount = totalAmountRow[0];

                        const sql_get_totalAmount = 'SELECT SUM(amount) AS total_amount FROM tbl_expenses WHERE bill_status = 6 AND request_id = ?;';
                        const [totalAmountRow] = await db.execute(sql_get_totalAmount, [request.request_id]);
                        const totalAmount = totalAmountRow[0]?.total_amount || 0; // Handle null values


                        let paid_by_advance = 0;
                        let to_be_paid = totalAmount;
                        let advance_rem = 0;
                        if (totalAdvanceAmount > totalAmount) {
                            advance_rem = totalAdvanceAmount - totalAmount;
                            paid_by_advance = totalAmount;
                            to_be_paid = 0;
                        } else {
                            to_be_paid = totalAmount - totalAdvanceAmount;
                            advance_rem = 0;
                            paid_by_advance = totalAdvanceAmount;
                        }
                        if (advanceRow.length > 0) {
                            const sql_update_advance = 'UPDATE tbl_master_advance SET amount = ? WHERE emp_id = ?';
                            await db.execute(sql_update_advance, [advance_rem, emp_id]);
                        }

                        const sql_insert_settlement = 'INSERT INTO tbl_final_settlement (emp_id,req_id,paid_by_advance,to_be_paid,claim_amount,date) values(?, ?, ?, ?, ?, ?);'
                        const result = await db.execute(sql_insert_settlement, [emp_id, request.request_id, paid_by_advance, to_be_paid, totalAmount, currentDateTime]);

                        // if (result.insertId) {
                        //     aproval_status = 7;
                        //     const sql_aprove_req1 = 'Update tbl_reimbursment_request SET aproval_status = ? WHERE request_id = ?';
                        //     await db.execute(sql_aprove_req1, [aproval_status, request.request_id]);
                        // }
                    }
                    else {
                        const sql_finance_review_count = `
                                                        SELECT COUNT(*) AS total_review_expenses 
                                                        FROM tbl_expenses 
                                                        WHERE request_id = ? 
                                                        AND bill_status IN (7)
                                                    `;

                        const [rows_reviews] = await db.execute(sql_finance_review_count, [request.request_id]);

                        // Ensure rows exist before accessing the result
                        let total_f_review_count = (rows_reviews.length > 0) ? rows_reviews[0].total_review_expenses : 0;
                        if (total_f_review_count > 0) {
                            req_status = 'M';
                            aproval_status = 7;
                            const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                            await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);
                        } else {
                            req_status = 'M';
                            aproval_status = 1;

                            const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
                            await db.execute(sql_aprove_req1, [req_status, aproval_status, request.request_id]);
                        }
                        //     // const sql_aprove_req2 = 'Update tbl_expenses SET button_status = ? WHERE request_id = ?';
                        //     // await db.execute(sql_aprove_req2, [0, request.request_id]);
                    }
                }
            }
            // const sql_aprove_req1 = 'Update tbl_reimbursment_request SET status = ?, aproval_status = ? WHERE request_id = ?';
            // await db.execute(sql_aprove_req1, [request.status, aproval_status, request.request_id]);

            await db.commit();
            return { success: true, settled };
        } catch (error) {
            await db.rollback();
            // return { success: false };
            console.error(error);
            throw error;
        }
    }
}

module.exports = User;