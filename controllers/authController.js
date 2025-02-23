const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
exports.signup = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        const existingUser = await User.findUserByEmail(email);
        if (existingUser) return res.status(400).json({ message: 'User already exists' });
        await User.createUser(first_name, last_name, email, password);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findUserByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const { first_name, last_name } = user;
        req.session.user = { first_name, last_name, email };
        // return res.json({ message: "Login successful", user: req.session.user });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: "Login successful", user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.json({ message: "Logged out successfully" });
    });
};

exports.getDashboard = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ message: `Welcome ${req.session.user.first_name}` });
};

exports.reimbursmentRequest = (req, res) => {
    const request = req.body;
    User.createRequest(request);
    // console.log(user_id,project_id,team_no,status,reimbursement[0].description);
    
}